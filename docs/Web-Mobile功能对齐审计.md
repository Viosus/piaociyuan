# Web / Mobile 功能对齐审计

> 创建：2026-04-28
> 关联计划：`C:\Users\Hanwen Li\.claude\plans\16-web-mobile-parity.md`
> 关联前置：`docs/登录与限流系统.md`（登录改造已在 Web 端落地，Mobile 通过共享 API 自动受益）

## 一、为什么有这份文档

`piaoyuzhou` 是 monorepo（Web + Mobile + shared），但两端开发节奏严重不同步：

- 最近 30 个 commit 里：**Web 单边修改 13 个（43%）**，Mobile 单边 4 个（13%），双向同步 6 个（20%）
- Web 改速 ≈ Mobile 的 **3.25 倍**
- `packages/shared` 几乎是空的（只有 3 个 enum + ApiResponse），两端类型靠各自手写——这就是最大的债务源

后果已经在显形：
- Mobile services 11 个文件把 ID 字段标成 `number`，但后端 schema 是 `String @default(uuid())`——TS 编译能过但运行时随时会因 `parseInt(uuid)` 之类操作炸
- 检票 API（`/api/tickets/use`）Web 加了 Mobile 没接，Mobile 端工作人员扫码后只能 verify、不能真正核销
- Mobile logout 不调 server，refresh token 永远不 revoke——账号被盗后改密码也不能让对方下线

本文档既是**审计报告**也是**修复进度跟踪**。

## 二、规模与漂移证据

### 2.1 规模

| 项目 | Web | Mobile |
|------|-----|--------|
| 页面/屏幕 | 33 | 43 |
| API endpoint / API 调用 | 117 | ~60（覆盖率 ~51%） |
| Services / lib 文件 | 60+ | 20 |

### 2.2 `packages/shared` 现状

`packages/shared/src/types/index.ts` 内容：
- `ApiResponse<T>`、`PaginatedResponse<T>`
- 4 个 enum：`UserRole`、`TicketStatus`、`OrderStatus`、`NotificationType`

**没有任何业务实体类型（User / Event / Ticket / Order / Message…）**。这是漂移的根源：Mobile 各 service 文件手写 `interface User { id: number; ... }`，写错了也没人发现，因为没有"权威的 User 类型"可以对照。

### 2.3 关键漂移 commit

| Commit | 说明 | 影响 |
|--------|------|------|
| `beb55fb` | Mobile端重构+Web上线准备 | 18 Mobile + 4 Web，**双向同步** |
| `9d426ae` | 修复登录无限刷新 | Web 专有（11 文件），Mobile 未跟进 |
| `451008d` | WebSocket+实时评论+排序 | Web 专有（5 文件），Mobile 没订阅 `comment:new` 事件 |
| `429b4ea` | NFT→收藏品系统 | 双向同步，但 Mobile 残留代码（`b55a78a` 才清理） |

## 三、Parity Matrix（按业务模块）

> 状态符号：✅ 对齐｜⚠️ 部分对齐｜❌ 缺失｜🔴 P0 bug｜🟡 P1 缺功能｜⚪ P2 仅记录

### 3.1 认证（Auth）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 登录 | `/auth/login` + POST `/api/auth/login` | LoginScreen + login() | ✅ |
| 注册 | `/auth/register` + POST `/api/auth/register` | RegisterScreen + register() | ✅ |
| 发送验证码 | POST `/api/auth/send-code` | sendVerificationCode() | ✅ |
| 刷新 token | POST `/api/auth/refresh` | refreshToken() | ✅ |
| 登出（server 撤销 refresh token） | POST `/api/auth/logout` | **❌ 只清前端 token，不调 server** | 🔴 P0-3 |
| 获取当前用户（启动刷新资料） | GET `/api/auth/me` | **❌ 不调用** | 🔴 P0-4 |
| 修改密码 | `/account/settings` + POST `/api/user/change-password` | ChangePasswordScreen ✅ | ✅ |
| 账号级登录退避 | ✅（已落地） | ✅ 自动受益 | ✅ |

**覆盖率：6/8 = 75%**

