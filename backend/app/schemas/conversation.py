from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ConversationPeer(BaseModel):
    id: str
    username: str
    full_name: Optional[str] = None


class ConversationListItem(BaseModel):
    id: str
    peer_user: Optional[ConversationPeer] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0


class ConversationCreate(BaseModel):
    peer_user_id: str


class MessageSender(BaseModel):
    id: str
    username: str
    full_name: Optional[str] = None


class MessageCreate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender: MessageSender
    content: str
    created_at: datetime
