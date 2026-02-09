from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import json
import uuid

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.user import User as UserSchema


router = APIRouter()


def _is_hq(user: User) -> bool:
    return any(r.role_code == "association_hq" for r in user.admin_roles or [])


def _is_aid_admin(user: User) -> bool:
    return any(r.role_code == "aid_school_admin" for r in user.admin_roles or [])


def _parse_profile(profile_text: str | None) -> dict:
    if not profile_text:
        return {}
    try:
        v = json.loads(profile_text)
        return v if isinstance(v, dict) else {}
    except Exception:
        return {}


def _write_profile(user: User, profile: dict) -> None:
    user.profile = json.dumps(profile, ensure_ascii=False)

def _notify(db: Session, user_id: str, type: str, payload: dict) -> None:
    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=type,
            payload=json.dumps(payload, ensure_ascii=False),
        )
    )


@router.get("/students", response_model=List[UserSchema])
def list_aid_students(
    aid_school_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not (current_user.is_superuser or _is_hq(current_user) or _is_aid_admin(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized")

    target = aid_school_id
    if _is_aid_admin(current_user) and not current_user.is_superuser and not _is_hq(current_user):
        target = current_user.school_id

    if not target:
        raise HTTPException(status_code=400, detail="aid_school_id required")

    return (
        db.query(User)
        .filter(User.role == "special_aid_student")
        .filter(User.school_id == target)
        .filter(User.is_active == True)
        .order_by(User.created_at.desc())
        .all()
    )


@router.post("/students/{user_id}/revoke", response_model=dict)
def revoke_aid_student(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not (current_user.is_superuser or _is_hq(current_user) or _is_aid_admin(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "special_aid_student":
        raise HTTPException(status_code=400, detail="Not a aid student")

    if _is_aid_admin(current_user) and not current_user.is_superuser and not _is_hq(current_user):
        if user.school_id != current_user.school_id:
            raise HTTPException(status_code=403, detail="Not authorized")

    profile = _parse_profile(user.profile)
    verification = profile.get("verification") if isinstance(profile.get("verification"), dict) else {}
    verification["aid"] = "none"
    profile["verification"] = verification
    _write_profile(user, profile)
    user.role = "general_student"
    user.school_id = None
    db.add(user)
    _notify(db, user.id, "verification_revoked", {"verification_type": "special_aid", "reason": "revoked"})
    db.commit()
    return {"status": "revoked"}
