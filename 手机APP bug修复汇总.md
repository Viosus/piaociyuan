# 手机 APP Bug 修复汇总

本次修复完成了 5 个主要 Bug，涉及收藏功能、登录过期处理、门票详情、活动参数、购票流程等。

---

## Bug 1: 收藏功能无法正常运行 ✅

### 问题描述
安可区的收藏帖子功能没有正常运行：
- 取消收藏时报错
- 收藏状态显示不正确

### 根本原因
Posts API (`/api/posts` 和 `/api/posts/[id]`) 没有返回 `isLiked` 和 `isFavorited` 字段，导致前端无法正确显示和更新收藏状态。

### 修复内容
修改了 Posts API，添加了当前用户的认证检查，并返回收藏状态：

**修改文件**：
1. `apps/web/app/api/posts/route.ts`
2. `apps/web/app/api/posts/[id]/route.ts`

**关键代码**：
```typescript
// 获取当前用户
let currentUserId: string | null = null;
const authHeader = req.headers.get('Authorization');
if (authHeader && authHeader.startsWith('Bearer ')) {
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (payload) {
    currentUserId = payload.id;
  }
}

// 在 Prisma 查询中包含
likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
favorites: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,

// 在返回数据中添加
isLiked: currentUserId ? (post.likes && post.likes.length > 0) : false,
isFavorited: currentUserId ? (post.favorites && post.favorites.length > 0) : false,
```

### 修复效果
✅ 收藏功能正常工作
✅ 取消收藏不再报错
✅ 收藏状态正确显示

---

## Bug 2: 票夹界面无法刷新 ✅

### 问题描述
票夹界面一直加载不出来，或显示"刷新界面"但无法刷新。

### 根本原因
用户的 JWT 登录令牌已过期（accessToken 和 refreshToken 都过期），但前端没有正确处理登录过期的情况，导致：
- API 返回 401 错误
- 没有提示用户重新登录
- 界面一直处于加载状态

### 修复内容

**1. 改进 API 客户端错误处理**

**文件**：`apps/mobile/src/services/api.ts`

```typescript
catch (refreshError) {
  this.processQueue(refreshError, null);
  this.isRefreshing = false;
  // 抛出明确的登录过期错误
  throw {
    response: {
      status: 401,
      data: {
        ok: false,
        code: 'TOKEN_EXPIRED',
        error: '登录已过期，请重新登录',
      },
    },
  };
}
```

**2. 添加登录过期处理**

**文件**：
- `apps/mobile/src/screens/TicketsScreen.tsx`
- `apps/mobile/src/screens/EncoreScreen.tsx`

```typescript
const handleTokenExpired = () => {
  Alert.alert(
    '登录已过期',
    '您的登录状态已过期，请重新登录',
    [{
      text: '重新登录',
      onPress: async () => {
        await logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        });
      },
    }],
    { cancelable: false }
  );
};
```

### 修复效果
✅ 登录过期时显示友好的提示对话框
✅ 引导用户重新登录
✅ 清除过期的登录状态

---

## Bug 3: 门票详情无法显示 ✅

### 问题描述
门票详情页面无法正常显示，可能是因为数据格式不对。

### 根本原因

**问题 1**：门票详情 API 不存在
- `/api/tickets/[id]` 路由返回 404 错误

**问题 2**：类型定义错误
- 前端 ticket.id 定义为 `number`，但数据库使用 UUID（`string`）
- 导致类型不匹配

**问题 3**：日期处理错误
- 前端使用 `Number(ticket.createdAt)` 将 ISO 日期字符串转为数字
- 导致 `NaN` 错误

### 修复内容

**1. 创建门票详情 API**

**文件**：`apps/web/app/api/tickets/[id]/route.ts`（新建）

```typescript
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 认证检查
  // 查询门票
  // 验证所有权
  // 查询关联的活动和票档信息
  // 返回格式化数据（ISO 日期字符串）
}
```

**2. 修复类型定义**

**文件**：`apps/mobile/src/services/tickets.ts`

```typescript
export interface Ticket {
  id: string;           // 改为 string（UUID）
  userId?: string;      // 改为 string
  orderId?: string;     // 改为 string
  purchasedAt: string;  // 添加购买时间
  // ... 其他字段
}
```

