# HQ 控制台 - 隐藏/恢复功能测试指南

## 功能说明
HQ 控制台的问答管理和社区管理功能已实现完整的隐藏/恢复切换,包括:
- ✅ Badge 状态始终显示("可见" 或 "已隐藏")
- ✅ 按钮文本根据状态切换("隐藏" ↔ "恢复")
- ✅ 点击后通过确认对话框执行操作
- ✅ 样式与高校账户完全一致

## 手动测试步骤

### 1. 启动服务
```bash
# 终端 1 - 启动后端
cd d:\Trae\333\cloud-edu-match-platform-design\backend
uvicorn app.main:app --reload

# 终端 2 - 启动前端
cd d:\Trae\333\cloud-edu-match-platform-design\frontend
npm run dev
```

### 2. 登录 HQ 控制台
1. 访问 http://localhost:3000/login
2. 使用 superadmin 账户登录:
   - 用户名: `superadmin`
   - 密码: `admin123`
3. 导航到 http://localhost:3000/hq/dashboard

### 3. 测试问答管理
1. 点击 **"问答管理"** Tab
2. 找到任意一个问题,观察:
   - ✅ **Badge 显示**: 应该看到"可见"或"已隐藏"Badge(始终显示)
   - ✅ **按钮文本**: 
     - 如果 Badge 是"可见",按钮应显示"隐藏"
     - 如果 Badge 是"已隐藏",按钮应显示"恢复"
3. 点击按钮:
   - ✅ 弹出确认对话框
   - ✅ 对话框标题和按钮文本与操作一致
4. 确认操作后:
   - ✅ Badge 状态切换("可见" ↔ "已隐藏")
   - ✅ 按钮文本切换("隐藏" ↔ "恢复")
5. 再次点击按钮,验证可以反复切换

### 4. 测试社区管理
1. 点击 **"社区管理"** Tab
2. 找到任意一个帖子,进行相同的测试
3. 验证功能与问答管理一致

### 5. 验证样式一致性
1. 对比高校账户的"帖子治理"Tab (http://localhost:3000/university/dashboard)
2. 确认:
   - ✅ Badge 样式一致
     - "可见": `variant="secondary"` (浅蓝色背景)
     - "已隐藏": `variant="outline"` (透明背景,边框)
   - ✅ 按钮样式一致
   - ✅ 布局和间距一致

## 预期结果

### Badge 状态显示
- **可见状态**: 显示浅蓝色 Badge "可见"
- **已隐藏状态**: 显示边框 Badge "已隐藏"

### 按钮文本
- **可见时**: 按钮显示"隐藏"
- **已隐藏时**: 按钮显示"恢复"

### 切换流程
```
初始状态: 可见 + "隐藏"按钮
  ↓ 点击"隐藏"
确认对话框: "确认隐藏问题"
  ↓ 确认
新状态: 已隐藏 + "恢复"按钮
  ↓ 点击"恢复"
确认对话框: "确认恢复问题"
  ↓ 确认
恢复状态: 可见 + "隐藏"按钮
```

## 代码实现位置

### 问答管理
文件: `frontend/components/admin/qa-moderation-tab.tsx`
- Badge 显示: 第 171-173 行
- 按钮文本: 第 199 行
- 切换逻辑: 第 191-197 行

### 社区管理
文件: `frontend/components/admin/community-moderation-tab.tsx`
- Badge 显示: 第 184-186 行
- 按钮文本: 第 207 行
- 切换逻辑: 第 199-205 行

## 故障排查

### 如果"隐藏"按钮点击无效
1. 打开浏览器控制台(F12)
2. 检查 Network 标签,查看 API 请求
3. 确认后端 API 返回成功
4. 检查前端状态是否更新

### 如果 Badge 不显示
1. 检查代码第 171-173 行(问答)或 184-186 行(社区)
2. 确认使用三元运算符始终渲染 Badge
3. 检查 `question.hidden` 或 `post.hidden` 字段是否正确

### 如果样式不一致
1. 对比高校账户实现: `frontend/app/university/dashboard/page.tsx` 第 895-896 行
2. 确认 Badge variant:
   - 可见: `variant="secondary"`
   - 已隐藏: `variant="outline"`

## 自动化测试

测试文件: `frontend/e2e/hq-moderation-toggle.spec.ts`

运行测试(需要先启动服务):
```bash
cd d:\Trae\333\cloud-edu-match-platform-design\frontend
npx playwright test hq-moderation-toggle --headed --project=chromium
```

## 结论

功能已完全实现,包括:
- ✅ Badge 状态始终显示
- ✅ 按钮文本动态切换
- ✅ 点击切换功能正常
- ✅ 样式与高校账户一致
- ✅ 支持反复切换

如有问题,请按照上述步骤进行手动测试验证。
