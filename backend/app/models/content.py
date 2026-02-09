from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class CommunityPost(Base):
    """
    公共社区帖子模型 (Community Post Model)
    对应数据库表：community_posts
    功能：全站可见的动态信息流，支持点赞、评论和分享。
    """
    __tablename__ = "community_posts"
    
    id = Column(String, primary_key=True, index=True)
    author_id = Column(String, index=True) # 发帖人 ID
    content = Column(Text)                 # 帖子内容
    tags = Column(String)                  # 标签列表 (JSON 字符串或逗号分隔)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 互动计数 (便于快速查询，实际业务中可配合 Redis 计数器)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    
    # 管理员隐藏功能
    hidden = Column(Boolean, default=False)


class CommunityComment(Base):
    """
    公共社区评论模型 (Community Comment Model)
    对应数据库表：community_comments
    功能：公共社区帖子楼层评论。
    """
    __tablename__ = "community_comments"

    id = Column(String, primary_key=True, index=True)
    post_id = Column(String, ForeignKey("community_posts.id"), index=True)
    author_id = Column(String, index=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    likes_count = Column(Integer, default=0)

class CampusTopic(Base):
    """
    校内话题模型 (Campus Topic Model)
    对应数据库表：campus_topics
    功能：高校内部的话题分类，由高校管理员维护。
    """
    __tablename__ = "campus_topics"
    
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, index=True) # 所属高校 ID
    name = Column(String)                  # 话题名称 (如 "考研交流", "二手交易")
    enabled = Column(Boolean, default=True)# 是否启用
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CampusPost(Base):
    """
    校内帖子模型 (Campus Post Model)
    对应数据库表：campus_posts
    功能：仅限特定高校成员可见的帖子，支持置顶和隐藏。
    """
    __tablename__ = "campus_posts"
    
    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, index=True) # 所属高校 ID
    author_id = Column(String, index=True) # 发帖人 ID
    content = Column(Text)
    topic_ids = Column(String)             # 关联话题 ID 列表 (JSON 字符串)
    
    pinned = Column(Boolean, default=False)         # 是否校内置顶
    visibility = Column(String, default="visible")  # 可见性: visible(正常), hidden(被管理员隐藏)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)


class CampusPostComment(Base):
    """
    校内帖子评论模型 (Campus Post Comment Model)
    对应数据库表：campus_post_comments
    功能：校内帖子楼层评论。
    """
    __tablename__ = "campus_post_comments"

    id = Column(String, primary_key=True, index=True)
    post_id = Column(String, ForeignKey("campus_posts.id"), index=True)
    school_id = Column(String, index=True)
    author_id = Column(String, index=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    likes_count = Column(Integer, default=0)

class QaQuestion(Base):
    """
    问答提问模型 (Q&A Question Model)
    对应数据库表：qa_questions
    功能：悬赏问答，支持积分悬赏和最佳答案采纳。
    """
    __tablename__ = "qa_questions"
    
    id = Column(String, primary_key=True, index=True)
    author_id = Column(String, index=True)
    subject = Column(String) # 学科/领域
    title = Column(String)   # 问题标题
    content = Column(Text)   # 问题详情
    tags = Column(String)    # 标签
    
    reward_points = Column(Integer, default=0) # 悬赏积分
    views = Column(Integer, default=0)         # 浏览量
    answers_count = Column(Integer, default=0) # 回答数
    
    solved = Column(Boolean, default=False)    # 是否已解决
    accepted_answer_id = Column(String, nullable=True) # 被采纳的回答 ID
    
    # 管理员隐藏功能
    hidden = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QaAnswer(Base):
    """
    问答回答模型 (Q&A Answer Model)
    对应数据库表：qa_answers
    功能：对提问的回复。
    """
    __tablename__ = "qa_answers"
    
    id = Column(String, primary_key=True, index=True)
    question_id = Column(String, ForeignKey("qa_questions.id"), index=True) # 关联的问题 ID
    author_id = Column(String)
    content = Column(Text)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
