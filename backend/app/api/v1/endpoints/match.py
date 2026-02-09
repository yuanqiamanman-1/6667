from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
import json

from app.api import deps
from app.db.session import get_db
from app.models.match import PointTxn, MatchRequest
from app.schemas import match as schemas
from app.models.user import User
from app.models.teacher_pool import TeacherPoolEntry
from app.models.match import MatchOffer
from app.models.notification import Notification
from app.models.core import Organization
from app.models.conversation import Conversation, ConversationParticipant, Message

router = APIRouter()


def _notify(db: Session, user_id: str, type: str, payload: dict) -> None:
    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=type,
            payload=json.dumps(payload, ensure_ascii=False),
        )
    )


def _get_or_create_conversation(db: Session, user_id: str, peer_user_id: str) -> str:
    c1 = db.query(ConversationParticipant.conversation_id).filter(ConversationParticipant.user_id == user_id).subquery()
    c2 = db.query(ConversationParticipant.conversation_id).filter(ConversationParticipant.user_id == peer_user_id).subquery()
    existing = db.query(Conversation).filter(Conversation.id.in_(c1)).filter(Conversation.id.in_(c2)).first()
    if existing:
        return existing.id
    conv = Conversation(id=str(uuid.uuid4()))
    db.add(conv)
    db.add(
        ConversationParticipant(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            user_id=user_id,
        )
    )
    db.add(
        ConversationParticipant(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            user_id=peer_user_id,
        )
    )
    db.commit()
    db.refresh(conv)
    return conv.id

# =============================================================================
# 匹配与积分 API (Match & Points API)
# 功能：管理积分流水、余额查询和匹配请求。
# =============================================================================

# -----------------------------------------------------------------------------
# Points (积分体系)
# -----------------------------------------------------------------------------
@router.get("/points/balance", response_model=int)
def read_points_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    查询当前用户积分余额。
    - 通过聚合所有积分流水计算得出
    """
    balance = db.query(func.sum(PointTxn.points)).filter(PointTxn.user_id == current_user.id).scalar()
    return balance or 0

@router.get("/points/transactions", response_model=List[schemas.PointTxn])
def read_point_transactions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    查询积分交易明细。
    - 按时间倒序排列
    """
    return db.query(PointTxn).filter(PointTxn.user_id == current_user.id)\
        .order_by(PointTxn.created_at.desc())\
        .offset(skip).limit(limit).all()

