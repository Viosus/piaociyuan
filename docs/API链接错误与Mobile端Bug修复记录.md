# API 链接错误 + Mobile 端 Bug 修复记录

> 修复日期：2026-03-10
> 涉及范围：`apps/mobile/src/`（Mobile 端）、`apps/web/app/api/`（Web API 路由）

---

## 一、Mobile 端 Bug 修复（Part B）

### B1. `response.success` → `response.ok`（运行时 Bug）

API 响应对象使用 `ok` 字段表示成功，但多处代码错误地使用了 `success`。

| 文件 | 行号 | 修复前 | 修复后 |
|------|------|--------|--------|
| `screens/MintNFTScreen.tsx` | 37 | `walletResult.success` | `walletResult.ok` |
| `screens/MintNFTScreen.tsx` | 43 | `ordersResult.success` | `ordersResult.ok` |
| `screens/EditProfileScreen.tsx` | 66 | `uploadResult.success` | `uploadResult.ok` |
| `screens/VerificationScreen.tsx` | 92 | `uploadResult.success` | `uploadResult.ok` |

---

### B2. 导航参数名错误（运行时 Bug）

`PostDetailScreen` 期望接收 `route.params.postId`，但通知页面传递的参数名为 `id`。

| 文件 | 行号 | 修复前 | 修复后 |
|------|------|--------|--------|
| `screens/NotificationsScreen.tsx` | 122 | `{ id: data.postId }` | `{ postId: data.postId }` |

---

### B3. `Set<number>` → `Set<string>`（类型 Bug）

`FollowUser.id` 是 `string` 类型（Prisma `User.id` 为 `String @id @default(uuid())`），但 `followLoadingIds` 声明为 `Set<number>`。

| 文件 | 行号 | 修复前 | 修复后 |
|------|------|--------|--------|
| `screens/FollowingListScreen.tsx` | 31 | `Set<number>` | `Set<string>` |
| `screens/FollowerListScreen.tsx` | 31 | `Set<number>` | `Set<string>` |

---

### B4. userId 路由参数类型 `number` → `string`

Prisma 中 `User.id` 是 `String @id @default(uuid())`，路由参数应为 `string`。

| 文件 | 行号 | 修复前 | 修复后 |
|------|------|--------|--------|
| `screens/FollowingListScreen.tsx` | 23 | `{ userId: number }` | `{ userId: string }` |
| `screens/FollowerListScreen.tsx` | 23 | `{ userId: number }` | `{ userId: string }` |

---

### B5. Order 相关 ID 类型 `number` → `string`

Prisma 中 `Order.id`、`Order.userId`、`Order.eventId`、`Order.tierId` 均为 `String`，Mobile 端类型定义错误地使用了 `number`。

**文件：`services/orders.ts`**

| 位置 | 修复前 | 修复后 |
|------|--------|--------|
| `Order.id` (line 9) | `number` | `string` |
| `Order.userId` (line 10) | `number` | `string` |
| `Order.eventId` (line 11) | `number` | `string` |
| `Order.tierId` (line 12) | `number` | `string` |
| `Ticket.orderId` (line 34) | `number` | `string` |
| `Ticket.eventId` (line 35) | `number` | `string` |
| `Ticket.tierId` (line 36) | `number` | `string` |
| `Ticket.userId` (line 37) | `number` | `string` |
| `createOrder.eventId` | `number` | `string` |
| `createOrder.tierId` | `number` | `string` |
| `getOrderDetail(orderId)` | `number` | `string` |
| `cancelOrder(orderId)` | `number` | `string` |
| `refundOrder(orderId)` | `number` | `string` |

---

### B6. PostDetailScreen 内联类型 `cover` → `coverImage`

帖子关联的活动封面字段名与 API 返回不一致。

| 文件 | 行号 | 修复前 | 修复后 |
|------|------|--------|--------|
| `screens/PostDetailScreen.tsx` | 42 | `cover: string` | `coverImage: string` |

> 注：渲染处已使用 fallback 写法 `post.event.coverImage \|\| post.event.cover`，本次修复类型定义。

---

### B7. 上传函数改用统一 `/api/upload` 路由

Mobile 端上传函数调用了不存在的专用上传路由，统一改为已有的 `/api/upload`。同时将 FormData 字段名统一为 `file`（与 `/api/upload` 路由的 `formData.get('file')` 匹配）。

| 文件 | 行号 | 修复前（URL） | 修复后（URL） | 字段名修复 |
|------|------|---------------|---------------|------------|
| `services/verification.ts` | 84 | `/api/user/verification/upload-image` | `/api/upload` | `image` → `file` |
| `services/verification.ts` | 150 | `/api/user/upload-avatar` | `/api/upload` | `avatar` → `file` |
| `services/posts.ts` | 208 | `/api/upload/post-image` | `/api/upload` | 已是 `file`，无需改 |

---

## 二、缺失 API 路由新建（Part A）

以下 11 个 API 路由被 Mobile 端调用但在 Web 端不存在，已全部新建。

### 路由清单

