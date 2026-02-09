from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
import uuid
import json
from pydantic import BaseModel

from app.api import deps
from app.db.session import get_db
from app.models.content import CommunityPost, CommunityComment, CampusTopic, CampusPost, CampusPostComment, QaQuestion, QaAnswer
from app.models.notification import Notification
from app.schemas import content as schemas
from app.models.user import User

router = APIRouter()


# Pydantic 模型用于请求体
class ToggleHiddenRequest(BaseModel):
    hidden: bool


def _notify(db: Session, user_id: str, type: str, payload: dict) -> None:
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
# 内容 API (Content API)
# 功能：管理公共社区、校内论坛和问答模块。
# =============================================================================

# -----------------------------------------------------------------------------
# Community Posts (公共社区)
# -----------------------------------------------------------------------------
@router.get("/community/posts", response_model=List[schemas.CommunityPostWithAuthor])
def read_community_posts(
    skip: int = 0,
    limit: int = 10,
    show_hidden: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_optional_current_user)
):
    """
    获取公共社区帖子列表。
    - 全站可见
    - 默认只返回未隐藏(hidden=False或NULL)的帖子
    - HQ管理员可以通过 show_hidden=True 查看所有帖子
    """
    query = db.query(CommunityPost)
    
    # 检查是否为HQ管理员
    is_hq_admin = False
    if current_user:
        role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
        is_hq_admin = current_user.is_superuser or "association_hq" in role_codes
    
    # 普通用户或未请求显示隐藏内容时，过滤已隐藏的帖子
    if not (is_hq_admin and show_hidden):
        query = query.filter((CommunityPost.hidden == False) | (CommunityPost.hidden == None))
    
    posts = query.order_by(CommunityPost.created_at.desc()).offset(skip).limit(limit).all()
    user_ids = list({p.author_id for p in posts})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    result: list[dict] = []
    for p in posts:
        u = user_map.get(p.author_id)
        result.append(
            {
                "id": p.id,
                "author_id": p.author_id,
                "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
                "content": p.content,
                "tags": p.tags,
                "created_at": p.created_at,
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
                "shares_count": p.shares_count,
                "hidden": p.hidden,
            }
        )
    return result

