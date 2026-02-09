"""
SQLite 到 PostgreSQL 数据迁移脚本
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# SQLite 数据库路径
SQLITE_DB = "sql_app.db"

# PostgreSQL 连接字符串（从环境变量读取）
POSTGRES_URL = os.getenv("DATABASE_URL", "")

if not POSTGRES_URL:
    print("错误：请设置 DATABASE_URL 环境变量")
    print("示例: set DATABASE_URL=postgresql://user:pass@host:port/dbname")
    sys.exit(1)

print(f"正在连接到 SQLite: {SQLITE_DB}")
print(f"正在连接到 PostgreSQL: {POSTGRES_URL[:50]}...")

# 创建引擎
sqlite_engine = create_engine(f"sqlite:///{SQLITE_DB}")
postgres_engine = create_engine(POSTGRES_URL)

# 创建会话
SqliteSession = sessionmaker(bind=sqlite_engine)
PostgresSession = sessionmaker(bind=postgres_engine)

def get_table_names(engine):
    """获取所有表名"""
    with engine.connect() as conn:
        if 'sqlite' in str(engine.url):
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))
        else:
            result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
        return [row[0] for row in result]

def copy_table_data(table_name, sqlite_session, postgres_session):
    """复制单个表的数据"""
    print(f"\n正在迁移表: {table_name}")
    
    # 从 SQLite 读取数据
    sqlite_conn = sqlite_session.connection()
    result = sqlite_conn.execute(text(f"SELECT * FROM {table_name}"))
    rows = result.fetchall()
    columns = result.keys()
    
    if not rows:
        print(f"  表 {table_name} 为空，跳过")
        return 0
    
    print(f"  找到 {len(rows)} 行数据")
    
    # 构建插入语句
    columns_str = ", ".join(columns)
    placeholders = ", ".join([f":{col}" for col in columns])
    insert_sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
    
    # 插入到 PostgreSQL
    postgres_conn = postgres_session.connection()
    inserted = 0
    failed = 0
    
    for row in rows:
        try:
            row_dict = dict(zip(columns, row))
            # 转换 SQLite 的整数布尔值为 PostgreSQL 布尔值
            for key, value in row_dict.items():
                # 检查列名包含布尔字段的常见命名
                if any(bool_field in key.lower() for bool_field in ['is_', 'has_', 'enabled', 'certified', 'active', 'hidden', 'pinned', 'solved', 'deleted', 'verified']):
                    if isinstance(value, int):
                        row_dict[key] = bool(value)
            postgres_conn.execute(text(insert_sql), row_dict)
            inserted += 1
        except Exception as e:
            failed += 1
            if failed <= 3:  # 只显示前3个错误
                print(f"  警告: 插入失败 - {str(e)[:100]}")
    
    postgres_session.commit()
    print(f"  成功插入 {inserted} 行，失败 {failed} 行")
    return inserted

def main():
    """主迁移流程"""
    print("\n" + "="*60)
    print("SQLite → PostgreSQL 数据迁移工具")
    print("="*60)
    
    try:
        # 获取表列表
        sqlite_tables = get_table_names(sqlite_engine)
        postgres_tables = get_table_names(postgres_engine)
        
        print(f"\nSQLite 中的表: {sqlite_tables}")
        print(f"PostgreSQL 中的表: {postgres_tables}")
        
        if not postgres_tables:
            print("\n错误: PostgreSQL 数据库中没有表！")
            print("请先运行应用以创建表结构，然后再执行迁移。")
            sys.exit(1)
        
        # 创建会话
        sqlite_session = SqliteSession()
        postgres_session = PostgresSession()
        
        total_rows = 0
        migrated_tables = 0
        
        # 按依赖顺序迁移表
        table_order = [
            'organizations',
            'tags', 
            'users',
            'user_organizations',
            'activities',
            'activity_collaborations',
            'posts',
            'comments',
            'match_requests',
            'conversations',
            'notifications',
            'files',
        ]
        
        # 迁移有序的表
        for table in table_order:
            if table in sqlite_tables and table in postgres_tables:
                try:
                    rows = copy_table_data(table, sqlite_session, postgres_session)
                    total_rows += rows
                    migrated_tables += 1
                except Exception as e:
                    print(f"  错误: {table} 迁移失败 - {str(e)[:200]}")
        
        # 迁移其他未列出的表
        for table in sqlite_tables:
            if table not in table_order and table in postgres_tables:
                try:
                    rows = copy_table_data(table, sqlite_session, postgres_session)
                    total_rows += rows
                    migrated_tables += 1
                except Exception as e:
                    print(f"  错误: {table} 迁移失败 - {str(e)[:200]}")
        
        sqlite_session.close()
        postgres_session.close()
        
        print("\n" + "="*60)
        print(f"迁移完成！")
        print(f"  迁移了 {migrated_tables} 个表")
        print(f"  总计 {total_rows} 行数据")
        print("="*60)
        
    except Exception as e:
        print(f"\n迁移失败: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
