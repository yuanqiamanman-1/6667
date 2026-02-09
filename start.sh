#!/bin/bash
# 启动脚本：在启动应用前检查并修复数据库密码（仅首次或标记不存在时）

MARKER_FILE="/home/user/app/.password_fixed"

echo "================================"
echo "检查密码修复状态..."
echo "================================"

cd /home/user/app/backend

# 检查标记文件是否存在
if [ -f "$MARKER_FILE" ]; then
    echo "✓ 检测到密码修复标记，跳过修复步骤"
    echo "  （如需重新修复，请删除标记文件: $MARKER_FILE）"
else
    echo "! 未检测到密码修复标记，执行密码修复..."
    
    # 如果环境变量存在，执行密码修复
    if [ -n "$DATABASE_URL" ]; then
        echo "检测到数据库连接，开始修复..."
        if python fix_passwords.py; then
            echo "✅ 密码修复成功！"
            # 创建标记文件
            touch "$MARKER_FILE"
            echo "✓ 已创建标记文件，下次启动将跳过此步骤"
        else
            echo "❌ 密码修复失败，下次启动时将重试"
        fi
    else
        echo "⚠ 未检测到 DATABASE_URL 环境变量，跳过密码修复"
        # 即使没有数据库也创建标记，避免每次都检查
        touch "$MARKER_FILE"
    fi
fi

echo "================================"
echo "启动应用服务..."
echo "================================"

# 启动 Supervisor
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
