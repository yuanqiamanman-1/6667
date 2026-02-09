## 目标与范围
- 通过完善 [spec.md](file:///d:/Trae/333/cloud-edu-match-platform-design/spec.md) 明确“演示环境必须落库、实时更新、账号隔离”的验收口径，并据此修改前后端实现与 Playwright 用例。
- 覆盖你列出的 7 个问题：搜索下拉滚动、消息私聊独立性、社区发帖作者区分、援助学生“停用=撤销认证”、高校板块回收与用户认证解除、讲师管理实时更新、匹配全局化。

## 现状核查（关键证据）
- **消息/私聊目前是纯假数据**：
  - 会话列表硬编码： [messages/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/messages/page.tsx)
  - 聊天详情硬编码+自动回复模拟： [chat/[id]/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/chat/%5Bid%5D/page.tsx)
- **公共社区发帖作者被硬编码为“我”**（导致所有账号看起来同一人）：[community/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/community/page.tsx)
- **搜索下拉（Combobox）滚动问题的根因在组件层**：Combobox 使用 Popover(Portal) + CommandList(滚动样式) 组合，在 Dialog 内易出现滚轮事件被锁滚/拦截：
  - [combobox.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/components/ui/combobox.tsx)
  - [command.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/components/ui/command.tsx)
- spec 已有“消息/会话 API”与“匹配 API”章节，但与当前实现口径不一致，且 spec 里仍允许社区发帖本地存储（不满足你强调的“演示必须真实数据”）。

## 规范（spec.md）修改计划
- **新增/修订“演示环境不得使用 mock/localStorage 作为真实数据源”**：
  - 将社区/高校社区/消息/聊天从“原型可本地”升级为“演示必须落库+走 API”。
- **补齐并统一“消息（私聊）”的强约束**：
  - 会话/消息必须有后端数据模型与权限校验：只有会话参与者可读写。
  - 去除任何“张老师/自动回复/示例会话”等假数据渲染。
- **补齐“社区发帖作者来源”**：
  - author 必须来自当前登录账号（/auth/me），严禁写死“我”。
- **明确“援助学校端学生管理：停用=撤销援助认证”**：
  - 账号不删除、不停用登录；仅撤销 `special_aid` 认证并回退角色/学校域绑定。
- **强化“高校板块回收 + 自动解除认证”**：
  - 当某 school_id 的 university_admin 全部被硬删除：删除 university 组织与校内内容；同时对 `users.school_id == school_id` 的用户执行“自动解除高校学生/讲师认证”，但账号保留。
- **讲师池与匹配规则统一**：
  - “讲师管理”只控制本校讲师 `in_pool`；
  - “匹配候选”面向全站所有高校讲师池（in_pool=true）按标签相似度排序（可配置同校加权，但非硬限制）。
- **补充“实时更新/一致性”要求**：
  - 列表页必须以 API 为真相源；删除/撤销认证/下架讲师后，跨页面检索与统计需可在短时间内刷新（例如轮询或事件触发）。

## 后端实现计划（按 spec 落地）
- **A. 消息/会话（新增表，不改旧表，避免 SQLite 无迁移导致的列不一致）**
  - 新增模型：Conversation、ConversationParticipant（或双人会话字段）、Message。
  - 新增端点：
    - GET /conversations（只返回参与者自己的会话）
    - POST /conversations（按对方 user_id “创建或复用”会话）
    - GET /conversations/{id}/messages（参与者校验）
    - POST /conversations/{id}/messages（参与者校验）
  - 权限：严格 participant check；禁止通过 URL id 越权读写。
- **B. 公共社区与高校社区（替换本地存储）**
  - 新增公共帖子表与端点：GET/POST /community/posts（带 author_id、created_at、分页）。
  - 新增高校社区帖子表与端点：GET/POST /campus/{school_id}/posts（按 school_id 隔离 + 权限：仅本校高校身份/管理员可发可看）。
- **C. 援助学生撤销认证（替换“停用账号”语义）**
  - 将援助学校端操作改为：撤销 aid 认证（profile.verification.aid=none/revoked）、回退 role 为 general_student、清空 school_id（或按 spec 约定字段），账号仍可登录。
  - 对应新增/调整端点：POST /aid/students/{id}/revoke（或 PATCH）。
- **D. 高校板块回收与自动解除认证**
  - 在“硬删除管理员”流程中：当某 school_id 最后一个 university_admin 被删除时：
    - 删除该 school_id 的 Organization(type=university) 与校内内容；
    - 批量更新 users：school_id=该值的用户全部解除 student/teacher 认证并回退角色；
    - 清理 teacher_pool_entries 中该 school_id 的条目。
- **E. 讲师池实时正确性**
  - /association/teachers 列表：只返回 user 存在且 is_active=true 的讲师；发现孤儿 teacher_pool_entries 时可顺带清理。
  - teacher count 统计同源于该接口（避免前端缓存导致不一致）。
- **F. 匹配“全站讲师池”**
  - 匹配候选查询改为：全表 teacher_pool_entries where in_pool=true 且用户有效 且 teacher 认证 verified。
  - 排序：标签交集/时间重叠/可扩展质量分；同校可作为加权而非过滤。

## 前端实现计划
- **1) 修复搜索下拉滚动（Combobox）**
  - 将候选列表包裹 ScrollArea 或显式设置可滚动容器，并在 Dialog 场景下阻止滚轮事件冒泡到 body（避免锁滚吞掉滚动）。
  - 增加可视化回归：在认证中心高校/援助学校下拉中，鼠标滚轮可滚动候选列表。
