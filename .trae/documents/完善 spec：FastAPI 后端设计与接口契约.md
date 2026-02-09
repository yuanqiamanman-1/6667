## 现状结论（基于代码与文档）
- 目前前端（Next.js 16 / React 19）几乎所有数据读写都走本地 `localStorage` 封装（[client-store.ts](file:///d:/Trae/333/cloud-edu-match-platform-design/lib/client-store.ts)），未发现真实网络 API 调用；要做 FastAPI 后端，需要把这些本地实体/流程映射为后端“实体+权限+接口”。
- spec.md 已把业务、角色与治理分层写得很全，但缺少：后端边界、API 契约、鉴权/多租户规则、错误/分页规范、数据库与审计、环境配置与测试策略。

## 要在 spec.md 新增/补强的章节（不改现有产品逻辑，只补“可研发落地”的后端部分）
### 1) 新增「后端总览：FastAPI 架构」
- 后端职责边界：认证/权限、组织域、多租户隔离、内容与审核、积分账本、导出审计。
- 技术栈建议（可在文档中写成可替换项）：FastAPI + Pydantic + SQLAlchemy + Alembic + PostgreSQL（或 MySQL）+ Redis（可选）。
- 与前端集成方式：Next 前端通过 `NEXT_PUBLIC_API_BASE_URL` 调用 FastAPI；dev/test/prod 三环境 baseURL 与 CORS 策略。

### 2) 新增「统一 API 规范」
- URL 版本：`/api/v1/...`
- 通用响应格式、错误码/错误体（含 trace_id）
- 分页/排序/过滤（offset/limit 或 cursor，统一一个）
- ID 与时间：UUID、ISO8601（UTC）
- 软删除与审计字段：created_at/updated_at/deleted_at + created_by 等

### 3) 新增「鉴权与授权（与前端角色体系一致）」
- 登录与会话：`POST /auth/login`、`POST /auth/logout`、`GET /auth/me`。
- Token 方案：默认 OAuth2 Password + JWT（FastAPI 官方教程），并预留后续 SSO/OIDC 接入位（高校统一认证）。
- 权限模型：Role（user.role）+ Organization-scoped admin role（org_id + role_code）+ 可选 scopes（更细粒度权限）。
  - 参考 FastAPI 安全官方文档：OAuth2+JWT 与 scopes（用于 OpenAPI 里可见权限）

### 4) 把前端 TS 数据模型映射为后端实体/表（保证“按前端框架写”）
- 直接以 [client-store.ts](file:///d:/Trae/333/cloud-edu-match-platform-design/lib/client-store.ts) 的 interface/type 为源，逐一在 spec 中定义：
  - User / Organization / Tag / Announcement / CommunityPost / CampusTopic & CampusPost / QA Question & Answer / VerificationRequest / AssociationTask / RuleSet / MallItem / PointTxn & RedemptionRecord / VolunteerHourGrant / SystemEvent / Report & ModerationCase 等。
- 每个实体写清：字段、索引、唯一约束、归属域（public / school_id / org_id / aid_school_id）。

### 5) 新增「接口清单（按页面/模块分组）」
- Auth & Users
- Organizations & School directory（支持“跨校审计进入高校板块”）
- Tags（标签字典）
- Announcements（含 scope/audience/同步公示栏规则）
- Public Community（发帖/列表/点赞/收藏）
- Campus Community（按 school_id 隔离：话题/帖子/治理）
- QA（提问/回答/采纳/悬赏结算）
- Verification（四类认证 + 审核接口）
- Association domain（讲师审核/专项任务/兑换规则/协会商城/时长发放与回滚）
- System events（超级管理员“日常/紧急”）
- 每个接口写：方法、路径、请求/响应字段（与 TS 模型对齐）、权限要求、典型错误。

### 6) 新增「关键事务与一致性规则」
- 积分账本：余额从流水聚合；“冻结→结算→回滚”事务边界。
- 采纳最佳答案的奖励入账（与现有前端逻辑对应）：在后端以事务写入 PointTxn。
- 志愿时长：发放/兑换/回滚必须可审计（rule_version、evidence、approved_by）。

### 7) 新增「环境与配置（dev/test/prod）」
- 以环境变量描述：DB_URL、REDIS_URL、JWT_SECRET、CORS_ALLOW_ORIGINS、S3/OSS（可选）等。
- 模拟数据：仅用于 test 环境；prod 禁止。

### 8) 新增「测试与质量门槛」
- 端到端：主要功能接口的集成测试（pytest + httpx），覆盖 RBAC、组织域隔离、积分事务、审核状态机。
- 安全测试：未授权/越权/重放/限频（至少写 spec 要求与验收标准）。

## 交付方式
- 仅修改 [spec.md](file:///d:/Trae/333/cloud-edu-match-platform-design/spec.md)：新增“后端设计与 API 契约”章节与附录（字段字典与接口字典），不改变现有产品章节结构，只补齐可研发落地细节。

## 验收标准（写进 spec）
- 任意一个前端页面（例如 /campus/community、/qa/ask、/verify、/hq/dashboard）都能在 spec 中找到：对应的后端实体、接口清单、权限条件与错误返回。
- 明确 dev/test/prod 的差异与禁止事项（尤其是 prod 禁止 mock）。

## 我将引用的官方依据（写入文档的“实现建议/参考”）
- FastAPI OAuth2 + JWT（密码流）与安全哈希建议：[FastAPI 安全文档](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- FastAPI OAuth2 scopes（用于更细粒度权限与 OpenAPI 集成）：[OAuth2 Scopes](https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/)

如果你确认该计划，我将开始直接编辑 spec.md，把上述章节逐段补齐到“可直接开工实现 FastAPI 后端”的详细程度。