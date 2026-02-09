# 部署指南：魔搭创空间 + Zeabur PostgreSQL

## 📋 部署架构

```
┌─────────────────────┐       ┌──────────────────────┐
│  魔搭创空间          │       │   Zeabur             │
│  (前端 + 后端)       │──────>│   PostgreSQL 数据库   │
│  - Next.js (3000)   │ HTTPS │   - 免费 500MB       │
│  - FastAPI (8000)   │       │   - 自动备份         │
│  - Nginx (7860)     │       │   - 持久化存储       │
└─────────────────────┘       └──────────────────────┘
```

---

## 🚀 步骤 1: 在 Zeabur 创建 PostgreSQL 数据库

### 1.1 注册并登录 Zeabur
1. 访问 https://zeabur.com
2. 使用 GitHub 账号登录（推荐）

### 1.2 创建项目和数据库
1. 点击 "Create Project" 创建新项目
2. 项目名称填写：`cloudedu-database`
3. 点击 "Add Service" → 选择 "Database" → 选择 "PostgreSQL"
4. 等待数据库部署完成（约 1-2 分钟）

### 1.3 获取数据库连接信息
1. 点击 PostgreSQL 服务卡片
2. 进入 "Variables" 标签页
3. 复制以下变量值：
   - `DATABASE_URL` 或
   - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`

**数据库连接字符串格式：**
```
postgresql://用户名:密码@主机地址:端口/数据库名
```

**示例：**
```
postgresql://postgres:yourpassword@postgres.zeabur.internal:5432/postgres
```

---

## 🚀 步骤 2: 部署到魔搭创空间

### 2.1 克隆魔搭项目空间
```bash
git lfs install
git clone http://oauth2:ms-5af238cf-ce28-455f-83cc-7a8221c112a5@www.modelscope.cn/studios/xsihan/hhhh.git
cd hhhh
```

### 2.2 复制项目文件
```powershell
# 在 PowerShell 中执行（Windows）
$source = "d:\Trae CN\前后端，未增加活人感"
$dest = ".\hhhh"

Copy-Item "$source\backend" -Destination "$dest\backend" -Recurse -Force
Copy-Item "$source\frontend" -Destination "$dest\frontend" -Recurse -Force
Copy-Item "$source\Dockerfile" -Destination "$dest\Dockerfile" -Force
Copy-Item "$source\nginx.conf" -Destination "$dest\nginx.conf" -Force
Copy-Item "$source\supervisord.conf" -Destination "$dest\supervisord.conf" -Force
Copy-Item "$source\.dockerignore" -Destination "$dest\.dockerignore" -Force
```

### 2.3 提交并推送
```bash
git add .
git commit -m "Deploy full-stack app with Zeabur PostgreSQL"
git push
```

### 2.4 配置环境变量（重要！）
登录魔搭创空间管理后台，添加以下环境变量：

```bash
# 数据库连接（从 Zeabur 复制）
DATABASE_URL=postgresql://postgres:你的密码@postgres.zeabur.internal:5432/postgres

# 安全密钥（生成一个随机字符串，至少32位）
SECRET_KEY=your-super-secret-key-change-this-to-random-string-at-least-32-chars

# 跨域配置（允许所有来源）
BACKEND_CORS_ORIGINS=*
```

**生成安全密钥的方法：**
```python
# 在 Python 中运行
import secrets
print(secrets.token_urlsafe(32))
```

---

## ✅ 步骤 3: 验证部署

### 3.1 检查服务状态
部署完成后（约 5-10 分钟），访问：

1. **主页**: `https://你的空间名.modelscope.cn/`
   - 应该看到前端页面
   
2. **API 文档**: `https://你的空间名.modelscope.cn/api/v1/docs`
   - 应该看到 FastAPI 自动生成的 API 文档
   
3. **健康检查**: `https://你的空间名.modelscope.cn/health`
   - 应该返回 "healthy"

### 3.2 测试数据库连接
1. 访问 API 文档页面
2. 找到 `POST /api/v1/auth/register` 接口
3. 尝试注册一个测试用户
4. 如果成功，说明数据库连接正常

### 3.3 验证数据持久化
1. 在 Zeabur 后台进入 PostgreSQL 服务
2. 点击 "Console" 标签
3. 运行 SQL 查询：
```sql
SELECT * FROM users LIMIT 5;
```
4. 应该能看到刚才注册的用户数据

---

## 🔧 故障排查

### 问题 1: 数据库连接失败
**症状**: 后端启动报错 "could not connect to database"

**解决方法**:
1. 检查 `DATABASE_URL` 环境变量是否正确设置
2. 确认 Zeabur 数据库服务正在运行
3. 检查数据库密码是否包含特殊字符（需要 URL 编码）

**特殊字符编码示例**:
```
@ → %40
# → %23
$ → %24
& → %26
```

### 问题 2: 前端无法访问后端 API
**症状**: 前端页面加载正常，但 API 请求失败

**解决方法**:
1. 检查 Nginx 配置是否正确
2. 查看 Supervisor 日志：进入容器后运行
```bash
tail -f /var/log/supervisor/backend.log
```

### 问题 3: 容器构建失败
**症状**: 推送代码后构建超时或失败

**解决方法**:
1. 检查 `frontend/package.json` 是否有 `build` 和 `start` 脚本
2. 确认 `backend/requirements.txt` 中的依赖都可以安装
3. 查看构建日志，定位具体错误

---

## 📊 成本说明

| 服务 | 提供商 | 免费额度 | 超出后价格 |
|------|--------|---------|-----------|
| 前端+后端 | 魔搭创空间 | 完全免费 | - |
| 数据库 | Zeabur | 500MB 免费 | $5/月 (1GB) |
| **总计** | - | **完全免费** | 可选升级 |

---

## 🎯 后续优化建议

### 优化 1: 配置文件存储 (OSS)
当前文件上传存储在容器内，重启会丢失。建议：
1. 注册阿里云 OSS
2. 修改后端代码集成 OSS SDK
3. 配置 OSS 访问密钥

### 优化 2: 数据库备份
Zeabur 免费版不包含自动备份，建议：
1. 定期导出数据库
2. 升级到付费版（包含自动备份）

### 优化 3: 性能监控
1. 在 Zeabur 后台查看数据库性能指标
2. 在魔搭后台查看容器资源使用情况

---

## 📞 获取帮助

- **Zeabur 文档**: https://zeabur.com/docs
- **魔搭创空间文档**: https://www.modelscope.cn/docs
- **FastAPI 文档**: https://fastapi.tiangolo.com
- **Next.js 文档**: https://nextjs.org/docs

---

**部署完成后，您的应用将拥有：**
✅ 永久的数据库存储（Zeabur PostgreSQL）  
✅ 前后端整合在一个服务中（方便管理）  
✅ 完全免费的运行环境（500MB 数据库足够初期使用）  
✅ 自动 HTTPS 和域名（魔搭提供）