### 3.2 用户中心（User / Account）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 个人信息编辑 | `/account` + POST `/api/user/update` | EditProfileScreen + ❌ 调用未确认 | 🟡 P1-2 |
| 用户公开主页 | `/u/[id]` + GET `/api/user/[id]` | UserProfileScreen + ❌ 调用未确认 | ⚪ |
| 关注/粉丝列表 | GET `/api/user/[id]/followers` 等 | FollowingListScreen / FollowerListScreen ⚠️ | ⚪ |
| 关注/取关 | POST/DELETE `/api/users/[id]/follow` | follows.ts | ✅ |
| 我的收藏 | `/favorites` + GET `/api/user/favorites` | FavoritesScreen + getFavorites() | ✅ |
| 地址管理 | ❌ Web 没界面 | AddressesScreen + AddAddressScreen | Mobile 独有 |
| 证件管理 | ❌ Web 没界面 | IdDocumentsScreen + AddIdDocumentScreen | Mobile 独有 |
| 身份认证 | `/account/verification` | VerificationScreen | ✅ |
| 删除账户 | ❌ Web 没明确入口 | SettingsScreen + deleteAccount() | Mobile 独有 |

**覆盖率：5/9（双向都有的）；Mobile 比 Web 多 3 个独有界面**

### 3.3 活动 / 票务列表（Events）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 活动列表 | `/events` + GET `/api/events` | EventsScreen + getEvents() | ✅ |
| 活动详情 | `/events/[id]` + GET `/api/events/[id]` | EventDetailScreen + getEventById() | ✅ |
| 活动搜索 | GET `/api/events/search` | **❌ 未调用** | ⚪ |
| 关注/取关活动 | GET/POST/DELETE `/api/events/[id]/follow` | **❌ 未调用** | ⚪ |
| 售票状态自动更新 | GET `/api/events/update-status` (cron) | n/a | n/a |

### 3.4 票务详情 / 票夹（Tickets）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 我的票券 | `/account` (?) + GET `/api/tickets/my-tickets` | TicketsScreen + getMyTickets() | ✅ |
| 票券详情 | n/a | TicketDetailScreen + getTicketById() | Mobile 独有 |
| **检票核销** | POST `/api/tickets/use` | **❌ 完全没调用** | 🔴 P0-2 |
| 验证票券 | POST `/api/tickets/verify` | ScanTicketScreen + verifyTicket() | ✅ |
| 退票 | POST `/api/tickets/[id]/refund` | refundTicket() | ✅ |
| 转让票券 | POST `/api/tickets/transfer` | TransferTicketScreen | ✅ |
| 接收转让 | POST `/api/tickets/transfer/accept` | ReceiveTransferScreen | ✅ |
| 智能持票 | POST `/api/tickets/hold-smart` | n/a (Web 自动化) | n/a |

**覆盖率：6/7 (检票漏掉)**

### 3.5 订单（Orders）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 订单列表 | `/account/orders` + GET `/api/orders` | OrdersScreen + getOrders() | ✅ |
| 订单详情 | `/order/[id]` + GET `/api/orders/[id]` | OrderDetailScreen | ✅ |
| 创建订单 | POST `/api/orders` | createOrder() | ✅ |
| 取消订单（待支付） | POST `/api/orders/[id]/cancel` | **❌ 未调用** | 🟡 P1-1 |
| 退款 | POST `/api/orders/[id]/refund` | refundOrder() | ✅ |
| Checkout 流程 | `/checkout` | CheckoutScreen | ✅ |

**覆盖率：5/6**

### 3.6 支付（Pay）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 微信支付 | POST `/api/pay/wechat` | wechatPay() | ✅ |
| 支付宝 | POST `/api/pay/alipay` | alipayPay() | ✅ |
| 模拟支付 | POST `/api/pay/mock` | mockPay() | ✅ |
| 退款 | POST `/api/pay/refund` | refundPayment() | ✅ |
| 微信回调 | POST `/api/pay/wechat/notify` | n/a (server) | n/a |
| 支付宝回调 | POST `/api/pay/alipay/notify` | n/a (server) | n/a |

**覆盖率：4/4**

### 3.7 收藏品（Collectibles）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 收藏品列表 | GET `/api/collectibles` | **❌ 未调用** | ⚪ |
| 收藏品详情 | `/account/collectibles/[id]` + GET `/api/collectibles/[id]` | CollectibleDetailScreen | ✅ |
| 我的收藏品 | `/account/collectibles` + GET `/api/collectibles/my` | MyCollectiblesScreen | ✅ |
| 领取收藏品 | POST `/api/collectibles/claim` | claimCollectible() | ✅ |

**覆盖率：3/4（公开列表 Mobile 没有，可能由首页 sections 替代）**

