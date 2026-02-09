"""
修复数据库中的密码哈希
将所有用户的密码重置为 123456
"""
import os
import sys
from sqlalchemy import create_engine, text

# PostgreSQL 连接字符串（从环境变量读取）
POSTGRES_URL = os.getenv("DATABASE_URL", "")

if not POSTGRES_URL:
    print("错误：请设置 DATABASE_URL 环境变量")
    print("示例: $env:DATABASE_URL=\"postgresql://user:pass@host:port/dbname\"")
    sys.exit(1)

print(f"正在连接到 PostgreSQL: {POSTGRES_URL[:50]}...")

# 创建引擎
engine = create_engine(POSTGRES_URL)

# 使用预先生成好的密码哈希（密码：123456）
# 这个哈希是在本地环境生成的，避免在魔搭环境生成时出现 bcrypt bug
new_password = "123456"
# 这是 bcrypt 加密 "123456" 的标准哈希值（在本地生成）
new_hash = "$2b$12$1W7MIROVecRmGgvTYpET/urTb5dAR9NqloJhzbnilSjaTHjaMocKi"

print(f"\n使用预设密码哈希（密码: {new_password}）")
print(f"哈希值: {new_hash}")
print(f"哈希长度: {len(new_hash)} 字节")

# 更新所有用户的密码
with engine.connect() as conn:
    # 开始事务
    trans = conn.begin()
    try:
        # 查询所有用户
        result = conn.execute(text("SELECT id, username FROM users"))
        users = result.fetchall()
        
        print(f"\n找到 {len(users)} 个用户账户")
        
        # 更新每个用户的密码
        for user_id, username in users:
            conn.execute(
                text("UPDATE users SET hashed_password = :hash WHERE id = :id"),
                {"hash": new_hash, "id": user_id}
            )
            print(f"  ✓ 已更新用户: {username}")
        
        # 提交事务
        trans.commit()
        
        print(f"\n✅ 成功！所有用户密码已重置为: {new_password}")
        print(f"现在可以使用任意用户名 + 密码 '{new_password}' 登录")
        
    except Exception as e:
        trans.rollback()
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
