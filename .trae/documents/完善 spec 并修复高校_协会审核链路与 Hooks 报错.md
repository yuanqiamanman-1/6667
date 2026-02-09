## 目标与现状定位
- Hooks 报错根因：`AssociationDashboard` 在部分 hooks 后提前 `return null`，导致同一组件不同渲染周期 hooks 数量/顺序变化（见 [association/dashboard/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/association/dashboard/page.tsx#L23-L67)）。
- “学生认证申请北大校级账号看不到”根因：学生端写入后端 `verification_requests`，但高校管理员端仍从 localStorage 读 mock 数据，且 `target_school_id` 可能是“北京大学”而管理员 `schoolId` 可能是“PKU/uni_xxx”等，过滤必然错配（见 [university/dashboard/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/university/dashboard/page.tsx#L137-L141)）。
- “出现多个同名高校板块/南京大学重复”根因：Organization 创建路径无唯一性约束与复用规则，产生同名不同 `school_id` 的多条 `university` 组织，board 按 `school_id` 聚合但前端按 `display_name` 展示，所以同名重复（聚合逻辑见 [core.py](file:///d:/Trae/333/cloud-edu-match-platform-design/backend/app/api/v1/endpoints/core.py#L50-L111)，创建入口在 [admin.py](file:///d:/Trae/333/cloud-edu-match-platform-design/backend/app/api/v1/endpoints/admin.py)）。

## 第 1 部分：先完善 spec.md（把“应该怎样”写清楚）
- **统一标识**：定义 `school_id` 为“高校唯一规范ID”（如 PKU/THU/NJU 或统一格式 `UNI_xxx`），`display_name` 为展示名（如 北京大学）。
- **唯一性规则**：
  - 高校组织必须满足 `UNIQUE(type, school_id)`；并建议高校类型增加 `UNIQUE(type, display_name)`（默认高校名唯一）。
  - 明确“同一高校只能有一个 university + 一个 university_association 组织；新增管理员只能绑定既有组织，不得创建同名新板块”。
- **认证链路（数据口径）**：
  - 学生提交高校认证时，`target_school_id` 必须是规范 `school_id`（不得用中文名字符串），来源必须是组织目录选择（无则走“补录/申请入驻”）。
  - 高校管理员审核列表必须来自后端 `verification_requests`，且仅能看到本校 `target_school_id == school_id` 的申请。
- **前端 Hooks 规范（工程约束写进 spec）**：
  - 所有 hooks 必须在组件顶层无条件调用；鉴权/加载态的早返回必须放在所有 hooks 之后，或拆分为“外层鉴权组件 + 内层纯 UI 组件”。

## 第 2 部分：修复协会控制台打不开（Hooks 顺序问题）
- 调整 [association/dashboard/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/association/dashboard/page.tsx#L45-L67) 的结构：
  - 将所有 `useMemo` 上移到早返回之前，并对 `user?.school` 为空时返回安全默认值；或拆分为 `AssociationDashboardGate`（鉴权/跳转）+ `AssociationDashboardView`（内部不早返回）。
- 验收：进入“北京大学志愿者协会控制台”不再出现 hooks 报错，页面可渲染。

## 第 3 部分：打通“学生认证申请 → 北大高校管理员可见”
- 后端：确认/补齐“管理员按校过滤”的查询接口与权限（现已有 association 下 verifications 列表/审核端点，需确保 `school_id` 过滤语义与权限一致）。
- 前端学生端：在 [verify/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/verify/page.tsx) 中，提交高校学生认证时强制使用 `schoolId`（来自组织列表/Combobox 的 value），不再回退到 `schoolName/user.school`。
- 前端高校管理员端：在 [university/dashboard/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/university/dashboard/page.tsx) 将 `getVerificationRequests()` 替换为调用后端 `GET /association/verifications/requests?type=university_student&status=pending&school_id=<schoolId>`，并用返回结果渲染审核队列。
- 验收：用户 444 提交北大认证后，北大高校管理员“学生认证”tab 显示待审申请数量+列表。

## 第 4 部分：修复“同名高校板块重复/南京大学重复创建”
- 后端组织创建统一为“get-or-create”：
  - 入驻审核通过、超管创建组织、超管创建管理员三条路径均优先按 `(type, school_id)` 复用；其次按 `(type, display_name)` 兜底；不存在才创建。
- 数据修复（迁移脚本）：
  - 扫描 `type='university'` 下 `display_name` 重复项，选 canonical，并把引用表（users/verification_requests/campus_posts 等）中的 `school_id` 迁移到 canonical，再删除冗余 organizations。
  - 之后再加数据库唯一索引（至少 `UNIQUE(type, school_id)`）。
- 验收：`/core/orgs/board` 返回中不出现同名重复高校；新增南京大学管理员会绑定到既有南京大学板块（同一 `school_id`）。

## 第 5 部分：回归验证与演示脚本
- 用演示账号跑通：
  - `pku_assoc_admin` 打开协会控制台无 hooks 报错。
  - 学生账号提交北大认证 → `pku_admin` 可见并可审核。
  - 校园看板不再出现多个“南京大学”。
- 补最小自动化校验（可选）：对“创建认证请求后管理员列表可见”“组织创建不重复”写轻量测试或脚本。

如果你确认该计划，我将按上述顺序：先修改 [spec.md](file:///d:/Trae/333/cloud-edu-match-platform-design/spec.md)，再逐项落地代码修复与数据去重，并在本地跑通上述验收路径。