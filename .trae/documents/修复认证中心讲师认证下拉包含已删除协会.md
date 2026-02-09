## 需求解读（对应你列的 3 点）

1. 援助学校端“撤销认证”必须二次确认：点击只弹确认框，未点“确定”不得产生任何状态改变。
2. 任意认证被撤销/失效后：

* 认证中心状态必须从“已通过”实时回退为“未通过/未认证”。

* 用户收到站内通知（消息通知），包含原因与影响（例如高校板块回收导致高校认证/讲师认证解除）。

1. 匹配必须做成真实闭环：

* 结果页展示讲师卡片（高校名/标签/时间槽等）。

* 学生点击“求助”后讲师收到通知；讲师在首页看到“待响应求助”。

* 讲师接受/拒绝后，双方都收到通知；接受后自动建立私聊会话并可继续聊天。

## 改动范围（按 spec 强化“真实数据”）

### A. spec.md 更新

* 增加/补齐：

  * “撤销认证”必须二次确认（同 D6.1 口径，扩展到援助撤销/认证撤销）。

  * “认证状态实时刷新”规则：以 `/auth/me` 的 `profile.verification` 为权威；发生撤销/回收事件后，前端必须刷新 user-context 并刷新认证中心展示。

  * “通知体系”规则：认证通过/驳回/撤销、匹配求助请求/接受/拒绝、高校板块回收等必须生成通知。

  * “匹配闭环”规则：从候选→求助→讲师响应→会话建立的状态机与权限口径。

### B. 援助撤销确认（前端）

* 将援助学校学生管理的“撤销认证”从浏览器 confirm 升级为 AlertDialog（二次确认按钮），保证“未点确定绝不调用接口”。

* 调整 UI 更新时机：仅在后端撤销成功后再从列表移除。

### C. 认证状态实时更新 + 通知

* 后端：新增 Notification 表与 API

  * 表字段：id、user\_id、type、payload(json)、read\_at、created\_at。

  * 接口：

    * `GET /notifications?unread_only=`

    * `POST /notifications/{id}/read`

  * 在以下事件落通知：

    * 认证审核通过/驳回（association verifications review）

    * 援助撤销（aid revoke）

    * 高校板块回收/孤儿高校 purge（university board recycle/purge）

    * 匹配求助请求/接受/拒绝（见下一节）

* 前端：

  * user-context 增加 `refreshUser()`（重新拉 `/auth/me` 并更新 capabilities/verification）。

  * 认证中心 `/verify`：

    * 提交认证/撤销发生后触发 refreshUser。

    * 轮询或基于通知触发 refreshUser（检测到“认证变化通知”时）。

  * Navbar/消息页增加“通知”入口与未读数（轮询通知接口）。

### D. 匹配功能闭环（后端 + 前端）

* 后端：为匹配引入“求助请求/响应”状态机（避免仅展示候选）

  * 新增 MatchOffer（或等价表）字段：id、request\_id、student\_id、teacher\_id、status(pending/accepted/declined)、created\_at、updated\_at。

  * 新接口：

    * `POST /match/requests/{id}/offers`（学生对某讲师发起求助）

    * `GET /match/offers/inbox`（讲师查看待响应求助）

    * `POST /match/offers/{offer_id}/accept`（讲师接受：绑定 MatchRequest.teacher\_id，创建/获取会话，写入系统消息）

    * `POST /match/offers/{offer_id}/decline`（讲师拒绝）

    * 放宽 `GET /match/requests/{id}` 权限：被绑定/被 offer 关联的讲师可读。

  * 候选信息补全：在 candidates 中返回 `school_display_name`（从 Organization 解析），确保前端可展示“高校名字”。

  * 所有状态变更落通知：

    * 学生发起 offer → 通知讲师

    * 讲师 accept/decline → 通知学生（accept 时额外包含 conversation\_id）

* 前端：

  * 匹配结果页：卡片化展示讲师信息（高校名/标签/时间槽/推荐理由），新增“求助”按钮；点击后创建 offer 并显示“已发送/待响应”。

  * 讲师首页：新增“待响应求助”板块，列出 pending offers；提供“接受/拒绝”按钮。

  * 接受后：

    * 讲师侧跳转到会话

    * 学生侧收到通知，在消息列表可见会话并可进入聊天

### E. Playwright 端到端测试（并确保测试账号清理）

* 新增/更新 e2e：

  * 援助撤销：点击撤销先弹确认，取消不生效；确认后用户认证中心 aid 状态回退。

  * 通知：撤销/审核/匹配 accept/decline 都能在通知列表中出现且未读数变化。

  * 匹配闭环：学生发起求助→讲师收件箱出现→讲师接受→会话建立→双方消息可见。

* 测试结束统一硬删除测试账号（沿用现有 e2e 工具函数）。

## 实施顺序（确保每步可验证）

1. 先更新 spec.md（把验收口径写清并对齐实现）。
2. 先做撤销确认与 refreshUser（改动小、立刻可验）。
3. 再落通知表与通知轮询 UI。
4. 最后做匹配 offer 状态机与讲师响应闭环，并补齐展示字段。
5. 跑全量 Playwright，确保测试通过且账号清理无残留。

