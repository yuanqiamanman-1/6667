from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.sql import func
from app.db.session import Base


class TeacherPoolEntry(Base):
    __tablename__ = "teacher_pool_entries"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    school_id = Column(String, index=True)
    tags = Column(String, default="[]")
    time_slots = Column(String, default="[]")
    in_pool = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