**3. 修复日期处理**

**文件**：`apps/mobile/src/screens/TicketDetailScreen.tsx`

```typescript
// 修改前：formatDateTime(new Date(Number(ticket.createdAt)))
// 修改后：
{ticket.purchasedAt
  ? formatDateTime(new Date(ticket.purchasedAt))
  : formatDateTime(new Date(ticket.createdAt))}
```

**4. 更新我的门票 API**

**文件**：`apps/web/app/api/tickets/my-tickets/route.ts`

添加了缺失的字段，并将日期格式化为 ISO 字符串。

### 修复效果
✅ 门票详情 API 正常工作
✅ 类型定义正确
✅ 日期显示正常
✅ 门票详情页面正常显示

---

## Bug 4: 主页活动参数错误 ✅

### 问题描述
从主页点击活动进入详情页时显示"请求参数错误"。

### 根本原因
导航参数名不匹配：
- 多个页面传递 `{ id: eventId }`
- 但 EventDetailScreen 期望接收 `{ eventId: number }`
- 导致 `eventId` 为 `undefined`

### 问题范围
通过全局搜索发现多个文件存在同样问题：

导航到 EventDetail 的地方：
1. ✅ EventsScreen.tsx:67 - 正确使用 `eventId`
2. ❌ SectionBlock.tsx:26 - 错误使用 `id`
3. ❌ EncoreScreen.tsx:256 - 错误使用 `id`
4. ❌ FavoritesScreen.tsx:119 - 错误使用 `id`
5. ❌ NotificationsScreen.tsx:106 - 错误使用 `id`

其他导航问题（NotificationsScreen）：
- OrderDetail - 错误使用 `id`，应该是 `orderId`
- TicketDetail - 错误使用 `id`，应该是 `ticketId`

### 修复内容

**修改文件**：
1. `apps/mobile/src/components/SectionBlock.tsx`
2. `apps/mobile/src/screens/EncoreScreen.tsx`
3. `apps/mobile/src/screens/FavoritesScreen.tsx`
4. `apps/mobile/src/screens/NotificationsScreen.tsx`

**统一修改**：将所有 `{ id: xxx }` 改为 `{ eventId: xxx }`, `{ orderId: xxx }`, `{ ticketId: xxx }`

```typescript
// 修改前
navigation.navigate('EventDetail' as never, { id: eventId } as never);

// 修改后
navigation.navigate('EventDetail' as never, { eventId: eventId } as never);
```

### 参数命名规范
建立了统一的参数命名规范：

| 目标页面 | 参数名 | 类型 |
|---------|--------|------|
| EventDetail | `eventId` | number |
| TicketDetail | `ticketId` | string |
| OrderDetail | `orderId` | string |
| PostDetail | `postId` | number/string |
| UserProfile | `userId` | number/string |

### 修复效果
✅ 主页活动链接正常
✅ 安可区活动链接正常
✅ 收藏活动链接正常
✅ 通知活动链接正常
✅ 订单和门票链接正常

---

## Bug 5: 购票功能未实现 ✅

### 问题描述
点击活动详情的"立即购票"按钮，只显示"准备购买"提示，但没有实际的购票页面。

### 根本原因

**问题 1**：导航未实现
- EventDetailScreen 的 `handleBuyTicket` 只是一个 TODO 占位符
- 只显示 Alert 提示，没有实际导航

**问题 2**：路由未注册
- CheckoutScreen 和 PaymentScreen 文件已存在
- 但未在导航栈中注册

### 修复内容

**1. 实现购票导航**

**文件**：`apps/mobile/src/screens/EventDetailScreen.tsx`

```typescript
const handleBuyTicket = () => {
  if (!selectedTier) {
    Alert.alert('提示', '请选择票档');
    return;
  }

  if (selectedTier.available <= 0) {
    Alert.alert('抱歉', '该票档已售罄');
    return;
  }

  // 导航到购票页面
  navigation.navigate('Checkout' as never, {
    eventId: eventId,
    selectedTiers: [{
      tierId: selectedTier.id,
      tierName: selectedTier.name,
      price: selectedTier.price,
      quantity: 1,
    }],
  } as never);
};
```

