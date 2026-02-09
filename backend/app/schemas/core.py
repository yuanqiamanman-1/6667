from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# =============================================================================
# 核心数据模式 (Core Schemas)
# 功能：定义组织、标签和公告的请求/响应结构。
# =============================================================================

# -----------------------------------------------------------------------------
# Organization (组织)
# -----------------------------------------------------------------------------
class OrganizationBase(BaseModel):
    type: str             # university, university_association, aid_school
    display_name: str     # 显示名称
    school_id: Optional[str] = None     # 高校唯一标识
    aid_school_id: Optional[str] = None # 受援学校唯一标识
    certified: bool = False             # 是否认证

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Tag (标签)
# -----------------------------------------------------------------------------
class TagBase(BaseModel):
    name: str
    category: str    # subject, grade, role, skill
    enabled: bool = True

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    enabled: Optional[bool] = None

class Tag(TagBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Announcement (公告)
# -----------------------------------------------------------------------------
class AnnouncementBase(BaseModel):
    title: str
    content: str
    scope: str     # public, campus, aid
    audience: str  # public_all, campus_all, association_teachers_only, aid_school_only
    school_id: Optional[str] = None       # 关联高校
    organization_id: Optional[str] = None # 关联组织
    pinned: bool = False   # 是否置顶
    version: str = "1.0"   # 版本号

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    pinned: Optional[bool] = None

class Announcement(AnnouncementBase):
    id: str
    created_by: str        # 发布人 ID
    created_by_user: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True