| # | 路由 | HTTP 方法 | Mobile 调用处 | 说明 |
|---|------|-----------|---------------|------|
| 1 | `/api/orders/[id]/cancel` | POST | `services/orders.ts:168` | 取消待支付订单，释放库存 |
| 2 | `/api/orders/[id]/refund` | POST | `services/orders.ts:175` | 已支付订单退款，复用退款逻辑 |
| 3 | `/api/tickets/[id]/refund` | POST | `services/tickets.ts:92` | 单票退票 |
| 4 | `/api/nft/mint/orders` | GET | `services/nft.ts:260` | 查询已支付且可铸造 NFT 的订单 |
| 5 | `/api/messages/unread-count` | GET | `services/messages.ts:165` | 未读消息总数 |
| 6 | `/api/notifications/unread-count` | GET | `services/notifications.ts:230` | 未读通知数 |
| 7 | `/api/user/[id]/following` | GET | `services/users.ts:95` | 指定用户的关注列表 |
| 8 | `/api/user/[id]/followers` | GET | `services/users.ts:104` | 指定用户的粉丝列表 |
| 9 | `/api/user/change-password` | POST | `services/verification.ts:128` | 修改密码 |
| 10 | `/api/posts/[id]/comments/[commentId]/like` | POST | `services/posts.ts:183` | 评论点赞 |
| 11 | `/api/posts/[id]/comments/[commentId]/like` | DELETE | `services/posts.ts:190` | 取消评论点赞 |

### 新建文件列表

```
apps/web/app/api/
├── orders/[id]/cancel/route.ts
├── orders/[id]/refund/route.ts
├── tickets/[id]/refund/route.ts
├── nft/mint/orders/route.ts
├── messages/unread-count/route.ts
├── notifications/unread-count/route.ts
├── user/[id]/following/route.ts
├── user/[id]/followers/route.ts
├── user/change-password/route.ts
└── posts/[id]/comments/[commentId]/like/route.ts
```

### 各路由实现要点

#### 1. `POST /api/orders/[id]/cancel`
- 认证 + 所有权验证
- 仅允许 `PENDING` 状态的订单取消
- 更新订单状态为 `CANCELLED`，释放关联票（ticket）到 `available`

#### 2. `POST /api/orders/[id]/refund`
- 认证 + 所有权验证
- 仅允许 `PAID` 状态的订单退款
- 检查票是否已使用
- 支持 mock / 微信 / 支付宝退款
- 事务更新：订单状态 → `REFUNDED`，票状态 → `refunded`，恢复票档库存

#### 3. `POST /api/tickets/[id]/refund`
- 认证 + 所有权验证
- 仅允许 `sold` 状态且未使用的票退票
- 更新票状态为 `refunded`，恢复票档库存

#### 4. `GET /api/nft/mint/orders`
- 认证
- 查询用户所有 `PAID` 状态的订单
- 关联查询 Event、Tier 信息
- 检查 `UserNFT` 表判断是否已铸造

#### 5. `GET /api/messages/unread-count`
- 认证
- 查询 `Message` 表中 `receiverId = userId && isRead = false` 的数量

#### 6. `GET /api/notifications/unread-count`
- 认证
- 查询 `Notification` 表中 `userId = userId && isRead = false` 的数量

#### 7. `GET /api/user/[id]/following`
- 认证可选（用于判断当前用户是否关注了列表中的人）
- 分页查询 `UserFollow` 表（`followerId = userId`）
- 返回关注用户的基本信息 + `isFollowing` 状态

#### 8. `GET /api/user/[id]/followers`
- 与 #7 对称，查询 `UserFollow` 表（`followingId = userId`）

#### 9. `POST /api/user/change-password`
- 认证
- 验证当前密码（bcryptjs）
- 新密码至少 6 位
- 使用 `hashPassword()` 加密后更新

#### 10-11. `POST/DELETE /api/posts/[id]/comments/[commentId]/like`
- 认证
- 验证评论存在且属于该帖子
- POST：`likeCount` 增加 1
- DELETE：`likeCount` 减少 1（不低于 0）
- 注：当前无 `CommentLike` 关联表，仅操作 `Comment.likeCount` 字段

---

## 三、参考的已有文件

| 文件 | 用途 |
|------|------|
| `apps/web/lib/auth.ts` | `verifyToken()`, `getCurrentUser()`, `hashPassword()`, `verifyPassword()` |
| `apps/web/lib/prisma.ts` | Prisma client |
| `apps/web/lib/store.ts` | `normalizeId()` |
| `apps/web/lib/error-utils.ts` | `getErrorMessage()` |
| `apps/web/lib/payment.ts` | `createRefund()` |
| `apps/web/app/api/pay/refund/route.ts` | 退款逻辑参考 |
| `apps/web/app/api/user/following/route.ts` | 关注列表查询参考 |
| `apps/web/app/api/posts/[id]/like/route.ts` | 点赞逻辑参考 |
| `apps/web/app/api/upload/route.ts` | 通用上传路由（字段名 `file`） |

---

## 四、Prisma Schema 关键类型参考

| Model | 字段 | 类型 | 说明 |
|-------|------|------|------|
| `User` | `id` | `String @id @default(uuid())` | 所有 userId 应为 `string` |
| `Order` | `id` | `String @id` | 订单 ID 为 `string` |
| `Order` | `eventId` / `tierId` | `String` | 存储为字符串，代码中 `parseInt()` 转换 |
| `Event` | `id` | `Int @id @default(autoincrement())` | 活动 ID 为整数 |
| `Tier` | `id` | `Int @id @default(autoincrement())` | 票档 ID 为整数 |
| `Ticket` | `id` | `String @id @default(uuid())` | 门票 ID 为 `string` |
| `Comment` | `likeCount` | `Int @default(0)` | 无 CommentLike 关联表 |
| `UserNFT` | `sourceId` | `String?` | 来源 ID（订单 ID 等） |
