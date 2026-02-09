from typing import Optional
from pydantic import BaseModel


class FileAsset(BaseModel):
    id: str
    name: str
    url: str
    mime: Optional[str] = None
    size: int = 0
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

