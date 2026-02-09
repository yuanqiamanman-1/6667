from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    """
    用户模型 (User Model)
    对应数据库表：users
    功能：存储平台所有用户的基本信息、用户层角色、归属关系和账号状态。
    管理层权限通过 AdminRole 关联表实现。
    """
    __tablename__ = "users"

    # 基础信息
    id = Column(String, primary_key=True, index=True)  # 用户唯一标识 (UUID)
    username = Column(String, unique=True, index=True) # 用户名 (登录用)
    email = Column(String, unique=True, index=True)    # 邮箱 (登录/通知用)
    hashed_password = Column(String)                   # 加密后的密码
    full_name = Column(String)                         # 显示名称 (真实姓名或昵称)
    
    # 用户层角色 (User Role) - 定义该账号作为"用户"的身份
    # 取值范围：
    # - guest: 游客
    # - general_student: 普通学生
    # - university_student: 高校学生 (需绑定 school_id)
    # - volunteer_teacher: 志愿者讲师 (需绑定 school_id)
    # - special_aid_student: 专项援助学生 (需绑定 organization_id)
    # - governance: 纯治理账号 (无学生身份，如 superadmin, hq, admin)
    role = Column(String, default="guest")
    
    # 归属上下文 (Context)
    school_id = Column(String, nullable=True)       # 所属高校 ID (university_student/volunteer_teacher)
    organization_id = Column(String, nullable=True) # 所属组织 ID (aid_student)
    
    # 账号状态
    is_active = Column(Boolean, default=True)      # 是否激活 (封禁/未激活时为 False)
    is_superuser = Column(Boolean, default=False)  # 是否为超级用户 (拥有最高权限，跨越所有域)
    
    # 入驻/认证状态 (Onboarding Status)
    # 取值：pending, approved, rejected
    # 用于组织账号申请 (org_admin_applicant) 或其他需人工审核的账号初始状态
    onboarding_status = Column(String, default="approved") 
    
    # Extended Profile (JSON string)
    profile = Column(Text, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # 注册时间
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())       # 最后更新时间

    # Relationships
    admin_roles = relationship("AdminRole", back_populates="user", cascade="all, delete-orphan")


class AdminRole(Base):
    """
    管理员角色模型 (Admin Role Model)
    对应数据库表：admin_roles
    功能：定义用户在特定组织域下的管理权限。一个用户可以拥有多个管理角色。
    """
    __tablename__ = "admin_roles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    
    # 角色代码
    # - university_admin: 高校管理员
    # - university_association_admin: 高校志愿者协会管理员
    # - aid_school_admin: 受援学校管理员
    # - association_hq: 志愿者协会总号
    # - superadmin: 超级管理员 (通常 is_superuser=True, 这里可作为显式标记)
    role_code = Column(String, index=True)
    
    # 权限作用域 (Organization Context)
    # 如果是 association_hq 或 superadmin，通常 organization_id 为空或特定值
    # 如果是 university_admin，必须绑定 organization_id (对应 organizations.id)
    organization_id = Column(String, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="admin_roles")


class VerificationRequest(Base):
    """
    认证申请模型 (Verification Request Model)
    对应数据库表：verification_requests
    功能：存储用户的各类认证申请，支持多态认证 (高校学生、讲师、援助学生等)。
    """
    __tablename__ = "verification_requests"

    id = Column(String, primary_key=True, index=True)
    
    # 申请类型
    # - general_basic: 普通用户基础认证
    # - university_student: 高校学生认证
    # - volunteer_teacher: 志愿者讲师认证
    # - special_aid: 专项援助学生认证
    type = Column(String, index=True)
    
    applicant_id = Column(String, index=True) # 申请人 ID
    applicant_name = Column(String)           # 申请人姓名快照
    
    # 目标组织 (路由审核用)
    target_school_id = Column(String, nullable=True)       # 目标高校 ID
    target_organization_id = Column(String, nullable=True) # 目标组织 ID (如协会、援助学校)
    
    # 证据材料 (JSON list of filenames/urls)
    evidence_refs = Column(Text, nullable=True)
    
    # 补充说明
    note = Column(Text, nullable=True)
    
    # 状态: pending, approved, rejected
    status = Column(String, default="pending", index=True)
    
    # 审核信息
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejected_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AdminOnboardingRequest(Base):
    """
    组织账号入驻申请模型 (Admin Onboarding Request Model)
    对应数据库表：admin_onboarding_requests
    功能：存储高校/协会/援助学校的入驻申请，由总号审核。
    """
    __tablename__ = "admin_onboarding_requests"

    id = Column(String, primary_key=True, index=True)
    
    # 申请类型: university, university_association, aid_school
    org_type = Column(String, index=True)
    
    school_name = Column(String)      # 学校名称
    association_name = Column(String, nullable=True) # 协会名称 (如适用)
    
    contact_name = Column(String)     # 联系人
    contact_email = Column(String)    # 联系邮箱
    contact_phone = Column(String, nullable=True)
    
    # 关联的用户账号 (申请人)
    user_id = Column(String, index=True)
    
    # 证据材料 (JSON list)
    evidence_refs = Column(Text, nullable=True)
    
    # 状态: pending, approved, rejected
    status = Column(String, default="pending", index=True)
    
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejected_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
