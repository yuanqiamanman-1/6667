from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
import uuid
import json

from app.api import deps
from app.db.session import get_db
from app.models.core import Organization, Tag, Announcement
from app.models.notification import Notification
from app.schemas import core as schemas
from app.models.user import User, AdminRole

router = APIRouter()


def _create_notification(db: Session, user_id: str, type: str, payload: dict) -> None:
    """Helper to create a notification record."""
    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=type,
            payload=json.dumps(payload, ensure_ascii=False),
        )
    )

# =============================================================================
# 核心业务 API (Core Business API)
# 功能：管理组织目录、标签字典和公告。
# =============================================================================

# -----------------------------------------------------------------------------
# Organizations (组织)
# -----------------------------------------------------------------------------
@router.get("/orgs", response_model=List[schemas.Organization])
def read_organizations(
    type: Optional[str] = None,      # 按类型过滤 (university, etc.)
    certified: Optional[bool] = None,# 按认证状态过滤
    require_admin: bool = False,
    db: Session = Depends(get_db)
):
    """
    获取组织列表。
    - 支持按类型和认证状态筛选
    - 用于前端高校选择器、认证中心等
    """
    query = db.query(Organization)
    if type:
        query = query.filter(Organization.type == type)
    if certified is not None:
        query = query.filter(Organization.certified == certified)
    if require_admin:
        uni_rows = (
            db.query(AdminRole.organization_id)
            .filter(AdminRole.role_code == "university_admin")
            .filter(AdminRole.organization_id.isnot(None))
            .all()
        )
        assoc_rows = (
            db.query(AdminRole.organization_id)
            .filter(AdminRole.role_code == "university_association_admin")
            .filter(AdminRole.organization_id.isnot(None))
            .all()
        )
        aid_rows = (
            db.query(AdminRole.organization_id)
            .filter(AdminRole.role_code == "aid_school_admin")
            .filter(AdminRole.organization_id.isnot(None))
            .all()
        )

        allowed_university = {x[0] for x in uni_rows if x and x[0]}
        allowed_association = {x[0] for x in assoc_rows if x and x[0]}
        allowed_aid = {x[0] for x in aid_rows if x and x[0]}

        if type == "university":
            query = query.filter(Organization.id.in_(list(allowed_university) or ["__none__"]))
        elif type == "university_association":
            query = query.filter(Organization.id.in_(list(allowed_association) or ["__none__"]))
        elif type == "aid_school":
            query = query.filter(Organization.id.in_(list(allowed_aid) or ["__none__"]))
        elif type is None:
            query = query.filter(
                or_(
                    Organization.type.notin_(["university", "university_association", "aid_school"]),
                    and_(Organization.type == "university", Organization.id.in_(list(allowed_university) or ["__none__"])),
                    and_(Organization.type == "university_association", Organization.id.in_(list(allowed_association) or ["__none__"])),
                    and_(Organization.type == "aid_school", Organization.id.in_(list(allowed_aid) or ["__none__"])),
                )
            )
    return query.all()