- **2) 消息/聊天去假数据并接 API**
  - /messages：改为拉取 conversations；去掉 NOTIFICATIONS/CONVERSATIONS 常量。
  - /chat/[id]：id 改为 conversation_id；拉取消息并发送；移除“自动回复/张老师固定资料”。
  - “发起会话”按钮：先 POST /conversations（按对方 user_id），再跳转 conversation_id。
- **3) 社区发帖作者与账号隔离**
  - /community：发帖 author 使用当前 user（name/id/avatar），不再写死“我”；列表来自后端。
  - /campus/community：同样改为后端帖子源；作者来自 user。
- **4) 援助学校学生管理改语义**
  - “停用”按钮改为“撤销援助认证”，操作后该学生不再出现在援助学生列表，但账号仍可登录。
- **5) 高校板块/讲师池实时更新体验**
  - 高校目录页/认证中心组织下拉：在关键操作后触发刷新或短轮询，保证“删除后不可见”。
  - 协会讲师管理页：定时刷新或在操作后 revalidate，确保删除/下架立刻更新列表与统计。

## Playwright 测试计划（严格对齐 spec）
- 新增/更新用例覆盖：
  - Combobox 下拉滚动可用（Dialog 内滚动不被吞）。
  - 私聊：A 与 B 建会话并互发消息；C 不能访问该会话（401/403）。
  - 社区：A 发帖、B 发帖，信息流作者正确区分；切换账号不出现“同一我”。
  - 援助学生：撤销认证后账号仍可登录、但不再具备 aid 身份。
  - 高校回收：删除最后一个高校管理员后，高校目录/认证中心下拉不再出现该校；原该校学生/讲师自动解除认证但账号保留。
  - 协会讲师管理：讲师被硬删除后，列表与匹配池数量实时减少且不显示“空壳讲师”。
  - 匹配全局：创建多个高校讲师，任意用户发起匹配可看到跨校讲师候选（按标签排序）。
- 所有用例统一在结束时通过 superadmin API 硬删除测试账号，保证数据库无残留。

## 交付物
- spec.md 完整修订（覆盖 1-7 的明确验收条款与接口口径）
- 后端新增：conversations/messages、community/campus posts、aid revoke、university recycle/auto-unverify、global matching
- 前端改造：消息/聊天/社区从假数据切换为 API，Combobox 滚动修复
- Playwright：新增/更新测试用例并全量跑通

如果确认该计划，我将先从“spec.md 口径统一 + 消息/社区去假数据”开始落地，因为它们直接决定 2/3/7 的数据逻辑一致性。