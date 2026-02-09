"""测试登录功能"""
import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

POSTGRES_URL = os.getenv("DATABASE_URL", "")
engine = create_engine(POSTGRES_URL)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 查询 student_pku 用户
with engine.connect() as conn:
    result = conn.execute(text("SELECT username, hashed_password FROM users WHERE username='student_pku'")).fetchone()
    
    if result:
        username, hashed_password = result
        print(f"用户名: {username}")
        print(f"哈希值: {hashed_password}")
        print(f"哈希长度: {len(hashed_password)} bytes")
        
        # 测试密码验证
        test_password = "123456"
        try:
            is_valid = pwd_context.verify(test_password, hashed_password)
            print(f"\n密码 '{test_password}' 验证结果: {'✅ 成功' if is_valid else '❌ 失败'}")
        except Exception as e:
            print(f"\n❌ 验证出错: {e}")
    else:
        print("用户不存在")