### 3.8 社区 / 帖子（Posts）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 帖子列表 | `/encore` + GET `/api/posts` | EncoreScreen + getPosts() | ✅ |
| 帖子详情 | `/encore/[id]` + GET `/api/posts/[id]` | PostDetailScreen | ✅ |
| 发布帖子 | POST `/api/posts` | CreatePostScreen | ✅ |
| 编辑帖子 | PATCH `/api/posts/[id]` | updatePost() | ✅ |
| 删除帖子 | DELETE `/api/posts/[id]` | deletePost() | ✅ |
| 点赞 | POST/DELETE `/api/posts/[id]/like` | likePost() / unlikePost() | ✅ |
| 收藏 | POST/DELETE `/api/posts/[id]/favorite` | favoritePost() | ✅ |
| 举报帖子 | POST `/api/posts/[id]/report` | **❌ 未调用** | ⚪ |
| 评论 CRUD | GET/POST `/api/posts/[id]/comments` | commentsService | ✅ |
| 评论点赞 | POST/DELETE `/api/posts/[id]/comments/[cid]/like` | likeComment() | ✅ |
| **实时评论 socket 事件** | server emit `comment:new` | **❌ 未订阅** | 🟡 P1-3 |

**覆盖率：10/11**

### 3.9 消息 / IM（Messages）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 对话列表 | `/messages` + GET `/api/messages/conversations` | ConversationsScreen | ✅ |
| 对话详情 | `/messages/[id]` + GET `/api/messages/conversations/[id]` | ChatScreen | ✅ |
| 发消息 | POST `/api/messages/conversations/[id]/messages` | sendMessage() | ✅ |
| 标记已读 | PUT `/api/messages/conversations/[id]/read` | markRead() | ✅ |
| 未读数 | GET `/api/messages/unread-count` | getUnreadCount() | ✅ |
| 创建群组 | POST `/api/messages/groups` | CreateGroupScreen | ✅ |
| 群详情 | GET `/api/messages/groups/[id]` | GroupDetailScreen | ✅ |
| 群成员管理 | POST/DELETE `/api/messages/groups/[id]/members` | members API | ✅ |
| 退群 | POST `/api/messages/groups/[id]/leave` | leaveGroup() | ✅ |
| 修改群信息 | PUT `/api/messages/groups/[id]` | **❌ 未调用** | ⚪ |
| 删除群 | DELETE `/api/messages/groups/[id]` | **❌ 未调用** | ⚪ |

**覆盖率：9/11**

### 3.10 通知（Notifications）

| 子功能 | Web | Mobile | 状态 |
|--------|-----|--------|------|
| 通知列表 | `/signals` + GET `/api/notifications` | NotificationsScreen | ✅ |
| 未读数 | GET `/api/notifications/unread-count` | getUnreadCount() | ✅ |
| 标记已读 | PATCH `/api/notifications/[id]/read` | markAsRead() | ✅ |
| 全部已读 | PATCH `/api/notifications/read-all` | markAllAsRead() | ✅ |
| Push token 注册 | n/a | POST `/api/notifications/token` | Mobile 独有需求 |

**覆盖率：4/4**

### 3.11 管理后台（Admin）

Web 独有 27 个 admin endpoints（活动管理、订单管理、用户管理、收藏品管理、首页分区等），**不需要 Mobile 对齐**。

## 四、问题清单（按严重度）

### 4.1 P0：当前正在/可能正在出 bug（修复目标）

| ID | 问题 | 影响 | 修复方案 |
|----|------|------|---------|
| **P0-1** | Mobile services 部分文件 `id: number`（User/Order/Ticket/Conversation/Message/Notification/Collectible/Post），与后端 UUID 字符串不匹配。**Event/Tier 的 `id: number` 是对的**（后端是 Int autoincrement） | TS 类型不真实，运行时若出现 `parseInt(id)` 之类操作必炸；后端返字符串前端按 number 用 | 通过 Phase D 引入 `@piaoyuzhou/shared` 类型，受影响 services 改 import |
| **P0-2** | Mobile 没调 `/api/tickets/use` | 工作人员用 Mobile 扫码只能 verify 不能核销 | `services/tickets.ts` 加 `useTicket()` |
| **P0-3** | Mobile logout 不调 server | refresh token 永不 revoke：账号被盗或改密码后旧设备仍可用 | `services/auth.ts:logout()` 先 POST `/api/auth/logout` 再清前端 |
| **P0-4** | Mobile 缺当前用户拉取（`getCurrentUser`） | 用户资料只来自登录响应，永远不刷新 | `services/auth.ts` 加 `getCurrentUser()`，`AuthContext` 启动时调一次 |
| **P0-5（审计中新发现）** | Mobile `updateProfile()` 调 `PUT /api/user/me` 但服务端只有 GET。正确路由是 `POST /api/user/update` | 用户改昵称/头像/简介**整个失败**。前端可能显示成功但后端没存。 | 改 `users.ts:updateProfile()` 调 `POST /api/user/update` |

