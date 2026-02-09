## 目标与范围
- 以 [spec.md](file:///d:/Trae/333/cloud-edu-match-platform-design/spec.md) v1.1 为准，把当前缺失的关键界面补齐，并保持现有克莱因蓝+浅青配色、卡片化布局与动效风格一致。
- 本轮以“前端可用的完整交互原型”为交付：使用现有 mock 数据与 localStorage 持久化，先跑通页面与流程；后端/真实鉴权接口后续可替换。

## 现状盘点（将补齐的缺口）
- 品牌文案仍有“云支教”：例如 [layout.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/app/layout.tsx#L7-L30) 与 [navbar.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/components/navigation/navbar.tsx#L54-L63) 站名/alt。
- 个人中心存在入口但路由缺失：/profile/points、/profile/achievements（见 [profile/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/app/profile/page.tsx#L36-L45)）。
- 问答缺少“提问页”，以及“提问者采纳最佳答案并发放悬赏积分”的交互闭环。
- 社区缺少“公示栏”界面。
- 超级管理员“标签字典管理”界面缺失。
- 学校/协会虽有 dashboard，但“协会公告/专项任务/校内兑换机制”等界面未落地。

## 设计原则（保证统一风格）
- 复用现有 UI 组件（Button/Card/Badge/Tabs/Dialog/Table 等）与页面结构（顶部 Navbar + container + 卡片网格）。
- 页面信息层级保持：标题区 → 关键动作（主按钮）→ Tabs/筛选 → 内容列表/空状态。
- 所有新页面提供空状态与引导按钮（去发布/去兑换/去提问）。

## 具体改造与新增页面
### 1) 全站品牌统一为“云助学”
- 更新站点 Metadata：title/description/keywords/authors（[layout.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/app/layout.tsx#L7-L30)）。
- 更新导航 Logo 的文本与图片 alt（[navbar.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/components/navigation/navbar.tsx#L54-L63)）。
- 扫描全站文案中“云支教/支教”等残留并替换为“云助学/助学”（不改色调与布局）。

### 2) 积分中心 + 积分商城（补齐缺失界面）
- 新增路由：
  - `app/profile/points/page.tsx`：积分总览、积分明细（流水列表）、快捷入口“去积分商城”。
  - `app/profile/points/mall/page.tsx`：积分商城（商品卡片列表、兑换弹窗、兑换记录）。
- 数据策略：
  - 积分余额来自 user.points；兑换/流水记录用 localStorage（按 userId 分区）。
  - 商品采用统一基准档位（证书/徽章/公益周边/学习用品等），并支持“协会自定义兑换比例/上架项”的展示位（先做 UI 与配置面板，规则落到 localStorage）。

### 3) 成就系统（补齐缺失界面）
- 新增路由：`app/profile/achievements/page.tsx`：
  - 徽章墙（已解锁/未解锁）、里程碑进度（等级、累计帮助、被采纳数等）。
  - 与现有 Profile 页的 BADGES 展示保持一致风格（[profile/page.tsx](file:///d:/Trae/333/cloud-edu-match-platform-design/app/profile/page.tsx#L47-L51)）。

### 4) 问答：提问页 + 最佳答案采纳闭环
- 新增路由：`app/qa/ask/page.tsx`：标题、描述、标签选择（从“标签字典”读取）、悬赏积分、有效期；提交后写入 localStorage 并回到问答列表。
- 改造 `app/qa/[id]/page.tsx`：
  - 若当前用户是提问者，给每条回答增加“设为最佳答案”按钮。
  - 采纳后：更新答案 isAccepted，写入积分流水与余额变更（localStorage），并在详情页明显展示“已采纳”。

### 5) 社区广场：公示栏
- 改造 `app/community/page.tsx`：新增 Tabs：动态 / 公示栏。
- 公示栏内容结构：平台公告、规则变更、学校/协会公开公告摘要（支持置顶/时间/发布方标识）。
- 数据：先用 mock + localStorage（由协会/学校后台发布后在此同步展示）。

### 6) 超级管理员：标签字典管理
- 新增路由：`app/admin/tags/page.tsx`（仅 superadmin 入口可见）：
  - 标签列表（分类/状态/使用次数 mock）、搜索、增删改（Dialog 表单）。
  - 标签数据写入 localStorage，并作为：问答提问标签选择、社区热门话题来源。

### 7) 学校/协会：公告与专项任务（按 spec 的“协会专区”）
- 在 `app/association/dashboard/page.tsx` 增加两个板块入口：公告管理、专项任务管理。
- 新增路由：
  - `app/association/announcements/page.tsx`：发布/编辑公告（校内可见/公开可见）、置顶、有效期。
  - `app/association/tasks/page.tsx`：专项任务（紧急对接/专项计划）发布、报名列表（mock）、可直接授予志愿时长的记录入口（先做 UI 与审计列表）。
- 同步展示：发布后自动出现在社区“公示栏”（公开公告）与“校内协会专区”（校内公告）。

### 8) 认证页（界面与文案对齐 spec）
- 改造 `app/verify/page.tsx`（若存在）：
  - 志愿讲师认证展示为两步：学校平台认证 + 本校志愿者协会认证（不出现“超级管理员审核通过”作为常规步骤）。
  - 学生认证分层展示：大学生走学校平台；中小学走学校批量认证（界面提示/入口占位）。

## 验证方式
- 路由可达性：从 Navbar / Profile 菜单进入新页面不 404。
- 关键闭环：
  - /qa/ask 创建问题 → /qa 列表可见 → /qa/[id] 采纳最佳答案 → 积分流水与余额变化在 /profile/points 可见。
  - 协会发布公告 → 社区公示栏可见。
  - 超管新增标签 → /qa/ask 标签选择器可立即使用。
- 视觉一致性：卡片、按钮、标题区、空状态与现有页面保持同一套组件与色调。

## 交付物（你确认后我会直接落地）
- 新增/改造的页面路由与 UI 组件、mock 数据与 localStorage 持久化。
- 全站“云助学”品牌文案统一替换。
- 对照 spec 的界面缺口全部补齐（积分商城、成就、问答提问/采纳、公示栏、标签管理、协会公告/专项任务）。