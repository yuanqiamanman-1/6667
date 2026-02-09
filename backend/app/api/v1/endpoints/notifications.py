from typing import Any, List, Optional
from datetime import datetime
import uuid
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut


router = APIRouter()


def create_notification(db: Session, user_id: str, type: str, payload: Any) -> None:
    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=type,
            payload=json.dumps(payload, ensure_ascii=False) if payload is not None else None,
        )
    )


@router.get("", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.read_at.is_(None))
    items = q.order_by(Notification.created_at.desc()).limit(limit).all()
    result: list[dict] = []
    for n in items:
        try:
            payload = json.loads(n.payload) if n.payload else None
        except Exception:
            payload = None
        result.append(
            {
                "id": n.id,
                "type": n.type,
                "payload": payload,
                "read_at": n.read_at,
                "created_at": n.created_at,
            }
        )
    return result


@router.get("/unread-count", response_model=dict)
def get_unread_notifications_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    cnt = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .filter(Notification.read_at.is_(None))
        .count()
    )
    return {"unread_count": int(cnt)}


@router.post("/{notification_id}/read", response_model=dict)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .filter(Notification.user_id == current_user.id)
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if not n.read_at:
        n.read_at = datetime.utcnow()
        db.add(n)
        db.commit()
    return {"status": "ok"}
