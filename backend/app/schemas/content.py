from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# =============================================================================
# 内容数据模式 (Content Schemas)
# 功能：定义社区、校内论坛和问答相关的请求/响应结构。
# =============================================================================

# -----------------------------------------------------------------------------
# Community Post (公共社区帖子)
# -----------------------------------------------------------------------------
class CommunityPostBase(BaseModel):
    content: str               # 帖子内容
    tags: Optional[str] = None # 标签列表 (JSON)

class CommunityPostCreate(CommunityPostBase):
    pass

class CommunityPost(CommunityPostBase):
    id: str
    author_id: str             # 发帖人 ID
    created_at: datetime
    likes_count: int           # 点赞数
    comments_count: int        # 评论数
    shares_count: int          # 分享数
    hidden: Optional[bool] = None  # 管理员隐藏状态
    class Config:
        from_attributes = True


class PostAuthor(BaseModel):
    id: str
    username: str
    full_name: Optional[str] = None


class CommunityPostWithAuthor(CommunityPost):
    author: Optional[PostAuthor] = None

# -----------------------------------------------------------------------------
# Community Comment (公共社区评论)
# -----------------------------------------------------------------------------
class CommunityCommentBase(BaseModel):
    content: str


class CommunityCommentCreate(CommunityCommentBase):
    pass


class CommunityComment(CommunityCommentBase):
    id: str
    post_id: str
    author_id: str
    created_at: datetime
    likes_count: int
    class Config:
        from_attributes = True


class CommunityCommentWithAuthor(CommunityComment):
    author: Optional[PostAuthor] = None

# -----------------------------------------------------------------------------
# Campus Topic (校内话题)
# -----------------------------------------------------------------------------
class CampusTopicBase(BaseModel):
    name: str                  # 话题名称
    enabled: bool = True       # 是否启用

class CampusTopicCreate(CampusTopicBase):
    pass

class CampusTopicUpdate(BaseModel):
    enabled: Optional[bool] = None

class CampusTopic(CampusTopicBase):
    id: str
    school_id: str             # 所属高校
    created_at: datetime
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Campus Post (校内帖子)
# -----------------------------------------------------------------------------
class CampusPostBase(BaseModel):
    content: str
    topic_ids: Optional[str] = None # 关联话题 ID (JSON)
    pinned: bool = False            # 是否置顶
    visibility: str = "visible"     # 可见性

class CampusPostCreate(CampusPostBase):
    pass


class CampusPostAdminUpdate(BaseModel):
    pinned: Optional[bool] = None
    visibility: Optional[str] = None

class CampusPost(CampusPostBase):
    id: str
    school_id: str             # 所属高校
    author_id: str             # 发帖人
    created_at: datetime
    likes_count: int
    comments_count: int
    class Config:
        from_attributes = True


class CampusPostWithAuthor(CampusPost):
    author: Optional[PostAuthor] = None

# -----------------------------------------------------------------------------
# Campus Post Comment (校内帖子评论)
# -----------------------------------------------------------------------------
class CampusPostCommentBase(BaseModel):
    content: str


class CampusPostCommentCreate(CampusPostCommentBase):
    pass


class CampusPostComment(CampusPostCommentBase):
    id: str
    post_id: str
    school_id: str
    author_id: str
    created_at: datetime
    likes_count: int
    class Config:
        from_attributes = True


class CampusPostCommentWithAuthor(CampusPostComment):
    author: Optional[PostAuthor] = None

# -----------------------------------------------------------------------------
# QA Question (问答提问)
# -----------------------------------------------------------------------------
class QaQuestionBase(BaseModel):
    subject: str               # 学科/领域
    title: str                 # 标题
    content: str               # 详情
    tags: Optional[str] = None # 标签
    reward_points: int = 0     # 悬赏积分

class QaQuestionCreate(QaQuestionBase):
    pass

class QaQuestion(QaQuestionBase):
    id: str
    author_id: str
    views: int                 # 浏览量
    answers_count: int         # 回答数
    solved: bool               # 是否已解决
    accepted_answer_id: Optional[str] = None # 采纳的回答 ID
    hidden: Optional[bool] = None  # 管理员隐藏状态
    created_at: datetime
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# QA Answer (问答回答)
# -----------------------------------------------------------------------------
class QaAnswerBase(BaseModel):
    content: str               # 回答内容

class QaAnswerCreate(QaAnswerBase):
    pass

class QaAnswer(QaAnswerBase):
    id: str
    question_id: str           # 关联问题 ID
    author_id: str             # 回答者 ID
    likes_count: int           # 点赞数
    created_at: datetime
    class Config:
        from_attributes = True
