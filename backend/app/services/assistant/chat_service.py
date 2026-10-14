"""
Transport-agnostic assistant turn handling (used by the HTTP endpoint and the WebSocket).

Per message:
  1. Session ownership check; one in-flight message per user (lease "user_<id>").
  2. User message appended under a row lock (no lost updates across tabs).
  3. Small talk answered locally, without opening a Gemini Live session.
  4. Otherwise wait briefly for one of N shared Live slots (lease "live_slot_<n>"),
     run the turn with a hard timeout, append the reply, release everything.
No database transaction is held while Gemini is working.
"""

import asyncio
import datetime
import logging
import os
import re
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import Department, User
from app.models.assessment_models import AssistantChatSession
from app.services.assistant import leases
from app.services.assistant.master_agent import AutonomousMasterAgent
from app.services.assistant.tools import UserContext

logger = logging.getLogger(__name__)

LIVE_MAX_CONCURRENT_SESSIONS = int(os.getenv("ASSISTANT_LIVE_MAX_SESSIONS", "3"))
LIVE_SLOT_WAIT_SECONDS = float(os.getenv("ASSISTANT_LIVE_SLOT_WAIT_SECONDS", "15"))
TURN_TIMEOUT_SECONDS = float(os.getenv("ASSISTANT_TURN_TIMEOUT_SECONDS", "40"))
LEASE_TTL_SECONDS = int(TURN_TIMEOUT_SECONDS + LIVE_SLOT_WAIT_SECONDS + 15)
MAX_STORED_MESSAGES = 200
MAX_USER_MESSAGE_CHARS = 2000

ADMIN_ROLES = {"Administrator", "Super Admin"}
HOD_ROLES = {"HoD", "Head of Department"}

_SMALL_TALK = re.compile(
    r"^\s*(hi|hello|hey|hai|good (morning|afternoon|evening)|thanks?|thank you|thx|ok(ay)?|noted|great|"
    r"excellent|nice|cool|good job|well done|awesome|perfect|got it|bye|see you)[\s!.,]*$",
    re.IGNORECASE,
)


def _now_hm() -> str:
    """UTC ISO timestamp; the chat panel shows it in the viewer's local time."""
    return datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def build_user_context(user: User, db: Session) -> UserContext:
    """RBAC: only administrators/coordinators (institution-wide) and HoDs (own department)."""
    role_names = [r.name for r in user.roles]
    is_admin = any(r in ADMIN_ROLES for r in role_names)
    is_hod = any(r in HOD_ROLES for r in role_names)
    if not is_admin and not is_hod:
        raise HTTPException(status_code=403, detail="The assistant is available to HoD and Administrator accounts only.")
    dept_id = dept_name = dept_code = None
    if user.faculty_profile and user.faculty_profile.department_id:
        dept_id = user.faculty_profile.department_id
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if dept:
            dept_name, dept_code = dept.name, dept.code
    if is_hod and not is_admin and not dept_id:
        raise HTTPException(status_code=403, detail="Your HoD account is not linked to a department.")
    return UserContext(
        user_id=user.id,
        user_name=user.full_name or user.username,
        roles=role_names,
        primary_role="Administrator" if is_admin else "HoD",
        department_id=dept_id,
        department_name=dept_name,
        department_code=dept_code,
    )


def welcome_message(ctx: UserContext) -> Dict[str, Any]:
    return {
        "id": "welcome_init",
        "sender": "assistant",
        "text": (
            f"**Welcome, {ctx.user_name}!**\n\nI am your **MockRun AI Executive Copilot** (powered by **OpenLectern**). "
            f"I have read-only access to assessment data for *{ctx.department_name or 'all departments'}*. "
            "Ask about a student's latest grades, their progress across attempts, class results, pass rates or pending approvals."
        ),
        "timestamp": _now_hm(),
    }


