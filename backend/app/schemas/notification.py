from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    type: str
    payload: Any = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