@router.get("/orgs/board", response_model=Any)
def read_organizations_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    获取高校板块聚合目录 (Board)。
    - 按 school_id 聚合，用于跨校审计
    - 仅 superadmin 和 hq 可见
    """
    # Permission check: superadmin or hq
    has_permission = current_user.is_superuser
    if not has_permission:
        for role in current_user.admin_roles:
            if role.role_code == "association_hq":
                has_permission = True
                break
    
    if not has_permission:
        raise HTTPException(status_code=403, detail="Not authorized to view cross-campus board")

    admin_school_rows = (
        db.query(Organization.school_id)
        .join(AdminRole, AdminRole.organization_id == Organization.id)
        .filter(AdminRole.role_code == "university_admin")
        .filter(Organization.type == "university")
        .filter(Organization.school_id.isnot(None))
        .all()
    )
    admin_school_ids = {r[0] for r in admin_school_rows if r and r[0]}

    # Fetch all organizations
    orgs = db.query(Organization).all()
    
    # Aggregate by school_id
    board = {}
    for org in orgs:
        if not org.school_id:
            continue
            
        sid = org.school_id
        if sid not in board:
            board[sid] = {
                "school_id": sid,
                "display_name": org.display_name if org.type == "university" else None,
                "university_org_status": "none",
                "association_org_status": "none",
                "entrypoints": {
                    "community_url": f"/campus/community?school_id={sid}",
                    "association_url": f"/campus/association?school_id={sid}"
                }
            }
        
        item = board[sid]
        if org.type == "university":
            item["display_name"] = org.display_name # Prefer university name
            item["university_org_status"] = "active" if org.certified else "pending"
        elif org.type == "university_association":
            item["association_org_status"] = "active" if org.certified else "pending"
            if not item["display_name"]:
                item["display_name"] = org.display_name # Fallback name

    # Filter out entries with no valid university or association
    # (Spec: board_enabled = university OR association)
    result = []
    for sid, data in board.items():
        data["board_enabled"] = (data["university_org_status"] != "none") or (data["association_org_status"] != "none")
        if data["board_enabled"] and (sid in admin_school_ids):
            result.append(data)
            
    return result

@router.get("/orgs/resolve", response_model=schemas.Organization)
def resolve_organization(
    type: str,
    school_id: Optional[str] = None,
    aid_school_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Organization).filter(Organization.type == type)
    if type in ["university", "university_association"]:
        if not school_id:
            raise HTTPException(status_code=400, detail="school_id required")
        query = query.filter(Organization.school_id == school_id)
    if type == "aid_school":
        if not aid_school_id:
            raise HTTPException(status_code=400, detail="aid_school_id required")
        query = query.filter(Organization.aid_school_id == aid_school_id)
    org = query.first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.get("/orgs/{org_id}", response_model=schemas.Organization)
def read_organization(
    org_id: str,
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.post("/orgs", response_model=schemas.Organization)
def create_organization(
    org_in: schemas.OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser)
):
    """
    创建新组织。
    - 仅超级管理员可操作
    """
    if org_in.type in ["university", "university_association"] and org_in.school_id:
        existing = (
            db.query(Organization)
            .filter(Organization.type == org_in.type)
            .filter(Organization.school_id == org_in.school_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail=f"Organization already exists: {existing.id}")
    if org_in.type == "aid_school" and org_in.aid_school_id:
        existing = (
            db.query(Organization)
            .filter(Organization.type == org_in.type)
            .filter(Organization.aid_school_id == org_in.aid_school_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail=f"Organization already exists: {existing.id}")
    if org_in.display_name:
        existing = (
            db.query(Organization)
            .filter(Organization.type == org_in.type)
            .filter(Organization.display_name == org_in.display_name)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail=f"Organization already exists: {existing.id}")
    org = Organization(id=str(uuid.uuid4()), **org_in.dict())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

# -----------------------------------------------------------------------------
# Tags (标签)
# -----------------------------------------------------------------------------
@router.get("/tags", response_model=List[schemas.Tag])
def read_tags(db: Session = Depends(get_db)):
    """
    获取所有启用标签。
    - 用于用户画像、需求匹配等标签选择
    """
    return db.query(Tag).filter(Tag.enabled == True).all()

@router.get("/tags/admin", response_model=List[schemas.Tag])
def read_tags_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    return db.query(Tag).all()

@router.post("/tags", response_model=schemas.Tag)
def create_tag(
    tag_in: schemas.TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser)
):
    """
    创建新标签。
    - 仅超级管理员可操作
    """
    tag = Tag(id=str(uuid.uuid4()), **tag_in.dict())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@router.put("/tags/{tag_id}", response_model=schemas.Tag)
def update_tag(
    tag_id: str,
    tag_in: schemas.TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    payload = tag_in.dict(exclude_unset=True)
    for k, v in payload.items():
        setattr(tag, k, v)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@router.delete("/tags/{tag_id}", response_model=dict)
def delete_tag(
    tag_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
    return {"ok": True}

# -----------------------------------------------------------------------------
# Announcements (公告)
# -----------------------------------------------------------------------------
@router.get("/announcements", response_model=List[schemas.Announcement])
def read_announcements(
    scope: Optional[str] = None,      # public, campus, aid
    school_id: Optional[str] = None,  # 筛选特定高校的公告
    db: Session = Depends(get_db)
):
    """
    获取公告列表。
    - 支持按发布范围和学校 ID 筛选
    """
    query = db.query(Announcement)
    if scope:
        query = query.filter(Announcement.scope == scope)
    if school_id:
        query = query.filter(Announcement.school_id == school_id)
    anns = query.order_by(Announcement.pinned.desc(), Announcement.created_at.desc()).all()
    user_ids = list({a.created_by for a in anns if a and a.created_by})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    result: list[dict] = []
    for a in anns:
        u = user_map.get(a.created_by)
        result.append(
            {
                "id": a.id,
                "title": a.title,
                "content": a.content,
                "scope": a.scope,
                "audience": a.audience,
                "school_id": a.school_id,
                "organization_id": a.organization_id,
                "pinned": bool(a.pinned),
                "version": a.version,
                "created_by": a.created_by,
                "created_by_user": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
                "created_at": a.created_at,
                "updated_at": a.updated_at,
            }
        )
    return result

@router.post("/announcements", response_model=schemas.Announcement)
def create_announcement(
    ann_in: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    发布新公告。
    - 需要根据 scope 和 role 进行更细粒度的权限检查 (待完善)
    """
    scope = ann_in.scope
    audience = ann_in.audience

    allowed_scopes = {"public", "campus", "aid"}
    if scope not in allowed_scopes:
        raise HTTPException(status_code=400, detail="Invalid scope")

    allowed_audiences = {"public_all", "campus_all", "association_teachers_only", "aid_school_only"}
    if audience not in allowed_audiences:
        raise HTTPException(status_code=400, detail="Invalid audience")

    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_university_admin = "university_admin" in role_codes
    is_university_association_admin = "university_association_admin" in role_codes
    is_aid_school_admin = "aid_school_admin" in role_codes

    if scope == "public":
        if not (current_user.is_superuser or is_hq or is_university_admin or is_university_association_admin):
            raise HTTPException(status_code=403, detail="Not authorized")
        if audience != "public_all":
            raise HTTPException(status_code=400, detail="Invalid audience for public scope")
    elif scope == "campus":
        if not ann_in.school_id:
            raise HTTPException(status_code=400, detail="school_id required for campus scope")
        if not (current_user.is_superuser or is_hq or is_university_admin or is_university_association_admin):
            raise HTTPException(status_code=403, detail="Not authorized")
        if not (current_user.is_superuser or is_hq) and current_user.school_id != ann_in.school_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if is_university_association_admin and not (current_user.is_superuser or is_hq) and audience != "association_teachers_only":
            raise HTTPException(status_code=400, detail="Invalid audience for role")
        if audience not in {"campus_all", "association_teachers_only"}:
            raise HTTPException(status_code=400, detail="Invalid audience for campus scope")
    else:
        if not ann_in.organization_id:
            raise HTTPException(status_code=400, detail="organization_id required for aid scope")
        if not (current_user.is_superuser or is_hq or is_aid_school_admin):
            raise HTTPException(status_code=403, detail="Not authorized")
        if audience != "aid_school_only":
            raise HTTPException(status_code=400, detail="Invalid audience for aid scope")

    ann = Announcement(id=str(uuid.uuid4()), created_by=current_user.id, **ann_in.dict())
    db.add(ann)
    
    # 通知目标用户（根据 scope 和 audience 确定推送范围）
    notify_user_ids: list[str] = []
    
    if scope == "public" and audience == "public_all":
        # 全站公告：显示在公告列表，不单独推送通知（用户进入平台时查看）
        pass
    elif scope == "campus":
        if audience == "campus_all":
            # 校园全体公告：推送给该校所有在校用户
            campus_users = db.query(User.id).filter(User.school_id == ann_in.school_id).filter(User.id != current_user.id).all()
            notify_user_ids = [u.id for u in campus_users]
        elif audience == "association_teachers_only":
            # 志愿者师资公告：推送给该校的志愿者老师
            teacher_users = (
                db.query(User.id)
                .filter(User.school_id == ann_in.school_id)
                .filter(User.is_volunteer_teacher == True)
                .filter(User.id != current_user.id)
                .all()
            )
            notify_user_ids = [u.id for u in teacher_users]
    elif scope == "aid":
        # 支教学校公告：显示在公告列表
        pass
    
    # 创建通知（限制最多 1000 人，超出则不发个人通知，依赖公告列表展示）
    if notify_user_ids and len(notify_user_ids) <= 1000:
        for user_id in notify_user_ids:
            _create_notification(
                db,
                user_id,
                "announcement_published",
                {
                    "announcement_id": ann.id,
                    "title": ann.title,
                    "scope": scope,
                    "publisher_id": current_user.id,
                    "publisher_name": current_user.full_name or current_user.username,
                },
            )
    
    db.commit()
    db.refresh(ann)
    return {
        "id": ann.id,
        "title": ann.title,
        "content": ann.content,
        "scope": ann.scope,
        "audience": ann.audience,
        "school_id": ann.school_id,
        "organization_id": ann.organization_id,
        "pinned": bool(ann.pinned),
        "version": ann.version,
        "created_by": ann.created_by,
        "created_by_user": {"id": current_user.id, "username": current_user.username, "full_name": current_user.full_name},
        "created_at": ann.created_at,
        "updated_at": ann.updated_at,
    }


@router.patch("/announcements/{ann_id}", response_model=schemas.Announcement)
def update_announcement(
    ann_id: str,
    update_in: schemas.AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_super = current_user.is_superuser

    if not (is_super or is_hq or ann.created_by == current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    if update_in.pinned is not None:
        ann.pinned = bool(update_in.pinned)

    db.add(ann)
    db.commit()
    db.refresh(ann)

    u = db.query(User).filter(User.id == ann.created_by).first()
    return {
        "id": ann.id,
        "title": ann.title,
        "content": ann.content,
        "scope": ann.scope,
        "audience": ann.audience,
        "school_id": ann.school_id,
        "organization_id": ann.organization_id,
        "pinned": bool(ann.pinned),
        "version": ann.version,
        "created_by": ann.created_by,
        "created_by_user": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
        "created_at": ann.created_at,
        "updated_at": ann.updated_at,
    }


@router.delete("/announcements/{ann_id}", response_model=dict)
def delete_announcement(
    ann_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_super = current_user.is_superuser

    if not (is_super or is_hq or ann.created_by == current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(ann)
    db.commit()
    return {"ok": True}
