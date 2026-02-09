from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func
from app.db.session import Base


class FileAsset(Base):
    __tablename__ = "file_assets"

    id = Column(String, primary_key=True, index=True)
    uploader_id = Column(String, index=True)
    original_name = Column(String)
    storage_path = Column(String)
    mime_type = Column(String, nullable=True)
    size = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

