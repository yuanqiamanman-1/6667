## 现状与根因（对应你提的 1–5 点）
- **删除管理员/管理所有账户**：前端“管理员账号管理”页有删除按钮但仅弹窗“暂未开放”，后端也没有任何用户/管理员删除 API（仅有 GET/POST `/admin/org-admins`）。
- **审核/认证全链路未打通**：后端已有统一的 `VerificationRequest`（认证申请）与 `AdminOnboardingRequest`（入驻申请）两条队列；但前端仍有多个页面在读 localStorage 的 `client-store`（讲师审核 Tab、援助学校审核页、普通基础认证审核 Tab），导致你看到“前端展示有、实际数据不通”。
- **讲师申请约束不严格**：当前前端认证中心“志愿者讲师申请”可以自由选学校/协会（或兜底用学校名字符串），未强制绑定“已通过高校认证的同校协会”。
- **演示账号不一致**：后端 `initial_data.py` 种子里多个管理员账号缺少 `school_id`（运行时创建管理员会写入，但种子没写），并且 `school_id` 格式在 spec/模型注释/种子间不一致，容易导致过滤和权限校验错配。

## 第 1 部分：先完善 spec.md（把规则写成可执行约束）
- **账户体系**
  - 明确 `User.role`（用户身份）与 `admin_roles`（治理权限）分离：治理账号 `role=governance`，权限来自 `admin_roles`。
  - 增加“删除/停用”定义：默认删除为“停用 is_active=false + 移除 admin_roles”，必要时提供“彻底删除（硬删）”条件与风险说明。
- **管理员账户管理（分类+标识）**
  - 管理员分类：平台（superadmin）、总号（association_hq）、高校（university_admin）、高校协会（university_association_admin）、援助学校（aid_school_admin）。
  - 高校相关账号必须展示“管理高校标识”（组织 display_name + school_id/aid_school_id）。
- **审核/认证矩阵（强制）**
  - 对每个 `VerificationRequest.type` 写清：创建者、必填字段、可见/可审角色、校域/组织域过滤规则、审批后对用户画像与角色的回写规则。
  - 对 `AdminOnboardingRequest.org_type` 写清：创建入口、HQ 可见、审核通过后授予的 admin_role 与组织创建/复用规则。
- **讲师申请硬约束（你第 3 点）**
  - 只有“高校学生认证 approved 且绑定 school_id”的用户才能发起讲师申请。
  - 讲师申请 `target_school_id` 必须等于用户已认证的 `school_id`。
  - 讲师申请 `target_organization_id` 必须等于该 `school_id` 对应的 `university_association` 组织。
- **演示账号口径**
  - 固化一套演示账号清单与其 `school_id/aid_school_id`、管理组织映射、可走通的审核链路（用于 E2E）。

## 第 2 部分：后端实现（把 spec 规则落到 API 和校验）
- **账户管理 API（superadmin）**
  - `GET /api/v1/admin/users`：列出所有用户（含 is_active、role、school_id、organization_id、onboarding_status、admin_roles + 组织信息）。
  - `DELETE /api/v1/admin/users/{user_id}`：支持停用/删除；保护规则：不可删除自己、不可删除最后一个 superadmin。
  - `DELETE /api/v1/admin/org-admins/{user_id}`：语义化删除管理员账号（内部调用 users 删除/停用）。
  - 让 `GET /admin/org-admins` 返回时直接带上每个 role 对应组织的 `display_name/type/school_id/aid_school_id`，便于前端分类与“管理高校标识”。
- **认证队列严格化（VerificationRequest）**
  - `POST /association/verifications/requests` 增加服务端校验：
    - `volunteer_teacher`：必须先有学生认证 approved（来自 profile/或后端判定），且 `target_school_id==current_user.school_id`；`organization_id` 必须匹配该校的 `university_association` 组织。
    - `special_aid`：目标必须绑定到援助学校域（按 aid_school_admin 的 school_id/aid_school_id 规则）。
  - 统一 list/review 权限：`university_admin` 只能看/审本校 `university_student`；`university_association_admin` 只能看/审本校 `volunteer_teacher`；`aid_school_admin` 只能看/审本校 `special_aid`；`association_hq`/`superadmin` 跨域可看。
- **组织查询能力补齐**
  - 增加一个“按 school_id 找协会组织”的解析端点（或复用 `/core/orgs/board` 并提供精确查询），供前端讲师申请自动绑定。
- **演示种子修正**
  - 修正 `initial_data.py`：为 `pku_admin/pku_assoc_admin/zt1z_admin` 等补齐正确 `school_id`，确保权限过滤与审核链路可跑通。

## 第 3 部分：前端实现（全部从后端真实数据源渲染）
- **超级管理员控制台新增“账户管理”界面（你第 4 点）**
  - 在 `/admin` 增加“账户管理”Tab：按“管理员/普通用户/讲师/游客/已停用”分类筛选，支持删除（停用）与搜索。
- **管理员账号管理界面升级（你第 1 点）**
  - `AdminManagementTab`：按角色分类展示（Tabs 或 Filter），每条管理员卡片显示“管理组织名 + 管理高校标识（school_id/aid_school_id）”。
  - 删除按钮改为真实调用后端删除 API，并做二次确认（禁止删 superadmin/self）。
- **审核链路全打通（你第 2 点）**
  - 认证中心提交保持走后端 `VerificationRequest`。
  - `university/dashboard`：继续用后端队列展示与审批（已接），补齐 UI 字段映射一致性。
  - `association/dashboard` 的讲师审核 Tab：将 `VolunteerTeacherReviewTab` 从 `client-store` 改为调用后端 `GET /association/verifications/requests`（type=volunteer_teacher）并用 `POST /review` 审批。
  - `aid-school/dashboard`：将审核列表从 `client-store` 改为后端 `special_aid` 队列并可审批。
  - `basic-verification-review-tab`：改为读后端 `general_basic` 队列并可审批（operator=superadmin/HQ）。
- **讲师申请同校约束（你第 3 点）**
  - 认证中心“志愿者讲师认证”表单：当用户已通过高校学生认证时，学校下拉锁定为其 `school_id`，并自动绑定该校 `university_association` 组织；禁止跨校选择。

## 第 4 部分：Playwright 自动化验证（你第 5 点）
- 引入 `@playwright/test`（前端 devDependency）与 `playwright.config.ts`，添加 `npm run test:e2e`。
- 编写 E2E 用例覆盖：
  - 学生提交北大高校学生认证 → 北大高校管理员看到并审批 → 学生状态更新。
  - 已通过高校认证的学生提交讲师申请（只能同校协会）→ 北大协会管理员看到并审批。
  - 组织入驻申请（注册 org_admin_applicant）→ 总号账号看到并审批。
  - 专项援助认证申请 → 援助学校管理员看到并审批。
  - 超级管理员在账户管理中删除（停用）某账号 → 该账号无法再登录。

## 第 5 部分：回归与交付
- 对齐 spec.md 的“演示账号清单”，确保每个流程都有明确的账号组合与可复现路径。
- 跑一遍 Playwright + 关键 API 冒烟（列表/审批/删除），并在 PR 级别输出验证结果与截图/日志。

我将按上述顺序：先更新 spec.md，再实现后端 API + 前端接入，最后补 Playwright E2E 用例并跑通。