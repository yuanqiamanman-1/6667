from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import uuid

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.schemas import conversation as schemas

router = APIRouter()


def _is_participant(db: Session, conversation_id: str, user_id: str) -> bool:
    return (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.conversation_id == conversation_id)
        .filter(ConversationParticipant.user_id == user_id)
        .count()
        > 0
    )


@router.get("", response_model=List[schemas.ConversationListItem])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    conv_ids = (
        db.query(ConversationParticipant.conversation_id)
        .filter(ConversationParticipant.user_id == current_user.id)
        .all()
    )
    ids = [c[0] for c in conv_ids]
    if not ids:
        return []

    last_by_conv = (
        db.query(Message.conversation_id, func.max(Message.created_at).label("last_at"))
        .filter(Message.conversation_id.in_(ids))
        .group_by(Message.conversation_id)
        .all()
    )
    last_time_map = {cid: last_at for cid, last_at in last_by_conv}

    last_messages = {}
    if last_time_map:
        rows = (
            db.query(Message)
            .filter(Message.conversation_id.in_(list(last_time_map.keys())))
            .all()
        )
        for m in rows:
            if last_time_map.get(m.conversation_id) == m.created_at:
                last_messages[m.conversation_id] = m

    participants = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.conversation_id.in_(ids))
        .all()
    )
    peer_by_conv: dict[str, Optional[str]] = {}
    for p in participants:
        if p.user_id == current_user.id:
            continue
        peer_by_conv[p.conversation_id] = p.user_id

    peer_users = db.query(User).filter(User.id.in_(list(peer_by_conv.values()))).all() if peer_by_conv else []
    peer_user_map = {u.id: u for u in peer_users}

    min_dt = datetime(1970, 1, 1)
    unread_rows = (
        db.query(Message.conversation_id, func.count(Message.id))
        .join(
            ConversationParticipant,
            and_(
                ConversationParticipant.conversation_id == Message.conversation_id,
                ConversationParticipant.user_id == current_user.id,
            ),
        )
        .filter(Message.conversation_id.in_(ids))
        .filter(Message.sender_id != current_user.id)
        .filter(Message.created_at > func.coalesce(ConversationParticipant.last_read_at, min_dt))
        .group_by(Message.conversation_id)
        .all()
    )
    unread_map = {cid: int(cnt or 0) for cid, cnt in unread_rows}

    result: list[dict] = []
    for cid in ids:
        peer_id = peer_by_conv.get(cid)
        peer = peer_user_map.get(peer_id) if peer_id else None
        last = last_messages.get(cid)
        unread_count = unread_map.get(cid, 0)
        result.append(
            {
                "id": cid,
                "peer_user": (
                    {"id": peer.id, "username": peer.username, "full_name": peer.full_name}
                    if peer
                    else None
                ),
                "last_message": last.content if last else None,
                "last_message_at": last.created_at if last else None,
                "unread_count": unread_count,
            }
        )
    result.sort(key=lambda x: x["last_message_at"] or x["id"], reverse=True)
    return result


@router.get("/unread-count", response_model=dict)
def get_unread_conversations_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    conv_ids = (
        db.query(ConversationParticipant.conversation_id)
        .filter(ConversationParticipant.user_id == current_user.id)
        .all()
    )
    ids = [c[0] for c in conv_ids]
    if not ids:
        return {"unread_conversations_count": 0}

    min_dt = datetime(1970, 1, 1)
    unread_rows = (
        db.query(Message.conversation_id, func.count(Message.id))
        .join(
            ConversationParticipant,
            and_(
                ConversationParticipant.conversation_id == Message.conversation_id,
                ConversationParticipant.user_id == current_user.id,
            ),
        )
        .filter(Message.conversation_id.in_(ids))
        .filter(Message.sender_id != current_user.id)
        .filter(Message.created_at > func.coalesce(ConversationParticipant.last_read_at, min_dt))
        .group_by(Message.conversation_id)
        .all()
    )
    unread_conversations_count = sum(1 for _, cnt in unread_rows if (cnt or 0) > 0)
    return {"unread_conversations_count": unread_conversations_count}


@router.post("", response_model=schemas.ConversationListItem)
def create_or_get_conversation(
    payload: schemas.ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if payload.peer_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="peer_user_id invalid")
    peer = db.query(User).filter(User.id == payload.peer_user_id).first()
    if not peer or not peer.is_active:
        raise HTTPException(status_code=404, detail="User not found")

    c1 = db.query(ConversationParticipant.conversation_id).filter(ConversationParticipant.user_id == current_user.id).subquery()
    c2 = db.query(ConversationParticipant.conversation_id).filter(ConversationParticipant.user_id == payload.peer_user_id).subquery()
    existing = db.query(Conversation).filter(Conversation.id.in_(c1)).filter(Conversation.id.in_(c2)).first()

    if not existing:
        existing = Conversation(id=str(uuid.uuid4()))
        db.add(existing)
        db.add(
            ConversationParticipant(
                id=str(uuid.uuid4()),
                conversation_id=existing.id,
                user_id=current_user.id,
            )
        )
        db.add(
            ConversationParticipant(
                id=str(uuid.uuid4()),
                conversation_id=existing.id,
                user_id=payload.peer_user_id,
            )
        )
        db.commit()
        db.refresh(existing)

    return {
        "id": existing.id,
        "peer_user": {"id": peer.id, "username": peer.username, "full_name": peer.full_name},
        "last_message": None,
        "last_message_at": None,
    }


@router.get("/{conversation_id}/messages", response_model=List[schemas.MessageOut])
def list_messages(
    conversation_id: str,
    page_size: int = 50,
    page_cursor: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not _is_participant(db, conversation_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    q = db.query(Message).filter(Message.conversation_id == conversation_id)
    if page_cursor:
        q = q.filter(Message.id < page_cursor)
    q = q.order_by(Message.created_at.desc()).limit(max(1, min(page_size, 200)))
    items = list(reversed(q.all()))

    sender_ids = list({m.sender_id for m in items})
    senders = db.query(User).filter(User.id.in_(sender_ids)).all() if sender_ids else []
    sender_map = {u.id: u for u in senders}

    result: list[dict] = []
    for m in items:
        u = sender_map.get(m.sender_id)
        result.append(
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "sender": {
                    "id": u.id if u else m.sender_id,
                    "username": u.username if u else "",
                    "full_name": u.full_name if u else None,
                },
                "content": m.content,
                "created_at": m.created_at,
            }
        )
    return result


@router.post("/{conversation_id}/read", response_model=dict)
def mark_conversation_read(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    participant = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.conversation_id == conversation_id)
        .filter(ConversationParticipant.user_id == current_user.id)
        .first()
    )
    if not participant:
        raise HTTPException(status_code=403, detail="Not authorized")
    participant.last_read_at = datetime.utcnow()
    db.add(participant)
    db.commit()
    return {"status": "ok"}


@router.post("/{conversation_id}/messages", response_model=schemas.MessageOut)
def send_message(
    conversation_id: str,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not _is_participant(db, conversation_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    content = payload.content.strip()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="content required")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="content too long")

    msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender": {"id": current_user.id, "username": current_user.username, "full_name": current_user.full_name},
        "content": msg.content,
        "created_at": msg.created_at,
    }
