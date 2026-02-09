from sqlalchemy import Boolean, Column, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.session import Base

class Organization(Base):
    """
    组织模型 (Organization Model)
    对应数据库表：organizations
    功能：存储平台上的各类组织机构，用于多租户隔离和权限管理。
    """
    __tablename__ = "organizations"
    
    id = Column(String, primary_key=True, index=True)
    # 组织类型:
    # - university: 高校
    # - university_association: 高校志愿者协会
    # - aid_school: 受援学校
    type = Column(String, index=True) 
    display_name = Column(String) # 显示名称 (如 "清华大学")
    
    # 业务 ID (用于 URL 或业务逻辑查找)
    school_id = Column(String, index=True, nullable=True)     # 高校唯一标识 (如 "tsinghua")，不唯一（大学和协会共享）
    aid_school_id = Column(String, unique=True, nullable=True) # 受援学校唯一标识
    
    certified = Column(Boolean, default=False) # 是否已通过平台认证
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class Tag(Base):
    """
    标签模型 (Tag Model)
    对应数据库表：tags
    功能：全局标签字典，用于内容分类、用户画像和匹配推荐。
    """
    __tablename__ = "tags"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True) # 标签名称 (如 "数学", "小学一年级")
    # 标签分类:
    # - subject: 学科
    # - grade: 年级
    # - role: 角色身份
    # - skill: 技能
    category = Column(String, index=True) 
    enabled = Column(Boolean, default=True) # 是否启用
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Announcement(Base):
    """
    公告模型 (Announcement Model)
    对应数据库表：announcements
    功能：分级公告体系，支持全站、校内和受援学校范围的通知发布。
    """
    __tablename__ = "announcements"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String)   # 标题
    content = Column(Text)   # 内容 (支持 Markdown/HTML)
    
    # 发布范围:
    # - public: 全站可见
    # - campus: 仅特定高校可见 (需指定 school_id)
    # - aid: 仅特定受援学校可见 (需指定 organization_id)
    scope = Column(String) 
    
    # 目标受众:
    # - all: 所有人
    # - students: 仅学生
    # - teachers: 仅志愿者讲师
    audience = Column(String) 
    
    # 归属上下文
    school_id = Column(String, nullable=True)       # 关联高校 ID
    organization_id = Column(String, nullable=True) # 关联组织 ID
    
    pinned = Column(Boolean, default=False)         # 是否置顶
    created_by = Column(String)                     # 发布人 ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    version = Column(String)                        # 版本号 (用于内容修订记录)
