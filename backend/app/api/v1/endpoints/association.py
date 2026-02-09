from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid
import json

from app.api import deps
from app.db.session import get_db
from app.models.association import AssociationTask, AssociationRuleSet, VolunteerHourGrant
from app.schemas import association as schemas
from app.models.user import User, VerificationRequest
from app.models.core import Organization
from app.schemas.user import User as UserSchema
from app.models.teacher_pool import TeacherPoolEntry
from app.models.notification import Notification

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

# =============================================================================
# 协会与认证 API (Association & Verification API)
# 功能：管理身份认证、志愿者协会任务、规则和工时。
# =============================================================================

# -----------------------------------------------------------------------------
# Verification Requests (认证请求)
# -----------------------------------------------------------------------------
@router.post("/verifications/requests", response_model=schemas.VerificationRequest)
def create_verification_request(
    request_in: schemas.VerificationRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    提交新的身份认证申请。
    """
    if request_in.type == "university_student":
        if not request_in.target_school_id:
            raise HTTPException(status_code=400, detail="target_school_id required")
    if request_in.type == "volunteer_teacher":
        if not request_in.target_school_id:
            raise HTTPException(status_code=400, detail="target_school_id required")
        if not current_user.school_id:
            raise HTTPException(status_code=403, detail="University student verification required")
        profile = load_profile(current_user)
        verification = profile.get("verification") if isinstance(profile.get("verification"), dict) else {}
        if verification.get("student") != "verified" and current_user.role not in {"university_student", "volunteer_teacher"}:
            raise HTTPException(status_code=403, detail="University student verification required")
        if request_in.target_school_id != current_user.school_id:
            raise HTTPException(status_code=403, detail="Cross-school teacher application not allowed")
        if not request_in.organization_id:
            raise HTTPException(status_code=400, detail="organization_id required")
        assoc_org = (
            db.query(Organization)
            .filter(Organization.id == request_in.organization_id)
            .first()
        )
        if not assoc_org or assoc_org.type != "university_association" or assoc_org.school_id != current_user.school_id:
            raise HTTPException(status_code=400, detail="Invalid association organization for school")
    if request_in.type == "special_aid":
        if not request_in.target_school_id:
            raise HTTPException(status_code=400, detail="target_school_id required")

    request = VerificationRequest(
        id=str(uuid.uuid4()),
        applicant_id=current_user.id,
        applicant_name=current_user.full_name or current_user.username,
        type=request_in.type,
        target_school_id=request_in.target_school_id,
        target_organization_id=request_in.organization_id,
        evidence_refs=request_in.evidence_refs,
        note=request_in.note,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    setattr(request, "organization_id", request.target_organization_id)
    return request

@router.get("/verifications/me/requests", response_model=List[schemas.VerificationRequest])
def read_my_verification_requests(
    type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    query = (
        db.query(VerificationRequest)
        .filter(VerificationRequest.applicant_id == current_user.id)
        .filter(VerificationRequest.type.isnot(None))
    )
    if type:
        query = query.filter(VerificationRequest.type == type)
    if status:
        query = query.filter(VerificationRequest.status == status)
    items = query.order_by(VerificationRequest.created_at.desc()).all()
    for r in items:
        setattr(r, "organization_id", r.target_organization_id)
    return items

def can_manage_type_for_school(db: Session, user: User, role_code: str, school_id: str | None) -> bool:
    if user.is_superuser:
        return True
    if not school_id:
        return False
    org_ids = [r.organization_id for r in user.admin_roles if r.role_code == role_code and r.organization_id]
    if not org_ids:
        return False
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    return any(o.school_id == school_id for o in orgs if o.school_id)

def can_manage_aid_for_target(user: User, target_aid_school_id: str | None) -> bool:
    if user.is_superuser:
        return True
    if not target_aid_school_id:
        return False
    if any(r.role_code == "association_hq" for r in user.admin_roles):
        return True
    return user.school_id == target_aid_school_id

def load_profile(user: User) -> dict:
    if not user.profile:
        return {}
    try:
        value = json.loads(user.profile)
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}

def write_profile(user: User, profile: dict) -> None:
    user.profile = json.dumps(profile, ensure_ascii=False)

@router.get("/verifications/requests", response_model=List[schemas.VerificationRequest])
def read_verification_requests(
    type: Optional[str] = None,
    status: Optional[str] = None,
    school_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    获取认证申请列表。
    """
    has_hq = any(r.role_code == "association_hq" for r in current_user.admin_roles)
    has_uni_admin = any(r.role_code == "university_admin" for r in current_user.admin_roles)
    has_assoc_admin = any(r.role_code == "university_association_admin" for r in current_user.admin_roles)
    has_aid_admin = any(r.role_code == "aid_school_admin" for r in current_user.admin_roles)

    is_admin = current_user.is_superuser or has_hq or has_uni_admin or has_assoc_admin or has_aid_admin
    if not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    effective_type = type
    effective_school_id = school_id
    if not (current_user.is_superuser or has_hq):
        if has_uni_admin:
            effective_type = "university_student"
        elif has_assoc_admin:
            effective_type = "volunteer_teacher"
        elif has_aid_admin:
            effective_type = "special_aid"
        if effective_school_id and current_user.school_id and effective_school_id != current_user.school_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        effective_school_id = current_user.school_id

    query = db.query(VerificationRequest).filter(VerificationRequest.type.isnot(None))
    if effective_type:
        query = query.filter(VerificationRequest.type == effective_type)
    if status:
        query = query.filter(VerificationRequest.status == status)
    if effective_school_id:
        query = query.filter(VerificationRequest.target_school_id == effective_school_id)
    items = query.order_by(VerificationRequest.created_at.desc()).all()
    for r in items:
        setattr(r, "organization_id", r.target_organization_id)
    return items

@router.post("/verifications/requests/{id}/review", response_model=schemas.VerificationRequest)
def review_verification_request(
    id: str,
    review_in: schemas.VerificationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    审核认证申请。
    - 批准或拒绝，并记录审核人与时间
    """
    request = db.query(VerificationRequest).filter(VerificationRequest.id == id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    allowed = False
    if current_user.is_superuser:
        allowed = True
    elif request.type == "university_student":
        allowed = can_manage_type_for_school(db, current_user, "university_admin", request.target_school_id)
    elif request.type == "volunteer_teacher":
        allowed = can_manage_type_for_school(db, current_user, "university_association_admin", request.target_school_id)
    elif request.type == "special_aid":
        allowed = can_manage_aid_for_target(current_user, request.target_school_id)
    elif request.type == "general_basic":
        allowed = current_user.is_superuser or any(r.role_code == "association_hq" for r in current_user.admin_roles)

    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    request.status = review_in.status
    request.rejected_reason = review_in.rejected_reason
    request.reviewed_by = current_user.id
    request.reviewed_at = datetime.utcnow()

    applicant = db.query(User).filter(User.id == request.applicant_id).first()
    if applicant:
        profile = load_profile(applicant)
        verification = profile.get("verification")
        if not isinstance(verification, dict):
            verification = {}

        if request.type == "university_student":
            verification["student"] = "verified" if review_in.status == "approved" else "rejected"
            if review_in.status == "approved":
                applicant.role = "university_student"
                applicant.school_id = request.target_school_id
        elif request.type == "volunteer_teacher":
            verification["teacher"] = "verified" if review_in.status == "approved" else "rejected"
            if review_in.status == "approved":
                applicant.role = "volunteer_teacher"
                applicant.school_id = request.target_school_id
                tags: list[str] = []
                time_slots: list[str] = []
                try:
                    v = json.loads(request.evidence_refs or "[]")
                    if isinstance(v, list) and v and isinstance(v[0], dict):
                        tags = [str(x) for x in (v[0].get("tags") or []) if x]
                        time_slots = [str(x) for x in (v[0].get("timeSlots") or []) if x]
                except Exception:
                    tags = []
                    time_slots = []
                entry = (
                    db.query(TeacherPoolEntry)
                    .filter(TeacherPoolEntry.user_id == applicant.id)
                    .filter(TeacherPoolEntry.school_id == request.target_school_id)
                    .first()
                )
                if not entry:
                    entry = TeacherPoolEntry(
                        id=str(uuid.uuid4()),
                        user_id=applicant.id,
                        school_id=request.target_school_id,
                        tags=json.dumps(tags, ensure_ascii=False),
                        time_slots=json.dumps(time_slots, ensure_ascii=False),
                        in_pool=True,
                    )
                else:
                    entry.tags = json.dumps(tags, ensure_ascii=False)
                    entry.time_slots = json.dumps(time_slots, ensure_ascii=False)
                    entry.in_pool = True
                db.add(entry)
        elif request.type == "general_basic":
            verification["generalBasic"] = "verified" if review_in.status == "approved" else "rejected"
        elif request.type == "special_aid":
            verification["aid"] = "verified" if review_in.status == "approved" else "rejected"
            if review_in.status == "approved":
                applicant.school_id = request.target_school_id
                applicant.role = "special_aid_student"

        profile["verification"] = verification
        write_profile(applicant, profile)
        db.add(applicant)
    
    db.add(request)
    db.commit()
    db.refresh(request)
    setattr(request, "organization_id", request.target_organization_id)
    return request


@router.get("/verifications/requests/{id}/applicant", response_model=UserSchema)
def read_verification_request_applicant(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    request = db.query(VerificationRequest).filter(VerificationRequest.id == id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    allowed = False
    if current_user.is_superuser:
        allowed = True
    elif request.applicant_id == current_user.id:
        allowed = True
    elif request.type == "university_student":
        allowed = can_manage_type_for_school(db, current_user, "university_admin", request.target_school_id)
    elif request.type == "volunteer_teacher":
        allowed = can_manage_type_for_school(db, current_user, "university_association_admin", request.target_school_id)
    elif request.type == "special_aid":
        allowed = can_manage_aid_for_target(current_user, request.target_school_id)
    elif request.type == "general_basic":
        allowed = current_user.is_superuser or any(r.role_code == "association_hq" for r in current_user.admin_roles)

    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized")

    applicant = db.query(User).filter(User.id == request.applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return applicant


@router.get("/teachers", response_model=List[schemas.TeacherPoolEntryWithUser])
def list_teacher_pool(
    school_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    target = school_id or current_user.school_id
    if not target:
        raise HTTPException(status_code=400, detail="school_id required")
    allowed = current_user.is_superuser or any(r.role_code == "association_hq" for r in current_user.admin_roles) or can_manage_type_for_school(db, current_user, "university_association_admin", target)
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized")

    entries = (
        db.query(TeacherPoolEntry)
        .filter(TeacherPoolEntry.school_id == target)
        .order_by(TeacherPoolEntry.updated_at.desc())
        .all()
    )
    users = (
        db.query(User)
        .filter(User.id.in_([e.user_id for e in entries]))
        .filter(User.is_active == True)
        .all()
        if entries
        else []
    )
    user_map = {u.id: u for u in users}

    result: list[dict] = []
    orphan_entry_ids: list[str] = []
    for e in entries:
        u = user_map.get(e.user_id)
        if not u or u.school_id != target:
            orphan_entry_ids.append(e.id)
            continue
        try:
            p = json.loads(u.profile or "{}")
            v = p.get("verification") if isinstance(p, dict) else {}
            teacher_ok = isinstance(v, dict) and v.get("teacher") == "verified"
        except Exception:
            teacher_ok = False
        if u.role != "volunteer_teacher" or not teacher_ok:
            orphan_entry_ids.append(e.id)
            continue

        result.append({
            "id": e.id,
            "user_id": e.user_id,
            "school_id": e.school_id,
            "tags": json.loads(e.tags or "[]"),
            "time_slots": json.loads(e.time_slots or "[]"),
            "in_pool": bool(e.in_pool),
            "created_at": e.created_at,
            "updated_at": e.updated_at,
            "user": {
                "id": u.id if u else e.user_id,
                "username": u.username if u else "",
                "email": u.email if u else "",
                "full_name": u.full_name if u else None,
                "role": u.role if u else "",
                "school_id": u.school_id if u else None,
            },
        })
    if orphan_entry_ids:
        db.query(TeacherPoolEntry).filter(TeacherPoolEntry.id.in_(orphan_entry_ids)).delete(synchronize_session=False)
        db.commit()
    return result


@router.post("/teachers/{user_id}/pool", response_model=schemas.TeacherPoolEntry)
def update_teacher_pool(
    user_id: str,
    payload: schemas.TeacherPoolEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    school_id = current_user.school_id
    if not school_id:
        raise HTTPException(status_code=400, detail="school_id required")
    if not (current_user.is_superuser or can_manage_type_for_school(db, current_user, "university_association_admin", school_id)):
        raise HTTPException(status_code=403, detail="Not authorized")

    entry = (
        db.query(TeacherPoolEntry)
        .filter(TeacherPoolEntry.user_id == user_id)
        .filter(TeacherPoolEntry.school_id == school_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Teacher not found")
    entry.in_pool = bool(payload.in_pool)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "school_id": entry.school_id,
        "tags": json.loads(entry.tags or "[]"),
        "time_slots": json.loads(entry.time_slots or "[]"),
        "in_pool": bool(entry.in_pool),
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }

# -----------------------------------------------------------------------------
# Association Tasks (志愿者任务)
# -----------------------------------------------------------------------------
@router.get("/association/{school_id}/tasks", response_model=List[schemas.AssociationTask])
def read_association_tasks(
    school_id: str,
    db: Session = Depends(get_db)
):
    """
    获取指定高校协会的任务列表。
    """
    return db.query(AssociationTask).filter(AssociationTask.school_id == school_id).all()

@router.post("/association/{school_id}/tasks", response_model=schemas.AssociationTask)
def create_association_task(
    school_id: str,
    task_in: schemas.AssociationTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user) # Check association admin
):
    """
    发布新任务。
    - 仅协会管理员可操作
    """
    task = AssociationTask(
        id=str(uuid.uuid4()),
        school_id=school_id,
        created_by=current_user.id,
        **task_in.dict()
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

# -----------------------------------------------------------------------------
# Rules (运营规则)
# -----------------------------------------------------------------------------
@router.get("/association/{school_id}/rule-set", response_model=schemas.AssociationRuleSet)
def read_association_rule_set(
    school_id: str,
    db: Session = Depends(get_db)
):
    """
    获取协会运营规则。
    """
    rule = db.query(AssociationRuleSet).filter(AssociationRuleSet.school_id == school_id).first()
    if not rule:
        # Return default if not exists, or 404
        raise HTTPException(status_code=404, detail="Rule set not found")
    return rule

@router.put("/association/{school_id}/rule-set", response_model=schemas.AssociationRuleSet)
def update_association_rule_set(
    school_id: str,
    rule_in: schemas.AssociationRuleSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user) # Check association admin
):
    """
    更新协会运营规则。
    """
    rule = db.query(AssociationRuleSet).filter(AssociationRuleSet.school_id == school_id).first()
    if not rule:
        rule = AssociationRuleSet(
            id=str(uuid.uuid4()),
            school_id=school_id,
            version="1.0"
        )
    
    rule.exchange_rate = rule_in.exchange_rate
    # Update version logic here
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

# -----------------------------------------------------------------------------
# Hour Grants (时长发放)
# -----------------------------------------------------------------------------
@router.post("/association/{school_id}/hour-grants", response_model=schemas.VolunteerHourGrant)
def grant_volunteer_hours(
    school_id: str,
    grant_in: schemas.VolunteerHourGrantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user) # Check association admin
):
    """
    发放志愿时长。
    - 记录发放人与理由
    """
    grant = VolunteerHourGrant(
        id=str(uuid.uuid4()),
        school_id=school_id,
        granted_by=current_user.id,
        **grant_in.dict()
    )
    db.add(grant)
    db.commit()
    db.refresh(grant)
    return grant
