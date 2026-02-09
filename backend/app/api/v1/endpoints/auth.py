from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid
import json

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, AdminOnboardingRequest
from app.models.core import Organization
from app.schemas.user import Token, UserCreate, User as UserSchema

router = APIRouter()

# =============================================================================
# 认证与用户 API (Auth & Users API)
# 功能：处理用户登录、注册、Token 获取和用户信息查询。
# =============================================================================

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    用户登录并获取 Access Token。
    - 使用 OAuth2 密码模式 (username/password)
    - 验证用户名密码，返回 JWT Bearer Token
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # 生成 Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/signup", response_model=UserSchema)
def signup(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    新用户注册。
    - 支持普通用户与组织账号申请
    - 创建新用户，加密存储密码
    - 校验邮箱唯一性
    """
    # 检查邮箱是否已存在
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Determine role and onboarding status
    role = "guest" # Default
    onboarding_status = "approved" # Default for normal users
    
    if user_in.account_type == "org_admin_applicant":
        role = "governance" # Not a student
        onboarding_status = "pending"
        # We need to create an AdminOnboardingRequest
    elif user_in.role:
        role = user_in.role # Allow setting role for general_student etc if provided
        
    # 创建用户对象
    user_id = str(uuid.uuid4())
    user_obj = User(
        id=user_id,
        username=user_in.username,
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=role,
        onboarding_status=onboarding_status,
        is_active=True,
        is_superuser=user_in.is_superuser,
    )
    db.add(user_obj)
    
    # Create onboarding request if needed
    if user_in.account_type == "org_admin_applicant":
        school_name = user_in.school_name or user_in.org_name or ""
        association_name = user_in.association_name or user_in.org_name
        req = AdminOnboardingRequest(
            id=str(uuid.uuid4()),
            org_type=user_in.org_type,
            school_name=school_name,
            association_name=association_name if user_in.org_type == "university_association" else None,
            contact_name=user_in.full_name or user_in.username,
            contact_email=user_in.email,
            contact_phone=user_in.contact_phone,
            user_id=user_id,
            status="pending"
        )
        db.add(req)

    db.commit()
    db.refresh(user_obj)
    
    # Populate capabilities for response
    user_obj.capabilities = compute_capabilities(user_obj)
    return user_obj

@router.get("/me", response_model=UserSchema)
def read_users_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取当前登录用户的信息。
    - 需要有效的 Bearer Token
    - 返回包含 capabilities 和 admin_roles 的完整信息
    """
    hydrate_user_context(db, current_user)
    current_user.capabilities = compute_capabilities(current_user)
    return current_user

def hydrate_user_context(db: Session, user: User) -> None:
    if user.school_id:
        return
    scoped_org_id = None
    for ar in user.admin_roles:
        if ar.role_code in {"university_admin", "university_association_admin"} and ar.organization_id:
            scoped_org_id = ar.organization_id
            break
    if not scoped_org_id:
        return
    org = db.query(Organization).filter(Organization.id == scoped_org_id).first()
    if org and org.school_id:
        user.school_id = org.school_id

def parse_profile(profile_text: str | None) -> dict:
    if not profile_text:
        return {}
    try:
        value = json.loads(profile_text)
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}

def compute_capabilities(user: User) -> dict:
    """
    计算用户的前端能力开关
    """
    caps = {
        "can_access_admin_panel": False,
        "can_access_campus": False,
        "can_access_association": False,
        "can_manage_association": False,
        "can_manage_university": False,
        "can_manage_aid": False,
        "can_manage_platform": False,
        "can_audit_cross_campus": False,
        "role_display": user.role
    }
    
    # Superuser / Platform Admin
    if user.is_superuser:
        caps["can_access_admin_panel"] = True
        caps["can_manage_platform"] = True
        caps["can_audit_cross_campus"] = True
        return caps

    # Governance roles via AdminRoles
    admin_roles = user.admin_roles
    for ar in admin_roles:
        if ar.role_code == "association_hq":
            caps["can_access_admin_panel"] = True
            caps["can_manage_platform"] = True # HQ has platform level governance
            caps["can_audit_cross_campus"] = True
        elif ar.role_code == "university_admin":
            caps["can_access_admin_panel"] = True
            caps["can_access_campus"] = True
            caps["can_manage_university"] = True
        elif ar.role_code == "university_association_admin":
            caps["can_access_admin_panel"] = True
            caps["can_access_campus"] = True
            caps["can_access_association"] = True
            caps["can_manage_association"] = True
        elif ar.role_code == "aid_school_admin":
            caps["can_access_admin_panel"] = True
            caps["can_manage_aid"] = True

    # User roles
    if user.role == "university_student":
        caps["can_access_campus"] = True
    elif user.role == "volunteer_teacher":
        profile = parse_profile(user.profile)
        verification = profile.get("verification") if isinstance(profile, dict) else None
        teacher_ok = isinstance(verification, dict) and verification.get("teacher") == "verified"
        student_ok = isinstance(verification, dict) and verification.get("student") == "verified"
        caps["can_access_campus"] = bool(student_ok)
        caps["can_access_association"] = bool(teacher_ok and student_ok)
    
    return caps
