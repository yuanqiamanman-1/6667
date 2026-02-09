## 现状问题归因（对照 spec）
- **角色语义混用**：当前后端把“管理层角色 + 用户层角色”都塞进 `User.role`（见 [user.py](file:///d:/Trae/333/cloud-edu-match-platform-design/backend/app/models/user.py)），缺少 spec 要求的 `AdminRole(user_id + organization_id + role_code)` 组织域授权模型（见 spec 9/15.6）。因此无法稳定表达“同一账号可叠加身份”“治理权限不可越域”“审计只读”等规则。
- **组织域与高校板块判定不完整**：高校目录/跨校审计应按 spec 5.2/7.0 的“组织域开通状态”生成（university 或 university_association 任一成立即可视为高校板块开通），但当前数据种子与前端聚合逻辑并未实现“按 school_id 聚合、显示协会账号状态”等要求。
- **组织账号注册/审核链路缺失**：前端 `/register` 目前是模拟注册，不会写入后端数据库，也没有“组织账号入驻申请→HQ审核→通过后升级为管理员”的状态机与拦截页（见 [register/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/register/page.tsx)）。
- **管理员创建不持久化**：超级管理员控制台的“创建管理员”仅更新 React state，刷新丢失（见 [admin-management-tab.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/components/admin/admin-management-tab.tsx)）。

## 目标（你提出的 4 点逐条落地）
1. **演示账号群成为“真实可行的关系网络”**：账号/组织/认证/权限都来自数据库与 API，而不是仅 UI 假数据。
2. **组织账号注册可选，且必须经 HQ 审核**：未通过前登录会被强制留在“审核中”页；通过后成为对应组织域管理员（非学生、无积分/匹配能力，但可访问问答/社区/知识库等公共模块）。
3. **前后端对接一致**：超级管理员/协会总号的“高校目录跨校审计”只来自真实组织域；协会总号不被当作高校。
4. **管理员管理可持续**：superadmin 可创建高校/协会管理员；用户自助申请通过后也出现在 superadmin 的管理员列表。

## 方案总览
### A. 先修订 spec.md（把逻辑写清楚，作为实现验收标准）
在 [spec.md](file:///d:/Trae/333/cloud-edu-match-platform-design/spec.md) 增补/修订以下章节：
- **新增「演示数据集（Demo Dataset）与验收脚本」**：列出 demo 账号清单（用户名、角色、绑定 school_id/organization_id、初始状态、可见模块），并给出 10~15 条可复现验收路径。
- **补齐「组织账号注册/入驻申请」状态机**：
  - account_type：user / org_admin_applicant
  - onboarding_status：pending/approved/rejected
  - gating：pending/rejected 只能访问审核页与公共浏览，禁止进入管理端与需要组织域权限的模块。
- **明确「高校目录跨校审计」生成规则**：按 school_id 聚合组织域：
  - board_enabled = (存在 university org) OR (存在 university_association org)
  - 卡片必须显示：高校名称、university org 状态、association org 状态、快速入口（community/association）。
- **明确「管理员不等于学生」能力边界**：管理员无积分钱包/匹配/服务单能力；但仍可浏览公共内容；组织域写操作需 AdminRole 校验。

### B. 后端数据模型重构（让关系在 DB 中成立）
新增/调整实体（按 spec 9 与 15.6 对齐）：
- `User`：拆分为 `user_role`（用户层：guest/general_student/university_student/volunteer_teacher/special_aid_student/governance）+ 基础资料；不要再用单字段混载管理角色。
- `Organization`：保留，但补齐用于“按 school_id 聚合”的字段约束与索引（type=university/university_association/aid_school）。
- **新增** `AdminRole`：`user_id + organization_id + role_code`（university_admin / university_association_admin / aid_school_admin / association_hq / superadmin）。
- **新增** `AdminOnboardingRequest`：组织账号申请记录（school_name、org_type、contact、材料、status、reviewed_by/at、rejected_reason）。通过后创建对应 `Organization`（如需要）+ `AdminRole`。
- **新增/完善** `Verification` / `VerificationRequest`：替代前端 localStorage 的认证状态源，保证“高校学生认证/讲师认证/专项援助认证/普通基础认证”可被后端审核并回写用户身份。
- **积分**：保留 `PointTxn` 做账本；管理员默认不初始化积分流水（即余额为 0 且前端不展示钱包入口）。

### C. 后端 API 契约与权限（让前端拿到正确的“能力快照”）
- `POST /api/v1/auth/signup`：支持 `account_type`（普通用户 / 组织账号申请）。
- `GET /api/v1/auth/me`：返回 `user_role`、`admin_roles[]`、`onboarding_status`、`effective_school_ids[]`（用于跨校审计/默认学校）、以及用于前端显隐的 `capabilities`（如 can_points/can_match/can_manage_association）。
- `GET /api/v1/orgs/board`（新增）：按 school_id 聚合输出高校目录卡片所需字段（university 状态 + association 状态）。
- `POST /api/v1/admin/org-admins`（新增，仅 superadmin）：创建高校/协会/援助学校管理员账号（落库）。
- `GET /api/v1/admin/org-admins`（新增，仅 superadmin）：管理员账号列表（包含“自助申请已通过的”）。
- `GET/POST /api/v1/hq/onboarding-requests`：协会总号审核高校协会入驻申请。

### D. 演示数据重构（真正的 demo 账号群）
重写/增强 [initial_data.py](file:///d:/Trae/333/cloud-edu-match-platform-design/backend/app/initial_data.py)（或改为可重复执行的 seed）：
- 创建组织：北京大学/清华大学 university + 对应 university_association；创建 1 个 aid_school。
- 创建账号并绑定：
  - superadmin（跨校审计）、association_hq（跨校审计+协会治理）
  - pku_university_admin、pku_association_admin
  - 若干 university_student（school_id=PKU/THU）
  - 若干 volunteer_teacher（先为 university_student，再由 association_admin 审核通过后授予供给侧身份/可见协会板块/进入匹配池）
- 种子里同时生成：必要的 tags、公告、以及少量可演示的校内帖子/协会公告（按 audience 过滤规则）。

### E. 前端重构（按后端真实状态渲染与拦截）
- **高校目录跨校审计**：`/campus` 改为调用 `GET /orgs/board` 渲染卡片，卡片 `key` 使用 `school_id`；协会总号不会被当成高校。
- **组织账号注册与审核中拦截**：
  - `/register` 改为真实调用后端 signup；增加“普通用户 / 高校账号 / 高校协会账号”选择。
  - 新增 `/onboarding` 审核中页面；`UserProvider` 初始化时若 `onboarding_status=pending/rejected`，强制路由到该页。
- **管理员管理持久化**：`AdminManagementTab` 改为调用后端 `GET/POST /admin/org-admins`，刷新不丢失，并能看到“自助申请通过的组织账号”。
- **模块显隐统一**：导航与页面守卫统一基于 `capabilities` 与 `admin_roles`（而不是现在混用 localStorage 与 profile）。

### F. 验证与回归（按 spec 验收脚本跑通）
- 增加后端 pytest：越权 403、跨校只读、onboarding pending 拦截、管理员创建持久化、orgs/board 聚合正确。
- 前端走查：
  - superadmin 登录→高校目录能看到 PKU/THU→可进入社区/协会（审计只读）。
  - association_hq 登录→同样能跨校审计，但不被计为高校。
  - pku_association_admin 登录→仅能管理 PKU 协会域。
  - 组织账号申请→pending→审核通过→升级为管理员并解锁管理端。

## 交付物
- 修订后的 [spec.md](file:///d:/Trae/333/cloud-edu-match-platform-design/spec.md)（补齐 Demo 数据集/审核状态机/高校目录聚合规则/管理员能力边界）。
- 后端：新增 AdminRole/Onboarding/Verification 等实体与接口；seed 数据。
- 前端：注册/审核中拦截/高校目录跨校审计/管理员管理持久化 全部接真实 API。

如果你确认该方案，我将按以上顺序：先提交 spec.md 的结构化修订，再落地后端模型与 API，最后把前端关键链路全部对齐并跑通上述验收脚本。