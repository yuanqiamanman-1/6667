from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import json

from app.api import deps
from app.db.session import get_db
from app.models.user import User, AdminRole, AdminOnboardingRequest, VerificationRequest
from app.models.core import Organization, Announcement
from app.models.content import CampusPost, CampusTopic, CommunityPost
from app.models.teacher_pool import TeacherPoolEntry
from app.models.match import MatchRequest, PointTxn
from app.models.files import FileAsset
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.models.notification import Notification
from app.core import security
from app.schemas.admin import (
    AdminRoleCreate,
    AdminUserResponse,
    AdminOnboardingRequest as AdminOnboardingRequestSchema,
    AdminOnboardingRequestUpdate,
    UserAccountResponse,
)
from app.schemas.user import User as UserSchema

router = APIRouter()


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

# =============================================================================
# 管理员管理 API (Admin Management API)
# 功能：超级管理员创建/管理高校和协会管理员。
# =============================================================================

@router.get("/org-admins", response_model=List[AdminUserResponse])
def read_org_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    获取所有组织管理员账号。
    - 仅超级管理员可见
    - 返回包含 admin_roles 的用户信息
    """
    # Find users who have AdminRoles
    admins = db.query(User).join(AdminRole).filter(User.admin_roles.any()).all()

    org_ids = set()
    for a in admins:
        for r in a.admin_roles:
            if r.organization_id:
                org_ids.add(r.organization_id)
    org_by_id = {}
    if org_ids:
        for o in db.query(Organization).filter(Organization.id.in_(list(org_ids))).all():
            org_by_id[o.id] = o
    
    # Format response
    res = []
    for admin in admins:
        roles_data = []
        for role in admin.admin_roles:
            org = org_by_id.get(role.organization_id) if role.organization_id else None
            roles_data.append({
                "role_code": role.role_code,
                "organization_id": role.organization_id,
                "organization": (
                    {
                        "id": org.id,
                        "type": org.type,
                        "display_name": org.display_name,
                        "school_id": org.school_id,
                        "aid_school_id": org.aid_school_id,
                    }
                    if org
                    else None
                ),
            })
        res.append({
            "id": admin.id,
            "username": admin.username,
            "full_name": admin.full_name,
            "email": admin.email,
            "admin_roles": roles_data
        })
    return res


@router.get("/users", response_model=List[UserAccountResponse])
def read_users(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    query = db.query(User)
    if not include_inactive:
        query = query.filter(User.is_active == True)
    users = query.order_by(User.created_at.desc()).all()

    org_ids = set()
    for u in users:
        for r in u.admin_roles:
            if r.organization_id:
                org_ids.add(r.organization_id)
    org_by_id = {}
    if org_ids:
        for o in db.query(Organization).filter(Organization.id.in_(list(org_ids))).all():
            org_by_id[o.id] = o

    result = []
    for u in users:
        roles = []
        for r in u.admin_roles:
            org = org_by_id.get(r.organization_id) if r.organization_id else None
            roles.append(
                {
                    "role_code": r.role_code,
                    "organization_id": r.organization_id,
                    "organization": (
                        {
                            "id": org.id,
                            "type": org.type,
                            "display_name": org.display_name,
                            "school_id": org.school_id,
                            "aid_school_id": org.aid_school_id,
                        }
                        if org
                        else None
                    ),
                }
            )

        result.append(
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "is_superuser": u.is_superuser,
                "onboarding_status": u.onboarding_status,
                "school_id": u.school_id,
                "organization_id": u.organization_id,
                "admin_roles": roles,
            }
        )
    return result


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(
    user_id: str,
    hard: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete current user")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_superuser:
        remaining = db.query(User).filter(User.is_superuser == True).filter(User.id != user_id).count()
        if remaining <= 0:
            raise HTTPException(status_code=400, detail="Cannot delete last superuser")

    if hard:
        cleanup_school_ids: list[str] = []
        org_ids = [r.organization_id for r in (user.admin_roles or []) if r.role_code == "university_admin" and r.organization_id]
        if org_ids:
            orgs = db.query(Organization).filter(Organization.id.in_(list(set(org_ids)))).all()
            for org in orgs:
                if org.type == "university" and org.school_id:
                    remaining_admins = (
                        db.query(AdminRole)
                        .join(Organization, AdminRole.organization_id == Organization.id)
                        .filter(AdminRole.role_code == "university_admin")
                        .filter(Organization.type == "university")
                        .filter(Organization.school_id == org.school_id)
                        .filter(AdminRole.user_id != user_id)
                        .count()
                    )
                    if remaining_admins <= 0:
                        cleanup_school_ids.append(org.school_id)

        db.query(VerificationRequest).filter(VerificationRequest.applicant_id == user_id).delete()
        db.query(AdminOnboardingRequest).filter(AdminOnboardingRequest.user_id == user_id).delete()
        db.query(TeacherPoolEntry).filter(TeacherPoolEntry.user_id == user_id).delete()
        db.query(MatchRequest).filter(MatchRequest.student_id == user_id).delete()
        db.query(PointTxn).filter(PointTxn.user_id == user_id).delete()
        db.query(FileAsset).filter(FileAsset.uploader_id == user_id).delete()
        db.query(CommunityPost).filter(CommunityPost.author_id == user_id).delete()

        conv_rows = (
            db.query(ConversationParticipant.conversation_id)
            .filter(ConversationParticipant.user_id == user_id)
            .all()
        )
        conv_ids = [c[0] for c in conv_rows]
        if conv_ids:
            db.query(Message).filter(Message.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
            db.query(ConversationParticipant).filter(ConversationParticipant.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
            db.query(Conversation).filter(Conversation.id.in_(conv_ids)).delete(synchronize_session=False)

        for sid in sorted(set(cleanup_school_ids)):
            students = (
                db.query(User)
                .filter(User.school_id == sid)
                .filter(User.role.in_(["university_student", "volunteer_teacher"]))
                .all()
            )
            for u in students:
                profile = _parse_profile(u.profile)
                verification = profile.get("verification") if isinstance(profile.get("verification"), dict) else {}
                if u.role == "university_student":
                    verification["student"] = "none"
                if u.role == "volunteer_teacher":
                    verification["teacher"] = "none"
                    verification["student"] = "none"
                profile["verification"] = verification
                _write_profile(u, profile)
                u.role = "general_student"
                u.school_id = None
                db.add(u)
                _notify(
                    db,
                    u.id,
                    "verification_revoked",
                    {"reason": "university_board_removed", "school_id": sid},
                )

            db.query(TeacherPoolEntry).filter(TeacherPoolEntry.school_id == sid).delete()
            db.query(CampusTopic).filter(CampusTopic.school_id == sid).delete()
            db.query(CampusPost).filter(CampusPost.school_id == sid).delete()
            db.query(Announcement).filter(Announcement.scope == "campus").filter(Announcement.school_id == sid).delete()
            db.query(Organization).filter(Organization.type == "university").filter(Organization.school_id == sid).delete()

        db.delete(user)
        db.commit()
        return {"status": "deleted"}

    user.is_active = False
    user.admin_roles = []
    db.add(user)
    db.commit()
    return {"status": "disabled"}


@router.post("/universities/purge-orphans", response_model=dict)
def purge_orphan_university_boards(
    dry_run: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    university_orgs = (
        db.query(Organization)
        .filter(Organization.type == "university")
        .filter(Organization.school_id.isnot(None))
        .all()
    )
    school_ids = sorted({o.school_id for o in university_orgs if o.school_id})
    if not school_ids:
        return {"dry_run": dry_run, "school_ids": [], "deleted": 0}

    orphan_school_ids: list[str] = []
    for sid in school_ids:
        admin_count = (
            db.query(AdminRole)
            .join(Organization, AdminRole.organization_id == Organization.id)
            .filter(AdminRole.role_code == "university_admin")
            .filter(Organization.type == "university")
            .filter(Organization.school_id == sid)
            .count()
        )
        if admin_count <= 0:
            orphan_school_ids.append(sid)

    if dry_run:
        return {"dry_run": True, "school_ids": orphan_school_ids, "deleted": 0}

    deleted = 0
    for sid in orphan_school_ids:
        students = (
            db.query(User)
            .filter(User.school_id == sid)
            .filter(User.role.in_(["university_student", "volunteer_teacher"]))
            .all()
        )
        for u in students:
            profile = _parse_profile(u.profile)
            verification = profile.get("verification") if isinstance(profile.get("verification"), dict) else {}
            verification["student"] = "none"
            verification["teacher"] = "none"
            profile["verification"] = verification
            _write_profile(u, profile)
            u.role = "general_student"
            u.school_id = None
            db.add(u)
            _notify(
                db,
                u.id,
                "verification_revoked",
                {"reason": "university_board_removed", "school_id": sid},
            )

        db.query(TeacherPoolEntry).filter(TeacherPoolEntry.school_id == sid).delete()
        db.query(CampusTopic).filter(CampusTopic.school_id == sid).delete()
        db.query(CampusPost).filter(CampusPost.school_id == sid).delete()
        db.query(Announcement).filter(Announcement.scope == "campus").filter(Announcement.school_id == sid).delete()
        db.query(Organization).filter(Organization.type == "university").filter(Organization.school_id == sid).delete()
        deleted += 1

    db.commit()
    return {"dry_run": False, "school_ids": orphan_school_ids, "deleted": deleted}


@router.delete("/org-admins/{user_id}", response_model=dict)
def delete_org_admin(
    user_id: str,
    hard: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.admin_roles:
        raise HTTPException(status_code=400, detail="Not an admin user")
    return delete_user(user_id=user_id, hard=hard, db=db, current_user=current_user)

@router.post("/org-admins", response_model=AdminUserResponse)
def create_org_admin(
    *,
    db: Session = Depends(get_db),
    admin_in: AdminRoleCreate,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    创建组织管理员。
    - 如果用户不存在，则创建新用户
    - 如果 organization_id 为空，根据 org_data 创建新组织
    - 创建 AdminRole 关联
    """
    # 1. Check or Create User
    user = db.query(User).filter(User.username == admin_in.username).first()
    if not user:
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            username=admin_in.username,
            email=admin_in.email,
            hashed_password=security.get_password_hash(admin_in.password),
            full_name=admin_in.full_name,
            role="governance", # Admins are governance role
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 2. Check or Create Organization
    org_id = admin_in.organization_id
    if not org_id and admin_in.org_type and admin_in.org_display_name:
        desired_school_id = None
        desired_aid_school_id = None
        if admin_in.org_type == "university":
            desired_school_id = derive_school_code("uni", admin_in.school_id or admin_in.org_display_name)
        elif admin_in.org_type == "university_association":
            if admin_in.school_id:
                desired_school_id = derive_school_code("uni", admin_in.school_id)
            else:
                uni = (
                    db.query(Organization)
                    .filter(Organization.type == "university")
                    .filter(Organization.display_name.isnot(None))
                    .all()
                )
                for u in uni:
                    if u.display_name and admin_in.org_display_name.startswith(u.display_name):
                        desired_school_id = u.school_id
                        break
                desired_school_id = desired_school_id or derive_school_code("uni", admin_in.org_display_name)
        elif admin_in.org_type == "aid_school":
            desired_aid_school_id = derive_school_code("aid", admin_in.school_id or admin_in.org_display_name)

        existing = None
        if admin_in.org_type in ["university", "university_association"] and desired_school_id:
            existing = (
                db.query(Organization)
                .filter(Organization.type == admin_in.org_type)
                .filter(Organization.school_id == desired_school_id)
                .first()
            )
        if not existing:
            existing = (
                db.query(Organization)
                .filter(Organization.type == admin_in.org_type)
                .filter(Organization.display_name == admin_in.org_display_name)
                .first()
            )
        if admin_in.org_type == "aid_school" and desired_aid_school_id and not existing:
            existing = (
                db.query(Organization)
                .filter(Organization.type == admin_in.org_type)
                .filter(Organization.aid_school_id == desired_aid_school_id)
                .first()
            )

        if existing:
            org_id = existing.id
        else:
            org_id = str(uuid.uuid4())
            new_org = Organization(
                id=org_id,
                type=admin_in.org_type,
                display_name=admin_in.org_display_name,
                school_id=desired_school_id,
                aid_school_id=desired_aid_school_id,
                certified=True,
            )
            db.add(new_org)
            db.commit()
    
    if not org_id and admin_in.role_code not in ["superadmin", "association_hq"]:
         raise HTTPException(status_code=400, detail="Organization required for this role")
    
    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            if admin_in.role_code in ["university_admin", "university_association_admin"] and org.school_id:
                user.school_id = org.school_id
            if admin_in.role_code == "aid_school_admin" and org.aid_school_id:
                user.school_id = org.aid_school_id
        user.onboarding_status = "approved"
        db.add(user)
        db.commit()

    # 3. Create AdminRole
    # Check if role exists
    existing_role = db.query(AdminRole).filter(
        AdminRole.user_id == user.id,
        AdminRole.role_code == admin_in.role_code,
        AdminRole.organization_id == org_id
    ).first()
    
    if not existing_role:
        role = AdminRole(
            id=str(uuid.uuid4()),
            user_id=user.id,
            role_code=admin_in.role_code,
            organization_id=org_id
        )
        db.add(role)
        db.commit()
    
    # Return formatted response
    db.refresh(user)
    roles_data = []
    for r in user.admin_roles:
        roles_data.append({
            "role_code": r.role_code,
            "organization_id": r.organization_id
        })
        
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "admin_roles": roles_data
    }

