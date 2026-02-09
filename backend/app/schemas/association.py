from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# =============================================================================
# 协会与认证数据模式 (Association & Verification Schemas)
# 功能：定义认证申请、协会任务、规则和时长发放的请求/响应结构。
# =============================================================================

# -----------------------------------------------------------------------------
# Verification Request (认证申请)
# -----------------------------------------------------------------------------
class VerificationRequestBase(BaseModel):
    type: str             # 认证类型
    target_school_id: Optional[str] = None # 目标高校
    organization_id: Optional[str] = None  # 目标组织
    evidence_refs: str    # 证明材料 (JSON)
    note: Optional[str] = None # 备注

class VerificationRequestCreate(VerificationRequestBase):
    pass

# 审核请求参数
class VerificationReview(BaseModel):
    status: str # approved, rejected
    rejected_reason: Optional[str] = None # 拒绝理由

class VerificationRequest(VerificationRequestBase):
    id: str
    applicant_id: str # 申请人
    applicant_name: Optional[str] = None
    status: str       # 状态
    created_at: datetime
    reviewed_by: Optional[str] = None # 审核人
    reviewed_at: Optional[datetime] = None # 审核时间
    rejected_reason: Optional[str] = None
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Association Task (志愿者任务)
# -----------------------------------------------------------------------------
class AssociationTaskBase(BaseModel):
    title: str            # 标题
    description: str      # 描述
    reward_hours: float   # 奖励时长
    max_participants: int # 最大人数

class AssociationTaskCreate(AssociationTaskBase):
    pass

class AssociationTask(AssociationTaskBase):
    id: str
    school_id: str        # 所属高校
    status: str           # 状态
    created_by: str       # 发布人
    created_at: datetime
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Association Rule Set (运营规则)
# -----------------------------------------------------------------------------
class AssociationRuleSetBase(BaseModel):
    exchange_rate: float  # 兑换汇率

class AssociationRuleSetCreate(AssociationRuleSetBase):
    pass

class AssociationRuleSet(AssociationRuleSetBase):
    id: str
    school_id: str        # 关联高校
    version: str          # 版本
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Volunteer Hour Grant (时长发放)
# -----------------------------------------------------------------------------
class VolunteerHourGrantBase(BaseModel):
    user_id: str          # 受赠用户
    amount: float         # 时长
    reason: str           # 理由
    source_type: str = "manual" # 来源
    source_id: Optional[str] = None # 来源 ID

class VolunteerHourGrantCreate(VolunteerHourGrantBase):
    pass

class VolunteerHourGrant(VolunteerHourGrantBase):
    id: str
    school_id: str        # 关联高校
    granted_by: str       # 发放人
    created_at: datetime
    class Config:
        from_attributes = True


class TeacherPoolEntryBase(BaseModel):
    user_id: str
    school_id: str
    tags: List[str] = []
    time_slots: List[str] = []
    in_pool: bool = True


class TeacherPoolEntryUpdate(BaseModel):
    in_pool: bool


class TeacherPoolEntry(TeacherPoolEntryBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeacherPoolUser(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    school_id: Optional[str] = None


class TeacherPoolEntryWithUser(TeacherPoolEntry):
    user: TeacherPoolUser
