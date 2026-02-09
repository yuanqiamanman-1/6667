from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from app.db.session import Base

# =============================================================================
# 积分与匹配模型 (Points & Match Models)
# =============================================================================

class PointTxn(Base):
    """
    积分流水模型 (Point Transaction Model)
    对应数据库表：point_transactions
    功能：记录用户积分的所有变动历史（不可变账本），余额通过聚合计算得出。
    """
    __tablename__ = "point_transactions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True) # 关联用户 ID
    
    # 交易类型:
    # - reward_in: 奖励收入 (如回答被采纳)
    # - reward_out: 悬赏支出 (如发布悬赏问题)
    # - redeem: 兑换支出 (如兑换商品)
    # - admin_adjust: 管理员调整
    type = Column(String, index=True) 
    
    title = Column(String)               # 交易标题 (如 "最佳答案奖励")
    points = Column(Integer)             # 变动金额 (正数为收入，负数为支出)
    meta = Column(String, nullable=True) # 元数据 (JSON 格式，如关联的 question_id)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MatchRequest(Base):
    """
    匹配请求模型 (Match Request Model)
    对应数据库表：match_requests
    功能：学生发起的辅导求助单，包含匹配条件，用于匹配引擎进行志愿者撮合。
    """
    __tablename__ = "match_requests"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, index=True) # 发起学生 ID
    
    tags = Column(String)    # 需求标签列表 (JSON 字符串，如 ["数学", "小学"])
    channel = Column(String) # 期望沟通方式: text, voice, video
    time_mode = Column(String) # 时间模式: now(即时), schedule(预约)
    time_slots = Column(String, nullable=True) # 预约时间段 (JSON 字符串)
    note = Column(Text, nullable=True)         # 补充说明
    
    # 请求状态: pending(匹配中), matched(已匹配), cancelled(已取消), completed(已完成)
    status = Column(String, default="pending", index=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MatchOffer(Base):
    __tablename__ = "match_offers"

    id = Column(String, primary_key=True, index=True)
    request_id = Column(String, index=True)
    student_id = Column(String, index=True)
    teacher_id = Column(String, index=True)
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
