from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# =============================================================================
# 数据库会话管理 (Database Session Management)
# 功能：配置 SQLAlchemy 引擎，定义数据库会话工厂和依赖注入用的获取会话函数。
# =============================================================================

# 创建数据库引擎
# check_same_thread=False 仅针对 SQLite，允许在多线程中使用同一个连接
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# 创建会话工厂
# autocommit=False: 默认不自动提交事务，需手动 commit
# autoflush=False: 默认不自动刷新到数据库，需手动 flush
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 声明式基类，所有模型都应继承此类
Base = declarative_base()

def get_db():
    """
    获取数据库会话的依赖项生成器。
    用于 FastAPI 的 Depends(get_db)，确保每个请求使用独立的会话，并在请求结束后自动关闭。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