**2. 注册购票和支付页面**

**文件**：`apps/mobile/src/navigation/AppNavigator.tsx`

添加导入：
```typescript
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
```

注册路由：
```typescript
<MainStack.Screen
  name="Checkout"
  component={CheckoutScreen}
  options={{ title: '确认订单' }}
/>
<MainStack.Screen
  name="Payment"
  component={PaymentScreen}
  options={{ title: '支付订单' }}
/>
```

### 完整购票流程

1. **活动详情页** - 选择票档，点击"立即购票"
2. **确认订单页** - 查看订单信息，填写联系人，点击"提交订单"
3. **支付订单页** - 选择支付方式，完成支付
4. **门票生成** - 订单完成后生成门票

### 修复效果
✅ 购票按钮正常工作
✅ 导航到确认订单页面
✅ 可以提交订单
✅ 可以进入支付页面
✅ 完整购票流程已打通

---

## 测试清单

### 收藏功能测试
- [x] 收藏帖子
- [x] 取消收藏
- [x] 收藏状态正确显示
- [x] 收藏列表正常显示

### 登录过期处理测试
- [x] Token 过期时显示提示
- [x] 点击"重新登录"跳转到登录页
- [x] 登录状态正确清除

### 门票详情测试
- [x] 门票详情页面正常显示
- [x] 活动信息正确
- [x] 门票状态正确
- [x] 日期时间正确显示

### 活动导航测试
- [x] 主页活动链接
- [x] 活动列表链接
- [x] 安可区活动链接
- [x] 收藏活动链接
- [x] 通知活动链接

### 购票流程测试
- [x] 选择票档
- [x] 点击购票按钮
- [x] 进入确认订单页
- [x] 填写联系信息
- [x] 提交订单
- [x] 进入支付页面

---

## 修改文件汇总

### 后端 API
1. `apps/web/app/api/posts/route.ts` - 添加 isLiked/isFavorited 字段
2. `apps/web/app/api/posts/[id]/route.ts` - 添加 isLiked/isFavorited 字段
3. `apps/web/app/api/tickets/[id]/route.ts` - 新建门票详情 API
4. `apps/web/app/api/tickets/my-tickets/route.ts` - 修复返回数据格式

### 前端服务
5. `apps/mobile/src/services/api.ts` - 改进 token 过期处理
6. `apps/mobile/src/services/tickets.ts` - 修复类型定义

### 前端页面
7. `apps/mobile/src/screens/TicketsScreen.tsx` - 添加登录过期处理
8. `apps/mobile/src/screens/EncoreScreen.tsx` - 添加登录过期处理 + 修复活动参数
9. `apps/mobile/src/screens/TicketDetailScreen.tsx` - 修复日期处理
10. `apps/mobile/src/screens/FavoritesScreen.tsx` - 修复活动参数
11. `apps/mobile/src/screens/NotificationsScreen.tsx` - 修复多个导航参数
12. `apps/mobile/src/screens/EventDetailScreen.tsx` - 实现购票导航
13. `apps/mobile/src/components/SectionBlock.tsx` - 修复活动参数

### 导航配置
14. `apps/mobile/src/navigation/AppNavigator.tsx` - 注册 Checkout 和 Payment 页面

---

## 总结

本次修复解决了 **5 个主要 Bug**，修改了 **14 个文件**，涉及：
- ✅ 收藏功能
- ✅ 登录过期处理
- ✅ 门票详情显示
- ✅ 活动参数传递
- ✅ 购票流程实现

所有核心功能已恢复正常，用户体验得到显著改善。

### 主要改进
1. **更好的错误处理** - 登录过期时友好提示
2. **参数命名规范** - 统一使用具体的参数名
3. **类型安全** - 修复类型定义错误
4. **完整流程** - 购票流程完全打通

### 技术债务清理
- 修复了多个 TODO 占位符
- 统一了导航参数命名
- 补充了缺失的 API
- 改进了错误处理机制

现在手机 APP 的核心功能已经稳定，可以进行下一阶段的开发工作！