def can_review_onboarding(user: User) -> bool:
    if user.is_superuser:
        return True
    return any(r.role_code == "association_hq" for r in user.admin_roles)

def role_code_for_org_type(org_type: str) -> str:
    if org_type == "university":
        return "university_admin"
    if org_type == "university_association":
        return "university_association_admin"
    if org_type == "aid_school":
        return "aid_school_admin"
    raise HTTPException(status_code=400, detail="Unknown org_type")

def derive_school_code(prefix: str, name: str) -> str:
    normalized = "".join((name or "").split())
    if normalized:
        return normalized
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

@router.get("/onboarding-requests", response_model=List[AdminOnboardingRequestSchema])
def read_onboarding_requests(
    status: Optional[str] = None,
    org_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not can_review_onboarding(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(AdminOnboardingRequest)
    if status:
        query = query.filter(AdminOnboardingRequest.status == status)
    if org_type:
        query = query.filter(AdminOnboardingRequest.org_type == org_type)
    return query.order_by(AdminOnboardingRequest.created_at.desc()).all()


@router.get("/onboarding-requests/{request_id}/applicant", response_model=UserSchema)
def read_onboarding_request_applicant(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    req = db.query(AdminOnboardingRequest).filter(AdminOnboardingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if not (can_review_onboarding(current_user) or req.user_id == current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/onboarding-requests/{request_id}/review", response_model=AdminOnboardingRequestSchema)
def review_onboarding_request(
    request_id: str,
    review_in: AdminOnboardingRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not can_review_onboarding(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    req = db.query(AdminOnboardingRequest).filter(AdminOnboardingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already reviewed")

    if review_in.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    req.status = review_in.status
    req.reviewed_by = current_user.id
    req.reviewed_at = datetime.utcnow()
    req.rejected_reason = review_in.rejected_reason

    if review_in.status == "approved":
        user = db.query(User).filter(User.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        display_name = (req.association_name or req.school_name).strip() or "未命名组织"
        role_code = role_code_for_org_type(req.org_type)

        desired_school_id = None
        desired_aid_school_id = None
        if req.org_type in ["university", "university_association"]:
            desired_school_id = derive_school_code("uni", (req.school_name or display_name).strip())
        if req.org_type == "aid_school":
            desired_aid_school_id = derive_school_code("aid", (req.school_name or display_name).strip())

        org = None
        if req.org_type in ["university", "university_association"] and desired_school_id:
            org = (
                db.query(Organization)
                .filter(Organization.type == req.org_type)
                .filter(Organization.school_id == desired_school_id)
                .first()
            )
        if not org:
            org = (
                db.query(Organization)
                .filter(Organization.type == req.org_type)
                .filter(Organization.display_name == display_name)
                .first()
            )
        if req.org_type == "aid_school" and desired_aid_school_id and not org:
            org = (
                db.query(Organization)
                .filter(Organization.type == req.org_type)
                .filter(Organization.aid_school_id == desired_aid_school_id)
                .first()
            )
        if not org:
            org_id = str(uuid.uuid4())
            org = Organization(
                id=org_id,
                type=req.org_type,
                display_name=display_name,
                certified=True,
            )
            if req.org_type in ["university", "university_association"]:
                org.school_id = desired_school_id
            if req.org_type == "aid_school":
                org.aid_school_id = desired_aid_school_id
            db.add(org)
            db.commit()
            db.refresh(org)

        existing_role = (
            db.query(AdminRole)
            .filter(AdminRole.user_id == user.id)
            .filter(AdminRole.role_code == role_code)
            .filter(AdminRole.organization_id == org.id)
            .first()
        )
        if not existing_role:
            db.add(
                AdminRole(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    role_code=role_code,
                    organization_id=org.id,
                )
            )

        user.role = "governance"
        user.onboarding_status = "approved"
        if role_code in ["university_admin", "university_association_admin"] and org.school_id:
            user.school_id = org.school_id
        if role_code == "aid_school_admin" and org.aid_school_id:
            user.school_id = org.aid_school_id
        db.add(user)

    db.add(req)
    db.commit()
    db.refresh(req)
    return req
