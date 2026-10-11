"""
WebSocket transport for the assistant (useful on hosts that support WebSockets, e.g. local
development). Production on Vercel uses the HTTP endpoint instead; both call the same
chat_service, so behaviour, limits and storage are identical.
"""

import json
import logging
from typing import Optional

from fastapi import HTTPException, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import ALGORITHM, SECRET_KEY
from app.models.models import User
from app.services.assistant import chat_service

logger = logging.getLogger(__name__)


class WebSocketGateway:
    def _authenticate(self, token: Optional[str], db: Session):
        if not token:
            raise ValueError("Authentication token required.")
        try:
            username = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]).get("sub")
        except JWTError as e:
            raise ValueError(f"Token decoding failed: {e}")
        user = db.query(User).filter(User.username == username, User.is_active == True).first()
        if not user:
            raise ValueError("Authenticated user not found or inactive.")
        return chat_service.build_user_context(user, db)

    async def handle_connection(self, websocket: WebSocket, token: Optional[str], session_id: Optional[str], db: Session):
        await websocket.accept()
        try:
            ctx = self._authenticate(token, db)
        except HTTPException as he:
            await websocket.close(code=4403, reason=str(he.detail))
            return
        except ValueError as ve:
            await websocket.close(code=4401, reason=str(ve))
            return

        try:
            rec = chat_service.get_or_create_session(db, ctx, session_id)
            sid = rec.session_id
            await websocket.send_json({
                "type": "history", "session_id": sid, "messages": rec.messages_json or [],
                "user_role": ctx.primary_role, "department_name": ctx.department_name, "user_name": ctx.user_name,
            })
            db.commit()  # never sit idle inside an open transaction

            while True:
                try:
                    event = json.loads(await websocket.receive_text())
                except (ValueError, TypeError):
                    continue
                etype = event.get("type", "message")
                if etype == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue
                if etype == "clear_history":
                    msgs = chat_service.clear_session(db, ctx, sid)
                    await websocket.send_json({"type": "history", "session_id": sid, "messages": msgs,
                                               "user_role": ctx.primary_role, "department_name": ctx.department_name})
                    continue
                if etype != "message":
                    continue

                async def on_token(chunk: str):
                    try:
                        await websocket.send_json({"type": "token", "text": chunk})
                    except Exception:
                        pass

                async def on_tool_call(name, args):
                    try:
                        await websocket.send_json({"type": "tool_start", "name": name, "args": args})
                    except Exception:
                        pass

                try:
                    out = await chat_service.handle_message(db, ctx, sid, event.get("text", ""), event.get("page_context") or {},
                                                            on_token=on_token, on_tool_call=on_tool_call)
                    msg = out["message"]
                    await websocket.send_json({"type": "turn_complete", "text": msg["text"],
                                               "tools_executed": msg.get("tools_executed") or [], "timestamp": msg["timestamp"]})
                except HTTPException as he:
                    await websocket.send_json({"type": "error", "message": str(he.detail)})
                finally:
                    db.commit()
        except (WebSocketDisconnect, ConnectionResetError):
            logger.info("Assistant WebSocket disconnected")
        except Exception as e:
            logger.warning("Assistant WebSocket closed with error: %s", e)


websocket_gateway = WebSocketGateway()
