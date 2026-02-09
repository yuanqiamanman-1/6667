from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import TokenPayload

# =============================================================================
# API 依赖项 (API Dependencies)
# 功能：定义可重用的依赖注入函数，如获取当前登录用户、权限检查等。
# =============================================================================

# OAuth2 密码模式 Bearer Token
# tokenUrl 指定前端获取 token 的接口地址
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    """
    依赖项：验证 Token 并获取当前用户。
    如果 Token 无效或过期，抛出 403 错误。
    如果用户不存在，抛出 404 错误。
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    依赖项：获取当前激活的用户。
    如果用户已被禁用，抛出 400 错误。
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    依赖项：获取当前超级管理员用户。
    如果用户不是超级管理员，抛出 400 错误。
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user

def get_optional_current_user(
    db: Session = Depends(get_db), token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token", auto_error=False))
) -> Optional[User]:
    """
    依赖项：可选的获取当前用户。
    如果没有 Token 或 Token 无效，返回 None，不抛出错误。
    """
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        return None
    user = db.query(User).filter(User.id == token_data.sub).first()
    return user
