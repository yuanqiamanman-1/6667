from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from starlette.middleware.cors import CORSMiddleware
from app.core.config import settings
import os

# =============================================================================
# 后端入口文件 (Main Entry Point)
# 功能：初始化 FastAPI 应用，配置跨域资源共享 (CORS)，挂载路由，启动数据库表创建。
# =============================================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# -----------------------------------------------------------------------------
# CORS 配置 (Cross-Origin Resource Sharing)
# 允许前端 (如 localhost:3000) 访问后端 API
# -----------------------------------------------------------------------------
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/", response_class=HTMLResponse)
def root():
    """
    根路由：返回后端服务的 HTML 落地页。
    功能：展示服务状态和 API 文档入口。
    """
    # 读取 templates 目录下的 index.html 文件
    file_path = os.path.join(os.path.dirname(__file__), "templates", "index.html")
    with open(file_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)

# -----------------------------------------------------------------------------
# 路由与数据库初始化
# -----------------------------------------------------------------------------
from app.api.v1.api import api_router
from app.db.session import engine, Base
from app.db.auto_migrate import ensure_schema
# 导入所有模型以确保它们被 SQLAlchemy 注册
from app.models import user, core, content, association, match, files, teacher_pool, conversation, notification

# 自动创建数据库表 (仅用于开发环境，生产环境建议使用 Alembic 迁移)
Base.metadata.create_all(bind=engine)
ensure_schema(engine)

# 挂载 V1 版本 API 路由
app.include_router(api_router, prefix=settings.API_V1_STR)
