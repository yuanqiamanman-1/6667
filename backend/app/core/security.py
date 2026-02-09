from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import bcrypt
from app.core.config import settings

# =============================================================================
# 安全工具 (Security Utilities)
# 功能：提供密码哈希、密码验证和 JWT Token 生成等核心安全功能。
# 注意：直接使用 bcrypt 库而不是 passlib，避免魔搭环境的版本兼容问题
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证明文密码是否与哈希密码匹配。
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    生成密码的哈希值。
    使用 bcrypt 直接生成，避免 passlib 的版本问题。
    """
    # 生成 salt 并哈希密码
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    生成 JWT 访问令牌 (Access Token)。
    
    :param subject: 令牌的主题 (通常是用户 ID)
    :param expires_delta: 过期时间增量
    :return: 编码后的 JWT 字符串
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    # JWT 载荷：包含过期时间和主题
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