def get_or_create_session(db: Session, ctx: UserContext, session_id: Optional[str]) -> AssistantChatSession:
    sid = (session_id or "").strip()[:64] or f"sess_{ctx.user_id}_{int(datetime.datetime.utcnow().timestamp())}"
    rec = db.query(AssistantChatSession).filter(AssistantChatSession.session_id == sid).first()
    if rec and rec.user_id != ctx.user_id:
        raise HTTPException(status_code=403, detail="This conversation belongs to another user.")
    if not rec:
        rec = AssistantChatSession(
            session_id=sid, user_id=ctx.user_id, user_role=ctx.primary_role, department_id=ctx.department_id,
            title=f"Chat ({ctx.primary_role})", messages_json=[welcome_message(ctx)],
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
    return rec


def append_message(db: Session, session_id: str, msg: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Appends under a row lock so concurrent tabs/requests never overwrite each other."""
    rec = db.query(AssistantChatSession).filter(
        AssistantChatSession.session_id == session_id
    ).populate_existing().with_for_update().first()
    msgs = list(rec.messages_json or []) + [msg]
    rec.messages_json = msgs[-MAX_STORED_MESSAGES:]
    rec.updated_at = datetime.datetime.utcnow()
    db.commit()
    return msgs


def clear_session(db: Session, ctx: UserContext, session_id: str) -> List[Dict[str, Any]]:
    rec = get_or_create_session(db, ctx, session_id)
    rec = db.query(AssistantChatSession).filter(AssistantChatSession.id == rec.id).with_for_update().first()
    rec.messages_json = [{
        "id": "welcome_reset", "sender": "assistant", "timestamp": _now_hm(),
        "text": f"Conversation cleared. Ready for questions on **{ctx.department_name or 'all departments'}**.",
    }]
    rec.updated_at = datetime.datetime.utcnow()
    db.commit()
    return rec.messages_json


def _small_talk_reply(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ("thank", "thx")):
        return "You're welcome. Ask me anything else about your students or classes."
    if any(w in t for w in ("bye", "see you")):
        return "Goodbye. I'm here whenever you need assessment insights."
    if any(w in t for w in ("hi", "hello", "hey", "hai", "good morning", "good afternoon", "good evening")):
        return "Hello. Ask me about a student's latest grades, their progress, class results or pending approvals."
    return "Noted. What would you like to look at next?"


async def handle_message(
    db: Session,
    ctx: UserContext,
    session_id: Optional[str],
    text: str,
    page_context: Optional[Dict[str, Any]] = None,
    on_token=None,
    on_tool_call=None,
) -> Dict[str, Any]:
    text = (text or "").strip()[:MAX_USER_MESSAGE_CHARS]
    if not text:
        raise HTTPException(status_code=400, detail="Message is empty.")

    rec = get_or_create_session(db, ctx, session_id)
    sid = rec.session_id
    holder = leases.new_holder()
    user_key = f"user_{ctx.user_id}"
    if not leases.try_acquire(db, user_key, holder, LEASE_TTL_SECONDS):
        raise HTTPException(status_code=429, detail="Your previous question is still being answered. Please wait for it to finish.")

    slot_key = None
    try:
        history = append_message(db, sid, {
            "id": f"msg_{int(datetime.datetime.utcnow().timestamp() * 1000)}", "sender": "user", "text": text,
            "timestamp": _now_hm(),
            "page_context": {"path": (page_context or {}).get("current_path"), "title": (page_context or {}).get("page_title")} if page_context else None,
        })[:-1]

        tools_executed: List[Dict[str, Any]] = []
        if _SMALL_TALK.match(text):
            reply = _small_talk_reply(text)
            source = "local"
        else:
            slot_key = await leases.acquire_slot(db, "live_slot", LIVE_MAX_CONCURRENT_SESSIONS, holder, LEASE_TTL_SECONDS, LIVE_SLOT_WAIT_SECONDS)
            if not slot_key:
                reply = "⏳ The assistant is busy with other users right now. Please ask again in a few seconds."
                source = "busy"
            else:
                db.commit()  # make sure no transaction stays open while Gemini works
                agent = AutonomousMasterAgent(user_context=ctx)
                try:
                    result = await asyncio.wait_for(
                        agent.process_utterance(
                            utterance=text,
                            conversation_history=history,
                            page_context=page_context,
                            on_token=on_token,
                            on_tool_call=on_tool_call,
                        ),
                        timeout=TURN_TIMEOUT_SECONDS,
                    )
                    reply = result.get("response") or "I couldn't produce an answer for that. Please rephrase the question."
                    tools_executed = result.get("tools_executed", [])
                    source = "live"
                except asyncio.TimeoutError:
                    reply = "⏳ That question took too long to answer. Try narrowing it, for example to one class or student."
                    source = "timeout"
                except Exception as err:
                    logger.exception("Assistant turn failed: %s", err)
                    reply = "⚠️ The AI service is temporarily unavailable. Please try again shortly."
                    source = "error"

        assistant_msg = {
            "id": f"msg_{int(datetime.datetime.utcnow().timestamp() * 1000)}_a",
            "sender": "assistant",
            "text": reply,
            "timestamp": _now_hm(),
            # Keep stored history small: tool names and arguments, not full result payloads.
            "tools_executed": [{"tool": t.get("tool"), "arguments": t.get("arguments")} for t in tools_executed] or None,
        }
        append_message(db, sid, assistant_msg)
        return {"session_id": sid, "message": assistant_msg, "source": source}
    finally:
        leases.release(db, slot_key, holder)
        leases.release(db, user_key, holder)
