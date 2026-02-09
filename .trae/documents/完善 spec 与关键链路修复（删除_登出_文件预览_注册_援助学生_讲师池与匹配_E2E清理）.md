## 目标对齐
- 以 [spec.md](file:///d:/Trae/333/cloud-edu-match-platform-design/spec.md) 为唯一口径，补齐“删除=彻底消失、审核可打开材料/用户信息、注册不再提供讲师身份选择、援助学生管理、讲师池真实化与匹配可用、E2E 后清理测试账号”等需求，并落实到代码。

## 1. 修订 spec.md（先写清规则再改代码）
- 在 D6/账户管理条款补充：
  - 删除为“硬删除”（或至少对 UI/业务等价为硬删除）：账号删除后不再出现在任何列表（含“已停用”视图），且不可登录。
  - 删除必须二次确认：删除按钮仅打开确认弹窗；只有显式点击“确定删除”才执行。
- 新增“高校板块回收规则”：当某校 university_admin 管理员全部删除后，删除/关闭该校 university 组织（高校板块入口/目录不再展示）。
- 新增“组织入驻待审页退出登录规则”：待审/被拒页点击退出必须清 token 并跳转到 /login。
- 新增“审核材料可打开”条款：认证/入驻材料必须可被审核方在线查看或下载（材料存储、URL、权限约束）。
- 注册规范更新：个人注册不再提供“我是志愿讲师”选项；讲师必须通过认证中心提交材料后由本校协会审核。

## 2. 超管删除交互与列表规则调整（对应问题 1）
- 前端：
  - [admin-management-tab.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/components/admin/admin-management-tab.tsx) 删除按钮改为 AlertDialog 二次确认，避免“点外面也删”。
  - [account-management-tab.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/components/admin/account-management-tab.tsx) 移除“已停用”Tab；保留搜索与分类（全部/治理账号/普通用户）。
  - 删除后本地列表直接移除（不展示“已停用”徽标）。
- 后端：
  - [admin.py](file:///d:/Trae/333/cloud-edu-match-platform-design/backend/app/api/v1/endpoints/admin.py) 默认删除切换为 hard delete（或新增单独 hard delete 路由并让前端只调用 hard）。
  - `GET /admin/users` 默认不返回已删除账号（删除后彻底消失）。

## 3. “高校管理员删光则高校板块删除”（对应问题 2）
- 后端在删除 university_admin 时增加回收逻辑：
  - 找出其治理域 school_id（通过 admin_role.organization_id -> Organization.school_id）。
  - 若该 school_id 下已无任何 university_admin 管理员：删除/关闭 `Organization(type='university', school_id=...)` 并同步清理该 school_id 相关的高校板块数据（至少：目录不再返回；必要时级联删除 campus 资源/公告等）。
  - 保证不影响该校 university_association 组织（若仍存在则只删除“高校板块”，协会板块按需保留）。

## 4. 待审页无法退出登录（对应问题 3）
- 前端：
  - [onboarding/pending](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/onboarding/pending/page.tsx) 与 [onboarding/rejected](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/onboarding/rejected/page.tsx) 点击退出后：`logout()` + `router.replace('/login')`。
  - 复核 [user-context.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/lib/user-context.tsx) 的重定向逻辑，确保 token 清除后不会再次把用户推回待审页。

## 5. 审核材料/用户信息打不开（对应问题 4）
- 后端新增“材料文件”能力：
  - 上传接口：`POST /files/upload`（保存到服务器 uploads 目录，返回可访问 URL/文件 id）。
  - 下载/预览接口：`GET /files/{id}`（权限：申请人本人 + 该申请可审角色 + superadmin/hq）。
- 前端：
  - 认证中心上传改为“先上传拿到 URL/id，再提交 evidence_refs”。
  - 各审核页（高校学生/讲师/援助/基础/入驻）把材料渲染成可点击链接（新窗口打开或内嵌预览）。
  - 新增“查看用户信息”弹窗：审核页用 applicant_id 调用 `GET /admin/users/{id}`（或专用只读接口）展示 email/学校/身份/历史认证状态等。

## 6. 个人注册不再选择讲师（对应问题 5）
- 前端：
  - [register/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/register/page.tsx) 去掉“我是志愿讲师”选项，仅保留说明：要高校学生认证/讲师认证请去认证中心提交材料。
- 后端：
  - [auth.py compute_capabilities](file:///d:/Trae/333/cloud-edu-match-platform-design/backend/app/api/v1/endpoints/auth.py) 修正：`volunteer_teacher` 不能因为 role 就默认 `can_access_campus=true`；必须以认证状态为准（与 spec D3 对齐）。

## 7. 援助学校端增加“援助学生管理”（对应问题 6）
- 后端：新增 `GET /aid/students`（仅 aid_school_admin 访问，返回本校 special_aid_student 列表），以及必要的管理动作（停用/解禁/备注）。
- 前端：在 [aid-school/dashboard](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/app/aid-school/dashboard/page.tsx) 增加 Tab：学生管理（搜索、查看资料、停用）。

## 8. 协会讲师池真实化 + 匹配完善（对应问题 7/8）
- 后端：
  - 建立“讲师池”数据源：以用户表中已通过讲师认证者为准（或新增 teacher_profile 表承载 in_pool、tags、timeSlots 等）。
  - 在讲师认证通过时，把 tags/timeSlots 固化到可查询的字段（避免只存在 evidence_refs 文本里）。
  - 新增协会端接口：`GET /association/teachers?school_id=...`、`POST /association/teachers/{id}/pool`。
  - 完善匹配：在现有 [match.py](file:///d:/Trae/333/cloud-edu-match-platform-design/backend/app/api/v1/endpoints/match.py) 基础上增加“候选生成/筛选”能力（按标签/时间槽/学校域与 in_pool）。
- 前端：
  - [volunteer-teacher-management-tab.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/frontend/components/association/volunteer-teacher-management-tab.tsx) 从 client-store 改为后端数据；仅显示真实老师。
  - 协会控制台统计（讲师数/待审核数）改为后端接口统计。

## 9. Playwright 回归 + 测试账号自动清理（对应问题 9）
- 为 E2E 增加统一清理逻辑：每个测试创建的 `e2e_*` 账号在 `afterEach/afterAll` 使用 superadmin 调用 hard delete API 清除。
- 扩充用例覆盖：
  - 删除必须二次确认（取消不应删除）
  - 删除后列表不可见、不可登录
  - 待审页退出登录后应回到登录页
  - 审核页可打开材料与用户信息

确认后，我会按上述顺序：先更新 spec.md，再逐项落地前后端实现与 E2E，并在本地跑完 Playwright 作为验收。