@router.post("/community/posts", response_model=schemas.CommunityPost)
def create_community_post(
    post_in: schemas.CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    发布新帖子到公共社区。
    """
    post = CommunityPost(
        id=str(uuid.uuid4()),
        author_id=current_user.id,
        **post_in.dict()
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/community/posts/{post_id}", response_model=schemas.CommunityPostWithAuthor)
def read_community_post_detail(
    post_id: str,
    db: Session = Depends(get_db),
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # 隐藏的帖子不允许普通用户访问
    if post.hidden == True:  # 明确检查 True，允许 None/False
        raise HTTPException(status_code=404, detail="Post not found")
    u = db.query(User).filter(User.id == post.author_id).first()
    return {
        "id": post.id,
        "author_id": post.author_id,
        "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
        "content": post.content,
        "tags": post.tags,
        "created_at": post.created_at,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "shares_count": post.shares_count,
    }


@router.get("/community/posts/{post_id}/comments", response_model=List[schemas.CommunityCommentWithAuthor])
def read_community_post_comments(
    post_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comments = (
        db.query(CommunityComment)
        .filter(CommunityComment.post_id == post_id)
        .order_by(CommunityComment.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    user_ids = list({c.author_id for c in comments})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    result: list[dict] = []
    for c in comments:
        u = user_map.get(c.author_id)
        result.append(
            {
                "id": c.id,
                "post_id": c.post_id,
                "author_id": c.author_id,
                "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
                "content": c.content,
                "created_at": c.created_at,
                "likes_count": c.likes_count,
            }
        )
    return result


@router.post("/community/posts/{post_id}/comments", response_model=schemas.CommunityCommentWithAuthor)
def create_community_post_comment(
    post_id: str,
    comment_in: schemas.CommunityCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = CommunityComment(
        id=str(uuid.uuid4()),
        post_id=post_id,
        author_id=current_user.id,
        content=comment_in.content,
    )
    post.comments_count = int(post.comments_count or 0) + 1
    db.add(post)
    db.add(comment)
    
    # 通知帖子作者（如果评论者不是作者本人）
    if post.author_id and post.author_id != current_user.id:
        _notify(
            db,
            post.author_id,
            "post_commented",
            {
                "post_id": post.id,
                "post_title": (post.content[:30] + "...") if len(post.content) > 30 else post.content,
                "commenter_id": current_user.id,
                "commenter_name": current_user.full_name or current_user.username,
                "comment_preview": (comment.content[:50] + "...") if len(comment.content) > 50 else comment.content,
                "scope": "community",
            },
        )
    
    db.commit()
    db.refresh(comment)
    u = current_user
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "author_id": comment.author_id,
        "author": {"id": u.id, "username": u.username, "full_name": u.full_name},
        "content": comment.content,
        "created_at": comment.created_at,
        "likes_count": comment.likes_count,
    }

# -----------------------------------------------------------------------------
# Campus Community (校内论坛)
# -----------------------------------------------------------------------------
@router.get("/campus/{school_id}/topics", response_model=List[schemas.CampusTopic])
def read_campus_topics(
    school_id: str,
    db: Session = Depends(get_db)
):
    """
    获取指定高校的话题列表。
    """
    return db.query(CampusTopic).filter(CampusTopic.school_id == school_id).all()

@router.post("/campus/{school_id}/topics", response_model=schemas.CampusTopic)
def create_campus_topic(
    school_id: str,
    topic_in: schemas.CampusTopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user) # Needs refined permission
):
    """
    创建校内话题。
    - 仅高校管理员可操作 (权限检查待完善)
    """
    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_university_admin = "university_admin" in role_codes
    if not (current_user.is_superuser or is_hq or (current_user.school_id == school_id and is_university_admin)):
        raise HTTPException(status_code=403, detail="Not authorized")
    topic = CampusTopic(
        id=str(uuid.uuid4()),
        school_id=school_id,
        **topic_in.dict()
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.patch("/campus/{school_id}/topics/{topic_id}", response_model=schemas.CampusTopic)
def update_campus_topic(
    school_id: str,
    topic_id: str,
    update_in: schemas.CampusTopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_university_admin = "university_admin" in role_codes
    if not (current_user.is_superuser or is_hq or (current_user.school_id == school_id and is_university_admin)):
        raise HTTPException(status_code=403, detail="Not authorized")

    topic = (
        db.query(CampusTopic)
        .filter(CampusTopic.id == topic_id)
        .filter(CampusTopic.school_id == school_id)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if update_in.enabled is not None:
        topic.enabled = bool(update_in.enabled)

    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

def _can_access_campus_posts(user: User, school_id: str) -> bool:
    if user.is_superuser:
        return True
    if any(r.role_code == "association_hq" for r in (user.admin_roles or [])):
        return True
    return bool(user.school_id and user.school_id == school_id)

def _can_manage_campus_posts(user: User, school_id: str) -> bool:
    if user.is_superuser:
        return True
    if any(r.role_code == "association_hq" for r in (user.admin_roles or [])):
        return True
    if not (user.school_id and user.school_id == school_id):
        return False
    return any(r.role_code == "university_admin" for r in (user.admin_roles or []))


@router.get("/campus/{school_id}/posts", response_model=List[schemas.CampusPostWithAuthor])
def read_campus_posts(
    school_id: str,
    skip: int = 0,
    limit: int = 10,
    topic_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    获取校内帖子列表。
    - 仅特定高校成员或审计用户可见
    """
    if not _can_access_campus_posts(current_user, school_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(CampusPost).filter(CampusPost.school_id == school_id)
    if topic_id:
        # Simple string check for now, ideally parse JSON list
        query = query.filter(CampusPost.topic_ids.contains(topic_id))
    posts = (
        query.filter(CampusPost.visibility == "visible")
        .order_by(CampusPost.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    user_ids = list({p.author_id for p in posts})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    result: list[dict] = []
    for p in posts:
        u = user_map.get(p.author_id)
        result.append(
            {
                "id": p.id,
                "school_id": p.school_id,
                "author_id": p.author_id,
                "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
                "content": p.content,
                "topic_ids": p.topic_ids,
                "pinned": bool(p.pinned),
                "visibility": p.visibility,
                "created_at": p.created_at,
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
            }
        )
    return result


@router.get("/campus/{school_id}/posts/admin", response_model=List[schemas.CampusPostWithAuthor])
def read_campus_posts_admin(
    school_id: str,
    skip: int = 0,
    limit: int = 50,
    include_hidden: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if not _can_manage_campus_posts(current_user, school_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(CampusPost).filter(CampusPost.school_id == school_id)
    if not include_hidden:
        query = query.filter(CampusPost.visibility == "visible")
    posts = (
        query.order_by(CampusPost.pinned.desc(), CampusPost.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    user_ids = list({p.author_id for p in posts})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    result: list[dict] = []
    for p in posts:
        u = user_map.get(p.author_id)
        result.append(
            {
                "id": p.id,
                "school_id": p.school_id,
                "author_id": p.author_id,
                "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
                "content": p.content,
                "topic_ids": p.topic_ids,
                "pinned": bool(p.pinned),
                "visibility": p.visibility,
                "created_at": p.created_at,
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
            }
        )
    return result


@router.get("/campus/{school_id}/posts/{post_id}", response_model=schemas.CampusPostWithAuthor)
def read_campus_post_detail(
    school_id: str,
    post_id: str,
    include_hidden: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if not _can_access_campus_posts(current_user, school_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(CampusPost).filter(CampusPost.school_id == school_id).filter(CampusPost.id == post_id)
    if not include_hidden and not _can_manage_campus_posts(current_user, school_id):
        query = query.filter(CampusPost.visibility == "visible")
    post = query.first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    u = db.query(User).filter(User.id == post.author_id).first()
    return {
        "id": post.id,
        "school_id": post.school_id,
        "author_id": post.author_id,
        "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
        "content": post.content,
        "topic_ids": post.topic_ids,
        "pinned": bool(post.pinned),
        "visibility": post.visibility,
        "created_at": post.created_at,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
    }


@router.get("/campus/{school_id}/posts/{post_id}/comments", response_model=List[schemas.CampusPostCommentWithAuthor])
def read_campus_post_comments(
    school_id: str,
    post_id: str,
    skip: int = 0,
    limit: int = 50,
    include_hidden: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if not _can_access_campus_posts(current_user, school_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(CampusPost).filter(CampusPost.school_id == school_id).filter(CampusPost.id == post_id)
    if not include_hidden and not _can_manage_campus_posts(current_user, school_id):
        query = query.filter(CampusPost.visibility == "visible")
    post = query.first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = (
        db.query(CampusPostComment)
        .filter(CampusPostComment.school_id == school_id)
        .filter(CampusPostComment.post_id == post_id)
        .order_by(CampusPostComment.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    user_ids = list({c.author_id for c in comments})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    result: list[dict] = []
    for c in comments:
        u = user_map.get(c.author_id)
        result.append(
            {
                "id": c.id,
                "post_id": c.post_id,
                "school_id": c.school_id,
                "author_id": c.author_id,
                "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
                "content": c.content,
                "created_at": c.created_at,
                "likes_count": c.likes_count,
            }
        )
    return result


@router.post("/campus/{school_id}/posts/{post_id}/comments", response_model=schemas.CampusPostCommentWithAuthor)
def create_campus_post_comment(
    school_id: str,
    post_id: str,
    comment_in: schemas.CampusPostCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if current_user.school_id != school_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    post = (
        db.query(CampusPost)
        .filter(CampusPost.school_id == school_id)
        .filter(CampusPost.id == post_id)
        .filter(CampusPost.visibility == "visible")
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = CampusPostComment(
        id=str(uuid.uuid4()),
        post_id=post_id,
        school_id=school_id,
        author_id=current_user.id,
        content=comment_in.content,
    )
    post.comments_count = int(post.comments_count or 0) + 1
    db.add(post)
    db.add(comment)
    
    # 通知帖子作者（如果评论者不是作者本人）
    if post.author_id and post.author_id != current_user.id:
        _notify(
            db,
            post.author_id,
            "post_commented",
            {
                "post_id": post.id,
                "post_title": (post.content[:30] + "...") if len(post.content) > 30 else post.content,
                "commenter_id": current_user.id,
                "commenter_name": current_user.full_name or current_user.username,
                "comment_preview": (comment.content[:50] + "...") if len(comment.content) > 50 else comment.content,
                "scope": "campus",
                "school_id": school_id,
            },
        )
    
    db.commit()
    db.refresh(comment)
    u = current_user
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "school_id": comment.school_id,
        "author_id": comment.author_id,
        "author": {"id": u.id, "username": u.username, "full_name": u.full_name},
        "content": comment.content,
        "created_at": comment.created_at,
        "likes_count": comment.likes_count,
    }

@router.post("/campus/{school_id}/posts", response_model=schemas.CampusPost)
def create_campus_post(
    school_id: str,
    post_in: schemas.CampusPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    在校内论坛发帖。
    - 需要检查用户是否属于该校 (审计用户只读)
    """
    if current_user.school_id != school_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    post = CampusPost(
        id=str(uuid.uuid4()),
        school_id=school_id,
        author_id=current_user.id,
        **post_in.dict()
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/campus/{school_id}/posts/{post_id}", response_model=schemas.CampusPostWithAuthor)
def update_campus_post_admin(
    school_id: str,
    post_id: str,
    update_in: schemas.CampusPostAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if not _can_manage_campus_posts(current_user, school_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    post = (
        db.query(CampusPost)
        .filter(CampusPost.id == post_id)
        .filter(CampusPost.school_id == school_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if update_in.pinned is not None:
        post.pinned = bool(update_in.pinned)
    if update_in.visibility is not None:
        if update_in.visibility not in {"visible", "hidden"}:
            raise HTTPException(status_code=400, detail="Invalid visibility")
        post.visibility = update_in.visibility

    db.add(post)
    db.commit()
    db.refresh(post)

    u = db.query(User).filter(User.id == post.author_id).first()
    return {
        "id": post.id,
        "school_id": post.school_id,
        "author_id": post.author_id,
        "author": {"id": u.id, "username": u.username, "full_name": u.full_name} if u else None,
        "content": post.content,
        "topic_ids": post.topic_ids,
        "pinned": bool(post.pinned),
        "visibility": post.visibility,
        "created_at": post.created_at,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
    }


@router.delete("/campus/{school_id}/posts/{post_id}", response_model=dict)
def delete_campus_post_admin(
    school_id: str,
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if not _can_manage_campus_posts(current_user, school_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    deleted = (
        db.query(CampusPost)
        .filter(CampusPost.id == post_id)
        .filter(CampusPost.school_id == school_id)
        .delete()
    )
    if deleted <= 0:
        raise HTTPException(status_code=404, detail="Post not found")
    db.commit()
    return {"status": "deleted"}

# -----------------------------------------------------------------------------
# QA (悬赏问答)
# -----------------------------------------------------------------------------
@router.get("/qa/questions", response_model=List[dict])
def read_qa_questions(
    skip: int = 0,
    limit: int = 10,
    subject: Optional[str] = None,
    solved: Optional[bool] = None,
    show_hidden: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_optional_current_user)
):
    """
    获取问答列表。
    - 支持按学科和解决状态筛选
    - 按创建时间降序排列
    - 默认只返回未隐藏(hidden=False或NULL)的问题
    - HQ管理员可以通过 show_hidden=True 查看所有问题
    """
    query = db.query(QaQuestion)
    
    # 检查是否为HQ管理员
    is_hq_admin = False
    if current_user:
        role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
        is_hq_admin = current_user.is_superuser or "association_hq" in role_codes
    
    # 普通用户或未请求显示隐藏内容时，过滤已隐藏的问题
    if not (is_hq_admin and show_hidden):
        query = query.filter((QaQuestion.hidden == False) | (QaQuestion.hidden == None))
    
    if subject:
        query = query.filter(QaQuestion.subject == subject)
    if solved is not None:
        query = query.filter(QaQuestion.solved == solved)
    questions = query.order_by(QaQuestion.created_at.desc()).offset(skip).limit(limit).all()
    
    # 加载作者信息
    user_ids = list({q.author_id for q in questions if q and q.author_id})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    
    result = []
    for q in questions:
        u = user_map.get(q.author_id)
        result.append({
            "id": q.id,
            "author_id": q.author_id,
            "author_name": (u.full_name or u.username) if u else None,
            "subject": q.subject,
            "title": q.title,
            "content": q.content,
            "tags": q.tags,
            "reward_points": q.reward_points,
            "views": q.views,
            "answers_count": q.answers_count,
            "solved": q.solved,
            "accepted_answer_id": q.accepted_answer_id,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "hidden": q.hidden,
        })
    return result

@router.post("/qa/questions", response_model=schemas.QaQuestion)
def create_qa_question(
    question_in: schemas.QaQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    发布悬赏提问。
    - 待实现：积分冻结事务
    """
    # TODO: Transaction to freeze points
    question = QaQuestion(
        id=str(uuid.uuid4()),
        author_id=current_user.id,
        **question_in.dict()
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@router.post("/qa/questions/{id}/answers", response_model=schemas.QaAnswer)
def create_qa_answer(
    id: str,
    answer_in: schemas.QaAnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    回答问题。
    - 自动增加问题回答数
    """
    answer = QaAnswer(
        id=str(uuid.uuid4()),
        question_id=id,
        author_id=current_user.id,
        **answer_in.dict()
    )
    # Increment answers count
    question = db.query(QaQuestion).filter(QaQuestion.id == id).first()
    if question:
        question.answers_count += 1
        db.add(question)
        
        # 通知提问者（如果回答者不是提问者本人）
        if question.author_id and question.author_id != current_user.id:
            _notify(
                db,
                question.author_id,
                "question_answered",
                {
                    "question_id": question.id,
                    "question_title": question.title,
                    "answerer_id": current_user.id,
                    "answerer_name": current_user.full_name or current_user.username,
                    "answer_preview": (answer_in.content[:80] + "...") if len(answer_in.content) > 80 else answer_in.content,
                },
            )
    
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


@router.get("/qa/questions/{question_id}/answers", response_model=List[dict])
def read_qa_answers(
    question_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    获取问题的回答列表。
    """
    answers = (
        db.query(QaAnswer)
        .filter(QaAnswer.question_id == question_id)
        .order_by(QaAnswer.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    user_ids = list({a.author_id for a in answers if a and a.author_id})
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    result: list[dict] = []
    for a in answers:
        u = user_map.get(a.author_id)
        result.append(
            {
                "id": a.id,
                "question_id": a.question_id,
                "author_id": a.author_id,
                "author_name": (u.full_name or u.username) if u else None,
                "content": a.content,
                "likes_count": a.likes_count,
                "created_at": a.created_at,
            }
        )
    return result


@router.post("/qa/questions/{question_id}/accept", response_model=schemas.QaQuestion)
def accept_qa_answer(
    question_id: str,
    answer_id: str = Query(..., description="要采纳的回答 ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    采纳答案。
    - 仅提问者可采纳
    - 待实现：积分结算事务
    """
    question = db.query(QaQuestion).filter(QaQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if question.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only question author can accept answer")
    
    if question.solved:
        raise HTTPException(status_code=400, detail="Question already solved")
    
    answer = db.query(QaAnswer).filter(QaAnswer.id == answer_id).filter(QaAnswer.question_id == question_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    question.solved = True
    question.accepted_answer_id = answer_id
    db.add(question)
    
    # 通知回答者（如果回答者不是提问者本人）
    if answer.author_id and answer.author_id != current_user.id:
        _notify(
            db,
            answer.author_id,
            "answer_accepted",
            {
                "question_id": question.id,
                "question_title": question.title,
                "reward_points": question.reward_points or 0,
                "accepter_id": current_user.id,
                "accepter_name": current_user.full_name or current_user.username,
            },
        )
    
    # TODO: 积分结算事务 - 将悬赏积分转给回答者
    
    db.commit()
    db.refresh(question)
    return question


# -----------------------------------------------------------------------------
# Admin Operations - 删除公共社区帖子
# -----------------------------------------------------------------------------
@router.delete("/community/posts/{post_id}", response_model=dict)
def delete_community_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    删除公共社区帖子。
    - 仅作者本人或 HQ 管理员可删除
    - 同时删除相关评论
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # 权限检查：作者或 HQ
    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_super = current_user.is_superuser
    is_author = post.author_id == current_user.id
    
    if not (is_super or is_hq or is_author):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # 删除相关评论
    db.query(CommunityComment).filter(CommunityComment.post_id == post_id).delete()
    
    # 删除帖子
    db.delete(post)
    db.commit()
    return {"status": "deleted", "id": post_id}


# -----------------------------------------------------------------------------
# Admin Operations - 删除问答问题
# -----------------------------------------------------------------------------
@router.delete("/qa/questions/{question_id}", response_model=dict)
def delete_qa_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    删除问答问题。
    - 仅作者本人或 HQ 管理员可删除
    - 同时删除相关回答
    """
    question = db.query(QaQuestion).filter(QaQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # 权限检查：作者或 HQ
    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_super = current_user.is_superuser
    is_author = question.author_id == current_user.id
    
    if not (is_super or is_hq or is_author):
        raise HTTPException(status_code=403, detail="Not authorized to delete this question")
    
    # 删除相关回答
    db.query(QaAnswer).filter(QaAnswer.question_id == question_id).delete()
    
    # 删除问题
    db.delete(question)
    db.commit()
    return {"status": "deleted", "id": question_id}


# -----------------------------------------------------------------------------
# Admin Operations - 隐藏/显示公共社区帖子
# -----------------------------------------------------------------------------
@router.post("/community/posts/{post_id}/toggle-hidden", response_model=dict)
def toggle_community_post_hidden(
    post_id: str,
    request: ToggleHiddenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    隐藏或显示公共社区帖子。
    - 仅 HQ 管理员可操作
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # 权限检查：仅 HQ
    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_super = current_user.is_superuser
    
    if not (is_super or is_hq):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 更新隐藏状态
    post.hidden = request.hidden
    db.add(post)
    db.commit()
    return {"status": "success", "hidden": request.hidden}


# -----------------------------------------------------------------------------
# Admin Operations - 隐藏/显示问答问题
# -----------------------------------------------------------------------------
@router.post("/qa/questions/{question_id}/toggle-hidden", response_model=dict)
def toggle_qa_question_hidden(
    question_id: str,
    request: ToggleHiddenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    隐藏或显示问答问题。
    - 仅 HQ 管理员可操作
    """
    question = db.query(QaQuestion).filter(QaQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # 权限检查：仅 HQ
    role_codes = {r.role_code for r in (current_user.admin_roles or []) if r and r.role_code}
    is_hq = "association_hq" in role_codes
    is_super = current_user.is_superuser
    
    if not (is_super or is_hq):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 更新隐藏状态
    question.hidden = request.hidden
    db.add(question)
    db.commit()
    return {"status": "success", "hidden": request.hidden}