# -----------------------------------------------------------------------------
# Match Requests (匹配请求)
# -----------------------------------------------------------------------------
@router.post("/requests", response_model=schemas.MatchRequest)
def create_match_request(
    request_in: schemas.MatchRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    提交新的匹配求助。
    - 学生发起，等待志愿者接单
    """
    request = MatchRequest(
        id=str(uuid.uuid4()),
        student_id=current_user.id,
        **request_in.dict()
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

@router.get("/requests/{id}", response_model=schemas.MatchRequest)
def read_match_request(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    查看匹配请求详情。
    - 仅发起人或相关方可见
    """
    request = db.query(MatchRequest).filter(MatchRequest.id == id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.student_id != current_user.id:
        offer = (
            db.query(MatchOffer)
            .filter(MatchOffer.request_id == request.id)
            .filter(MatchOffer.teacher_id == current_user.id)
            .first()
        )
        if not offer:
            raise HTTPException(status_code=403, detail="Not authorized")
    return request


@router.get("/requests/{id}/candidates", response_model=List[schemas.MatchCandidate])
def read_match_candidates(
    id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    request = db.query(MatchRequest).filter(MatchRequest.id == id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        want_tags = json.loads(request.tags or "[]")
        want_tags = [str(x) for x in want_tags] if isinstance(want_tags, list) else []
    except Exception:
        want_tags = []

    entries = db.query(TeacherPoolEntry).filter(TeacherPoolEntry.in_pool == True).all()
    users = (
        db.query(User)
        .filter(User.id.in_([e.user_id for e in entries]))
        .filter(User.is_active == True)
        .all()
        if entries
        else []
    )
    user_map = {u.id: u for u in users}

    scored: list[tuple[int, TeacherPoolEntry]] = []
    for e in entries:
        u = user_map.get(e.user_id)
        if not u:
            continue
        try:
            p = json.loads(u.profile or "{}")
            v = p.get("verification") if isinstance(p, dict) else {}
            teacher_ok = isinstance(v, dict) and v.get("teacher") == "verified"
        except Exception:
            teacher_ok = False
        if u.role != "volunteer_teacher" or not teacher_ok:
            continue
        try:
            t_tags = json.loads(e.tags or "[]")
            t_tags = [str(x) for x in t_tags] if isinstance(t_tags, list) else []
        except Exception:
            t_tags = []
        score = len(set(want_tags) & set(t_tags))
        scored.append((score, e))

    scored.sort(key=lambda x: x[0], reverse=True)
    school_ids = sorted({e.school_id for _, e in scored if e.school_id})
    orgs = (
        db.query(Organization)
        .filter(Organization.type == "university")
        .filter(Organization.school_id.in_(school_ids))
        .all()
        if school_ids
        else []
    )
    school_name_by_id = {o.school_id: (o.display_name or o.school_id) for o in orgs}
    result: list[schemas.MatchCandidate] = []
    for score, e in scored[: max(1, min(limit, 50))]:
        u = user_map.get(e.user_id)
        if not u:
            continue
        try:
            t_tags = json.loads(e.tags or "[]")
            t_tags = [str(x) for x in t_tags] if isinstance(t_tags, list) else []
        except Exception:
            t_tags = []
        matched = [t for t in want_tags if t in set(t_tags)]
        explain = f"标签匹配：{('、'.join(matched) if matched else '无')}"
        result.append({
            "user_id": e.user_id,
            "username": u.username if u else "",
            "full_name": u.full_name if u else None,
            "school_id": e.school_id,
            "school_display_name": school_name_by_id.get(e.school_id),
            "tags": json.loads(e.tags or "[]"),
            "time_slots": json.loads(e.time_slots or "[]"),
            "in_pool": bool(e.in_pool),
            "explain": explain,
        })
    return result


@router.get("/requests/{id}/results", response_model=List[schemas.MatchCandidate])
def read_match_results(
    id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    return read_match_candidates(id=id, limit=limit, db=db, current_user=current_user)


@router.post("/requests/{id}/offers", response_model=schemas.MatchOffer)
def create_match_offer(
    id: str,
    teacher_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    req = db.query(MatchRequest).filter(MatchRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or not teacher.is_active:
        raise HTTPException(status_code=404, detail="Teacher not found")
    try:
        p = json.loads(teacher.profile or "{}")
        v = p.get("verification") if isinstance(p, dict) else {}
        teacher_ok = isinstance(v, dict) and v.get("teacher") == "verified"
    except Exception:
        teacher_ok = False
    if teacher.role != "volunteer_teacher" or not teacher_ok:
        raise HTTPException(status_code=400, detail="Teacher not eligible")

    existing = (
        db.query(MatchOffer)
        .filter(MatchOffer.request_id == req.id)
        .filter(MatchOffer.teacher_id == teacher_id)
        .first()
    )
    if existing:
        return existing

    offer = MatchOffer(
        id=str(uuid.uuid4()),
        request_id=req.id,
        student_id=req.student_id,
        teacher_id=teacher_id,
        status="pending",
    )
    db.add(offer)
    _notify(
        db,
        teacher_id,
        "match_offer_created",
        {"request_id": req.id, "offer_id": offer.id, "student_id": req.student_id},
    )
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/offers/inbox", response_model=List[dict])
def list_teacher_offers_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    try:
        p = json.loads(current_user.profile or "{}")
        v = p.get("verification") if isinstance(p, dict) else {}
        teacher_ok = isinstance(v, dict) and v.get("teacher") == "verified"
    except Exception:
        teacher_ok = False
    if current_user.role != "volunteer_teacher" or not teacher_ok:
        raise HTTPException(status_code=403, detail="Not authorized")
    offers = (
        db.query(MatchOffer)
        .filter(MatchOffer.teacher_id == current_user.id)
        .filter(MatchOffer.status == "pending")
        .order_by(MatchOffer.created_at.desc())
        .limit(50)
        .all()
    )
    request_ids = list({o.request_id for o in offers})
    student_ids = list({o.student_id for o in offers})
    reqs = db.query(MatchRequest).filter(MatchRequest.id.in_(request_ids)).all() if request_ids else []
    students = db.query(User).filter(User.id.in_(student_ids)).all() if student_ids else []
    req_by_id = {r.id: r for r in reqs}
    stu_by_id = {u.id: u for u in students}
    result: list[dict] = []
    for o in offers:
        r = req_by_id.get(o.request_id)
        s = stu_by_id.get(o.student_id)
        result.append(
            {
                "id": o.id,
                "request_id": o.request_id,
                "student_id": o.student_id,
                "teacher_id": o.teacher_id,
                "status": o.status,
                "created_at": o.created_at,
                "updated_at": o.updated_at,
                "request": {
                    "id": r.id,
                    "tags": r.tags,
                    "channel": r.channel,
                    "time_mode": r.time_mode,
                    "time_slots": r.time_slots,
                    "note": r.note,
                    "status": r.status,
                    "created_at": r.created_at,
                }
                if r
                else None,
                "student": {"id": s.id, "username": s.username, "full_name": s.full_name} if s else None,
            }
        )
    return result


@router.post("/offers/{offer_id}/accept", response_model=dict)
def accept_match_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    offer = db.query(MatchOffer).filter(MatchOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if offer.status != "pending":
        raise HTTPException(status_code=400, detail="Offer already handled")

    req = db.query(MatchRequest).filter(MatchRequest.id == offer.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    offer.status = "accepted"
    req.status = "matched"
    db.add(offer)
    db.add(req)

    db.query(MatchOffer).filter(MatchOffer.request_id == offer.request_id).filter(MatchOffer.id != offer.id).filter(MatchOffer.status == "pending").update(
        {"status": "declined"},
        synchronize_session=False,
    )

    conversation_id = _get_or_create_conversation(db, offer.student_id, offer.teacher_id)
    db.add(
        Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            sender_id=offer.teacher_id,
            content="我已接受你的求助，我们可以开始沟通。",
        )
    )
    _notify(
        db,
        offer.student_id,
        "match_offer_accepted",
        {"request_id": offer.request_id, "offer_id": offer.id, "conversation_id": conversation_id},
    )
    _notify(
        db,
        offer.teacher_id,
        "match_offer_accepted",
        {"request_id": offer.request_id, "offer_id": offer.id, "conversation_id": conversation_id},
    )
    db.commit()
    return {"status": "accepted", "conversation_id": conversation_id}


@router.post("/offers/{offer_id}/decline", response_model=dict)
def decline_match_offer(
    offer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    offer = db.query(MatchOffer).filter(MatchOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if offer.status != "pending":
        raise HTTPException(status_code=400, detail="Offer already handled")
    offer.status = "declined"
    db.add(offer)
    _notify(db, offer.student_id, "match_offer_declined", {"request_id": offer.request_id, "offer_id": offer.id})
    _notify(db, offer.teacher_id, "match_offer_declined", {"request_id": offer.request_id, "offer_id": offer.id})
    db.commit()
    return {"status": "declined"}
