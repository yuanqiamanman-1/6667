from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# =============================================================================
# 积分与匹配数据模式 (Points & Match Schemas)
# 功能：定义积分流水、匹配请求的请求/响应结构。
# =============================================================================

# -----------------------------------------------------------------------------
# Point Transaction (积分流水)
# -----------------------------------------------------------------------------
class PointTxnBase(BaseModel):
    user_id: str
    type: str     # 交易类型
    title: str    # 标题
    points: int   # 变动金额
    meta: Optional[str] = None # 元数据 (JSON)

class PointTxnCreate(PointTxnBase):
    pass

class PointTxn(PointTxnBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Match Request (匹配请求)
# -----------------------------------------------------------------------------
class MatchRequestBase(BaseModel):
    tags: str     # 需求标签 (JSON)
    channel: str  # 沟通方式
    time_mode: str # 时间模式
    time_slots: Optional[str] = None # 时间段 (JSON)
    note: Optional[str] = None       # 备注

class MatchRequestCreate(MatchRequestBase):
    pass

class MatchRequest(MatchRequestBase):
    id: str
    student_id: str # 发起学生
    status: str     # 状态
    created_at: datetime
    class Config:
        from_attributes = True


class MatchCandidate(BaseModel):
    user_id: str
    username: str
    full_name: Optional[str] = None
    school_id: Optional[str] = None
    school_display_name: Optional[str] = None
    tags: List[str] = []
    time_slots: List[str] = []
    in_pool: bool = True
    explain: Optional[str] = None


class MatchOffer(BaseModel):
    id: str
    request_id: str
    student_id: str
    teacher_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