### 4.2 P1：高价值缺失功能（修复目标）

| ID | 问题 | 影响 | 修复方案 |
|----|------|------|---------|
| ~~P1-1~~ | ~~Mobile 缺订单取消~~ | **审计中确认 `services/orders.ts:167` 已有 `cancelOrder()`**，无需新增；只需 review UI 是否暴露按钮 | 仅检查 OrderDetailScreen 是否调用 |
| **P1-2** | Mobile updateProfile 路由错误 | 见 P0-5 | 已升级到 P0 |
| **P1-3** | Mobile 未订阅 `comment:new` socket 事件 + `typing` 事件名错配 | Web 评论后 Mobile 端帖子详情页不会实时刷新；正在输入状态 Mobile 也接收不到 | `socket.ts` 加 `comment:new` 订阅入口 + `JoinPost/LeavePost` 方法；修 `Typing = 'typing'` → `'typing:start'` |

### 4.3 P2：单端独有 / 低优级（仅记录，不修）

- 活动搜索 `/api/events/search`（Mobile 未调用）
- 活动关注 `/api/events/[id]/follow`（Mobile 未调用）
- 帖子举报 `/api/posts/[id]/report`（Mobile 未调用）
- 群信息编辑、删除群（Mobile 未调用）
- 公开收藏品列表 `/api/collectibles`（Mobile 通过首页 sections 间接访问）
- Web `/u/[id]` 用户公开主页与 Mobile UserProfileScreen 字段是否对齐（待人工 review）
- Mobile 独有：地址管理、证件管理、删除账户（Web 未实现）

## 五、WebSocket 事件覆盖度

### 5.1 Web 服务端发出的事件

来源：`apps/web/server.js` + `apps/web/app/api/posts/[id]/comments/route.ts`

| 事件 | 触发位置 | 接收方 |
|------|---------|--------|
| `user:online` | server.js:81 | broadcast 全部 |
| `user:offline` | server.js:144 | broadcast 全部 |
| `message:new` | server.js:88 | room `user:${receiverId}` |
| `message:sent` | server.js:94 | 发送者本人 |
| `message:read` | server.js:103 | 发送者本人 |
| `typing:start` | server.js:112 | room `user:${receiverId}` |
| `typing:stop` | server.js:119 | room `user:${receiverId}` |
| `comment:new` | api/posts/[id]/comments/route.ts:314 | room `post:${postId}` |

### 5.2 Mobile 客户端订阅的事件

来源：`apps/mobile/src/services/socket.ts`

| 枚举名 | 实际值 | 服务端是否对应 |
|--------|-------|---------------|
| `Connect` | `connect` | ✅（系统事件） |
| `Disconnect` | `disconnect` | ✅ |
| `Error` | `error` | ✅ |
| `Reconnect` | `reconnect` | ✅ |
| `NewMessage` | `message:new` | ✅ |
| `MessageSent` | `message:sent` | ✅ |
| `MessageRead` | `message:read` | ✅ |
| `Typing` | `typing` | ❌ **服务端发的是 `typing:start`，不是 `typing`** |
| `StopTyping` | `typing:stop` | ✅ |
| `UserOnline` | `user:online` | ✅ |
| `UserOffline` | `user:offline` | ✅ |
| `ConversationUpdated` | `conversation:updated` | ❌ **服务端没发这个** |

### 5.3 漂移总结

- **Mobile 缺**：`comment:new`（实时评论，P1-3）
- **Mobile 错配**：`Typing` 枚举值是 `typing`，但服务端发的是 `typing:start` —— Mobile 监听不到正在输入状态
- **Mobile 死代码**：`ConversationUpdated`、`joinConversation`/`leaveConversation` 方法（服务端不发也不接）

修 P1-3 时把 typing 错配也一并修掉。

## 六、修复执行计划

### Phase D：补齐 `packages/shared` 类型（先做，给后续提供基础设施）

新增类型文件，对齐 `apps/web/prisma/schema.prisma`：

