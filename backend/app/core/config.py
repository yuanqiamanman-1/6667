import os
from pydantic_settings import BaseSettings

# =============================================================================
# 全局配置 (Configuration)
# 功能：管理应用的所有环境变量配置，包括安全密钥、数据库连接、CORS 等。
# 使用 pydantic_settings 自动从 .env 文件读取。
# =============================================================================

class Settings(BaseSettings):
    # 项目基础信息
    PROJECT_NAME: str = "CloudEduMatch Backend"
    API_V1_STR: str = "/api/v1"
    
    # -------------------------------------------------------------------------
    # 安全配置 (Security)
    # -------------------------------------------------------------------------
    # JWT 签名密钥（生产环境必须修改且保密）
    # 从环境变量读取，如果没有则使用默认值（仅开发环境）
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_MUST_BE_LONG")
    # 加密算法
    ALGORITHM: str = "HS256"
    # Token 过期时间（默认 7 天）
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    # -------------------------------------------------------------------------
    # 数据库配置 (Database)
    # -------------------------------------------------------------------------
    # 数据库连接字符串，默认使用 SQLite，生产环境应配置为 PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # -------------------------------------------------------------------------
    # 跨域配置 (CORS)
    # -------------------------------------------------------------------------
    # 允许访问后端的来源列表（魔搭创空间需要允许所有来源）
    @property
    def BACKEND_CORS_ORIGINS(self) -> list[str]:
        origins_str = os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:3000,http://localhost:8000"
        )
        if origins_str == "*":
            return ["*"]
        return [origin.strip() for origin in origins_str.split(",") if origin.strip()]

    class Config:
        env_file = ".env"  # 尝试读取 .env 文件

settings = Settings()
