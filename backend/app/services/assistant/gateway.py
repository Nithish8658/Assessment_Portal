"""
FastAPI WebSocket Gateway & Session Runtime Layer.
Provides:
- WebSocketGateway (Active Connection Management & JWT Authentication)
- AssistantSession (Per-Thread Runtime with PostgreSQL History Persistence)
- Strict RBAC Guard (Restricted to HoD and Administrator accounts)
"""

import json
import logging
import datetime
from typing import Dict, Any, List, Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.config import SECRET_KEY, ALGORITHM
from app.models.models import User, Department
from app.models.assessment_models import AssistantChatSession

from app.services.assistant.tools import UserContext
from app.services.assistant.master_agent import AutonomousMasterAgent

logger = logging.getLogger(__name__)

class AssistantSession:
    """
    Encapsulates a user's active assistant session thread with persistent PostgreSQL history.
    """

    def __init__(self, session_id: str, ctx: UserContext):
        self.session_id = session_id
        self.ctx = ctx
        self.agent = AutonomousMasterAgent(user_context=ctx)

    def load_or_create_chat_session(self, db: Session) -> AssistantChatSession:
        """
        Retrieves existing session thread from PostgreSQL or initializes a new one.
        """
        session_record = db.query(AssistantChatSession).filter(
            AssistantChatSession.session_id == self.session_id
        ).first()

        if not session_record:
            welcome_msg = (
                f"**Welcome, {self.ctx.user_name}!**\n\n"
                f"I am your **MockRun Autonomous AI Executive Copilot** (powered by **OpenLectern**) for Nehru Arts and Science College.\n\n"
                f"I have direct read-only analytical access across your permitted scope (*{self.ctx.department_name or self.ctx.primary_role}*). "
                f"Ask me any question regarding student performance, class averages, question banks, or live screen data."
            )
            session_record = AssistantChatSession(
                session_id=self.session_id,
                user_id=self.ctx.user_id,
                user_role=self.ctx.primary_role,
                department_id=self.ctx.department_id,
                title=f"Chat ({self.ctx.primary_role})",
                messages_json=[
                    {
                        "id": "welcome_init",
                        "sender": "assistant",
                        "text": welcome_msg,
                        "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
                    }
                ]
            )
            db.add(session_record)
            db.commit()
            db.refresh(session_record)

        return session_record

    def append_message_to_db(
        self,
        db: Session,
        sender: str,
        text: str,
        page_context: Optional[Dict[str, Any]] = None,
        tools_executed: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Appends a message atomically to PostgreSQL assistant_chat_sessions.
        """
        session_record = db.query(AssistantChatSession).filter(
            AssistantChatSession.session_id == self.session_id
        ).first()

        if not session_record:
            session_record = self.load_or_create_chat_session(db)

        current_msgs = list(session_record.messages_json or [])
        msg_entry = {
            "id": f"msg_{int(datetime.datetime.utcnow().timestamp() * 1000)}",
            "sender": sender,
            "text": text,
            "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
        }
        if page_context:
            msg_entry["page_context"] = {
                "path": page_context.get("current_path"),
                "title": page_context.get("page_title")
            }
        if tools_executed:
            msg_entry["tools_executed"] = tools_executed

        current_msgs.append(msg_entry)
        session_record.messages_json = current_msgs
        session_record.updated_at = datetime.datetime.utcnow()
        db.commit()


class WebSocketGateway:
    """
    Central connection gateway managing WebSocket lifecycles, JWT auth, and event routing.
    """

    def __init__(self):
        self.active_sessions: Dict[str, AssistantSession] = {}

    def authenticate_handshake(self, token: Optional[str], db: Session) -> UserContext:
        """
        Validates JWT token and creates UserContext with role and department metadata.
        Raises ValueError on any authentication or authorization failure.
        """
        if not token:
            raise ValueError("Authentication token required.")

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if not username:
                raise ValueError("Invalid authentication token payload.")
        except JWTError as e:
            raise ValueError(f"Token decoding failed: {str(e)}")

        user = db.query(User).filter(User.username == username, User.is_active == True).first()
        if not user:
            raise ValueError("Authenticated user not found or inactive.")

        role_names = [r.name for r in user.roles]

        # Strict RBAC Guard: Only HoD, Administrator, Super Admin, Assessment Coordinator
        is_admin = any(r in ["Administrator", "Super Admin", "Assessment Coordinator"] for r in role_names)
        is_hod = any(r in ["HoD", "Head of Department"] for r in role_names)

        if not is_admin and not is_hod:
            raise PermissionError("Access denied: Assistant is restricted strictly to HoD and Administrator accounts.")

        primary_role = "Administrator" if is_admin else "HoD"
        dept_id = None
        dept_name = None
        dept_code = None

        if user.faculty_profile and user.faculty_profile.department_id:
            dept_id = user.faculty_profile.department_id
            dept = db.query(Department).filter(Department.id == dept_id).first()
            if dept:
                dept_name = dept.name
                dept_code = dept.code

        return UserContext(
            user_id=user.id,
            user_name=user.full_name or user.username,
            roles=role_names,
            primary_role=primary_role,
            department_id=dept_id,
            department_name=dept_name,
            department_code=dept_code
        )

    async def handle_connection(
        self,
        websocket: WebSocket,
        token: Optional[str],
        session_id: Optional[str],
        db: Session
    ):
        """
        Main WebSocket connection loop.
        Authenticates handshake, streams historical messages, and handles incoming queries.
        """
        # 1. Accept connection first so the HTTP 101 WebSocket upgrade handshake completes cleanly
        await websocket.accept()

        # 2. Authenticate & authorize
        try:
            ctx = self.authenticate_handshake(token, db)
        except PermissionError as pe:
            logger.warning("WebSocket unauthorized role: %s", pe)
            await websocket.close(code=4403, reason=str(pe))
            return
        except ValueError as ve:
            logger.warning("WebSocket auth failed: %s", ve)
            await websocket.close(code=4401, reason=str(ve))
            return

        resolved_session_id = session_id or f"sess_{ctx.user_id}_{int(datetime.datetime.utcnow().timestamp())}"
        session = AssistantSession(session_id=resolved_session_id, ctx=ctx)
        self.active_sessions[resolved_session_id] = session

        try:
            # 3. Load previous history from PostgreSQL
            session_record = session.load_or_create_chat_session(db)
            await websocket.send_json({
                "type": "history",
                "session_id": session.session_id,
                "messages": session_record.messages_json or [],
                "user_role": ctx.primary_role,
                "department_name": ctx.department_name,
                "user_name": ctx.user_name
            })

            # 4. Process incoming events
            while True:
                raw_text = await websocket.receive_text()
                try:
                    event = json.loads(raw_text)
                except Exception:
                    continue

                event_type = event.get("type", "message")

                if event_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue

                if event_type == "clear_history":
                    session_record.messages_json = [
                        {
                            "id": "welcome_reset",
                            "sender": "assistant",
                            "text": f"Conversation history cleared. Ready for queries on: **{ctx.department_name or 'Institutional Overview'}**.",
                            "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
                        }
                    ]
                    db.commit()
                    await websocket.send_json({
                        "type": "history",
                        "session_id": session.session_id,
                        "messages": session_record.messages_json,
                        "user_role": ctx.primary_role,
                        "department_name": ctx.department_name
                    })
                    continue

                if event_type == "message":
                    user_text = (event.get("text") or "").strip()
                    if not user_text:
                        continue

                    page_context = event.get("page_context") or {}

                    # Commit user message to PostgreSQL
                    session.append_message_to_db(
                        db=db,
                        sender="user",
                        text=user_text,
                        page_context=page_context
                    )

                    # Callback for streaming real-time tokens to client
                    async def on_token(token_text: str):
                        try:
                            await websocket.send_json({
                                "type": "token",
                                "text": token_text
                            })
                        except Exception as err:
                            logger.error("Error streaming token to client: %s", err)

                    # Callback for tool execution status
                    async def on_tool_call(tool_name: str, args: Dict[str, Any]):
                        try:
                            await websocket.send_json({
                                "type": "tool_start",
                                "name": tool_name,
                                "args": args
                            })
                        except Exception as err:
                            logger.error("Error sending tool status: %s", err)

                    try:
                        # Autonomous Agent Execution Turn
                        turn_result = await session.agent.process_utterance(
                            utterance=user_text,
                            conversation_history=session_record.messages_json or [],
                            page_context=page_context,
                            on_token=on_token,
                            on_tool_call=on_tool_call
                        )

                        # Commit completed assistant response to PostgreSQL
                        session.append_message_to_db(
                            db=db,
                            sender="assistant",
                            text=turn_result["response"],
                            tools_executed=turn_result.get("tools_executed")
                        )

                        # Send completion event
                        await websocket.send_json({
                            "type": "turn_complete",
                            "text": turn_result["response"],
                            "tools_executed": turn_result.get("tools_executed", []),
                            "timestamp": turn_result.get("timestamp")
                        })

                    except Exception as err:
                        logger.exception("Error during autonomous agent turn: %s", err)
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Autonomous Assistant encountered an issue: {str(err)}"
                        })

        except (WebSocketDisconnect, ConnectionResetError):
            logger.info("WebSocket disconnected gracefully: session_id=%s", resolved_session_id)
        except Exception as e:
            logger.warning("WebSocket disconnected with exception: session_id=%s, err=%s", resolved_session_id, e)
        finally:
            if resolved_session_id in self.active_sessions:
                del self.active_sessions[resolved_session_id]

websocket_gateway = WebSocketGateway()