- [ ] `packages/shared/src/types/user.ts` — `User`、`UserPublic`
- [ ] `packages/shared/src/types/event.ts` — `Event`、`EventTier`
- [ ] `packages/shared/src/types/ticket.ts` — `Ticket`（结合现有 TicketStatus enum）
- [ ] `packages/shared/src/types/order.ts` — `Order`、`OrderItem`
- [ ] `packages/shared/src/types/message.ts` — `Conversation`、`Message`、`MessageGroup`
- [ ] `packages/shared/src/types/notification.ts` — `Notification`
- [ ] `packages/shared/src/types/collectible.ts` — `Collectible`、`UserCollectible`
- [ ] `packages/shared/src/types/post.ts` — `Post`、`Comment`
- [ ] `packages/shared/src/types/index.ts` — 汇总 re-export
- [ ] `npm run build` 重建 dist

### Phase B：修 P0 bug

- [ ] **B1（合 Phase D）** — Mobile 11 service 文件改用 shared 类型，自然修复 ID 类型
- [ ] **B2** — 加 `services/tickets.ts: useTicket()`
- [ ] **B3** — `services/auth.ts: logout()` 先调 server `/api/auth/logout`
- [ ] **B4** — `services/auth.ts: getCurrentUser()`，AuthContext 启动时调

### Phase C：补 P1 高价值功能

- [ ] **C1** — `services/orders.ts: cancelOrder()` + OrderDetailScreen 按钮
- [ ] **C2** — `services/users.ts: updateProfile()` + EditProfileScreen 接 API
- [ ] **C3** — Mobile 订阅 `comment:new`，PostDetailScreen 实时刷新；顺便修 typing 错配

### 验证

每阶段完成跑：
```bash
cd packages/shared && npm run build
cd apps/mobile && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

## 七、本次明确不做的事

- Web services 也对齐 shared 类型（Web 用 Prisma 生成的更权威，重复反而维护负担）
- CI 强制类型检查（下次专门做）
- P2 列表所有功能
- 移动端登录退避 UX（剩余次数倒计时）—— `error` 文案已经够用
- socket.io Redis adapter（单实例够用）
- Node cluster

## 八、进度

### Phase A 审计文档
- [x] 本文档

### Phase D：补齐 `packages/shared` 类型
- [x] `user.ts`、`event.ts`、`ticket.ts`、`order.ts`、`message.ts`、`notification.ts`、`collectible.ts`、`post.ts`
- [x] `index.ts` 汇总 re-export
- [x] `npm run build` 重建 dist
- [x] Web 类型检查通过
- [x] Mobile 类型检查（与改动相关的文件全通过）

### Phase B：P0 修复
- [x] **B1** ID 类型修复（`auth.ts`、`AuthContext`）。`tickets.ts`/`orders.ts` 的 ID 字段本就用 `string`，无需改；`users.ts` 已用 `string`
- [x] **B2** Mobile `services/tickets.ts` 加 `useTicket()`（POST `/api/tickets/use`）
- [x] **B3** Mobile `services/auth.ts:logout()` 现在先 POST `/api/auth/logout`（带 refresh token），再清前端
- [x] **B4** Mobile `services/auth.ts` 加 `getCurrentUser()`；`AuthContext` 启动时调用 `refreshUserSilent`
- [x] **P0-5** Mobile `services/users.ts:updateProfile()` 改调 `POST /api/user/update`（原 `PUT /api/user/me` 服务端不存在）

### Phase C：P1 修复
- [x] ~~C1 Mobile 订单取消~~ — 审计中确认 `cancelOrder()` 早就存在
- [x] **C2** `services/users.ts:updateProfile()` 已修对路由（与 P0-5 合并）
- [x] **C3** `services/socket.ts` 修 `Typing` 事件名（`typing` → `typing:start`）；加 `NewComment = 'comment:new'`、`joinPost`/`leavePost`；`PostDetailScreen` 订阅 `comment:new` 事件实时刷新

### 后续验证（部署后）
- [ ] Mobile 端用现有账号登录（验证 bcrypt 兼容 + 类型不炸）
- [ ] 改昵称 → 重启 app → 看新昵称（验证 P0-5 修复）
- [ ] 登出后查 RDS `user_sessions` 表对应 refresh token 有 `revoked: true`（验证 B3）
- [ ] Web 端评论一条 → Mobile PostDetailScreen 自动刷新（验证 C3）

### 本次未触及的 P2（再战）
见第 4.3 节列表（活动搜索/关注、帖子举报、群信息编辑、用户公开主页字段对齐等）。
