from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr

# =============================================================================
# 用户数据模式 (User Schemas)
# 功能：定义用户相关的请求/响应数据结构，用于 Pydantic 验证和序列化。
# =============================================================================

# Token 响应模式
class Token(BaseModel):
    access_token: str
    token_type: str

# Token 载荷模式 (用于 JWT 解码)
class TokenPayload(BaseModel):
    sub: Optional[str] = None # 主题 (通常是 User ID)

# Admin Role Schema
class AdminRole(BaseModel):
    role_code: str
    organization_id: Optional[str] = None
    
    class Config:
        from_attributes = True

# 用户基础字段 (共享字段)
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    role: Optional[str] = "guest" # 用户层角色: guest, general_student, university_student, volunteer_teacher, special_aid_student, governance
    school_id: Optional[str] = None
    organization_id: Optional[str] = None
    onboarding_status: Optional[str] = "approved" # pending, approved, rejected
    profile: Optional[str] = None

# 用户创建请求 (注册时用)
class UserCreate(UserBase):
    username: str
    email: EmailStr
    password: str # 必须包含明文密码
    account_type: Optional[str] = "user" # user, org_admin_applicant
    # If org_admin_applicant
    org_type: Optional[str] = None # university, university_association, aid_school
    org_name: Optional[str] = None
    school_name: Optional[str] = None
    association_name: Optional[str] = None
    contact_phone: Optional[str] = None

# 用户更新请求
class UserUpdate(UserBase):
    password: Optional[str] = None # 密码可选更新

# 数据库中的用户基础结构 (包含 ID)
class UserInDBBase(UserBase):
    id: str
    username: str

    class Config:
        from_attributes = True # 允许从 ORM 模型读取数据

# 公开返回的用户信息 (不含密码)
class User(UserInDBBase):
    admin_roles: List[AdminRole] = []
    capabilities: Optional[Dict[str, Any]] = None # Computed capabilities

# 数据库存储的用户信息 (含哈希密码)
class UserInDB(UserInDBBase):
    hashed_password: str
