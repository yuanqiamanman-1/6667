from fastapi import APIRouter
from app.api.v1.endpoints import auth, core, content, association, match, admin, files, aid, conversations, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(core.router, prefix="/core", tags=["core"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(association.router, prefix="/association", tags=["association"])
api_router.include_router(match.router, prefix="/match", tags=["match"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(aid.router, prefix="/aid", tags=["aid"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
