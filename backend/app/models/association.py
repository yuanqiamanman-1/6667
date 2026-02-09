from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from app.db.session import Base

# =============================================================================
# 认证与协会运营模型 (Verification & Association Models)
# =============================================================================

# VerificationRequest moved to user.py

class AssociationTask(Base):
    """
    志愿者任务模型 (Association Task Model)
    对应数据库表：association_tasks
    功能：高校志愿者协会发布的任务，供校内志愿者领取，完成后发放志愿时长。
    """
    __tablename__ = "association_tasks"
    
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, index=True) # 发布协会所属高校 ID
    title = Column(String)                 # 任务标题
    description = Column(Text)             # 任务详情
    
    # 任务状态: open(开放报名), in_progress(进行中), completed(已结束), closed(关闭)
    status = Column(String, default="open", index=True) 
    
    reward_hours = Column(Float, default=0) # 奖励志愿时长 (小时)
    max_participants = Column(Integer)      # 最大参与人数
    
    created_by = Column(String)             # 发布人 ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AssociationRuleSet(Base):
    """
    协会运营规则模型 (Association Rule Set Model)
    对应数据库表：association_rules
    功能：配置各高校协会的积分兑换比例、商城规则等。
    """
    __tablename__ = "association_rules"
    
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, unique=True, index=True) # 关联高校
    exchange_rate = Column(Float) # 积分兑换实物/时长的汇率
    version = Column(String)      # 规则版本号 (用于审计)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class VolunteerHourGrant(Base):
    """
    志愿时长发放记录 (Volunteer Hour Grant Model)
    对应数据库表：volunteer_hour_grants
    功能：记录志愿时长的发放流水，用于审计和生成志愿服务证明。
    """
    __tablename__ = "volunteer_hour_grants"
    
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, index=True) # 关联高校
    user_id = Column(String, index=True)   # 获赠用户 ID
    amount = Column(Float)                 # 发放时长 (小时)
    reason = Column(String)                # 发放理由
    
    # 来源类型:
    # - task: 任务完成奖励
    # - manual: 管理员手动补发
    # - rollback: 错误回滚
    source_type = Column(String) 
    source_id = Column(String, nullable=True) # 关联源 ID (如 task_id)
    
    granted_by = Column(String) # 操作人 ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
