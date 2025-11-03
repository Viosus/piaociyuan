# 票次元 API 概览

本文档提供票次元平台所有 API 的概览，帮助开发者快速了解可用的接口。

## 目录

- [基础信息](#基础信息)
- [API 分类](#api-分类)
- [详细文档](#详细文档)

---

## 基础信息

### Base URL
```
https://piaociyuan.com/api
```

### 认证方式
所有需要认证的接口使用 JWT Bearer Token：
```
Authorization: Bearer <access_token>
```

### 响应格式
所有 API 响应均为 JSON 格式：
```json
{
  "ok": true,
  "data": {},
  "message": "success"
}
```

错误响应：
```json
{
  "ok": false,
  "code": "ERROR_CODE",
  "message": "错误信息"
}
```

---

## API 分类

### 1. 认证与用户管理

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 注册 | POST | `/api/auth/register` | 否 | 用户注册 |
| 登录 | POST | `/api/auth/login` | 否 | 用户登录 |
| 刷新Token | POST | `/api/auth/refresh` | 否 | 刷新访问令牌 |
| 获取用户信息 | GET | `/api/user/profile` | 是 | 获取当前用户信息 |
| 更新用户信息 | PATCH | `/api/user/profile` | 是 | 更新用户资料 |

### 2. 活动管理

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 获取活动列表 | GET | `/api/events` | 否 | 获取所有活动 |
| 获取活动详情 | GET | `/api/events/[id]` | 否 | 获取单个活动详情 |
| 关注活动 | POST | `/api/events/[id]/follow` | 是 | 关注/取消关注活动 |

### 3. 票务管理

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 获取可用票 | GET | `/api/tickets/available` | 否 | 查询可用票 |
| 持有票 | POST | `/api/tickets/hold` | 是 | 临时持有票（5分钟） |
| 使用票 | POST | `/api/tickets/use` | 是 | 使用/验证票 |
| 我的票 | GET | `/api/tickets/my` | 是 | 获取用户所有票 |

### 4. 订单管理

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 创建订单 | POST | `/api/orders` | 是 | 创建新订单 |
| 获取订单列表 | GET | `/api/orders` | 是 | 获取用户订单 |
| 获取订单详情 | GET | `/api/orders/[id]` | 是 | 获取单个订单详情 |
| 取消订单 | POST | `/api/orders/[id]/cancel` | 是 | 取消未支付订单 |

### 5. NFT 数字藏品

#### 5.1 NFT 资产

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 获取我的NFT | GET | `/api/nft/assets/my` | 是 | 获取已铸造的NFT列表 |
| 获取NFT详情 | GET | `/api/nft/assets/[tokenId]` | 是 | 获取单个NFT详情 |

#### 5.2 NFT 铸造

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 请求铸造NFT | POST | `/api/nft/mint/request` | 是 | 将票转为NFT |
| 查询铸造状态 | GET | `/api/nft/mint/status/[ticketId]` | 是 | 查询NFT铸造进度 |

#### 5.3 钱包管理

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 绑定钱包 | POST | `/api/nft/wallet/bind` | 是 | 绑定Web3钱包 |
| 查询钱包状态 | GET | `/api/nft/wallet/status` | 是 | 获取钱包绑定状态 |

#### 5.4 用户收藏

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 获取NFT收藏 | GET | `/api/user/nfts` | 是 | 获取用户的NFT收藏列表 |
| 获取收藏详情 | GET | `/api/user/nfts/[id]` | 是 | 获取单个NFT收藏详情 |

### 6. 通知系统

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 获取通知列表 | GET | `/api/notifications` | 是 | 获取用户通知 |
| 标记已读 | PATCH | `/api/notifications/[id]/read` | 是 | 标记通知为已读 |
| 全部已读 | POST | `/api/notifications/read-all` | 是 | 标记所有通知为已读 |

### 7. 社交功能

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 获取关注列表 | GET | `/api/user/follows` | 是 | 获取用户关注的活动 |
| 关注活动 | POST | `/api/events/[id]/follow` | 是 | 关注活动 |

---

## 详细文档

各模块的详细 API 文档：

### 核心功能
- [认证 API 文档](./认证API文档.md) - 用户注册、登录、Token管理
- [活动 API 文档](./活动API文档.md) - 活动查询、详情、关注
- [票务 API 文档](./票务API文档.md) - 票务查询、预订、使用
- [订单 API 文档](./订单API文档.md) - 订单创建、查询、管理

### 增值功能
- [NFT API 文档](./NFT-API文档.md) - NFT资产、铸造、钱包管理
- [通知 API 文档](./通知API文档.md) - 通知查询、标记
- [社交 API 文档](./社交API文档.md) - 关注、互动

---

## 快速开始

### 1. 获取访问令牌

```javascript
// 登录
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '13800138000',
    password: 'your_password'
  })
});

const { data } = await response.json();
const token = data.accessToken;
```

### 2. 使用令牌访问 API

```javascript
const events = await fetch('/api/events', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. 购买票流程

```javascript
// 1. 选择活动和票档
const event = await fetch('/api/events/1');

// 2. 持有票（5分钟）
const hold = await fetch('/api/tickets/hold', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventId: 1,
    tierId: 101,
    qty: 2
  })
});

// 3. 创建订单
const order = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    holdId: hold.data.holdId
  })
});

// 4. 支付（模拟）
// ... 调用支付接口

// 5. 查看订单
const orderDetail = await fetch(`/api/orders/${order.data.id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 4. NFT 铸造流程

```javascript
// 1. 绑定钱包
await fetch('/api/nft/wallet/bind', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    walletAddress: '0x...',
    signature: '0x...',
    message: 'Sign this message...',
    walletType: 'metamask'
  })
});

// 2. 请求铸造 NFT
const mint = await fetch('/api/nft/mint/request', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ticketId: 'ticket-uuid'
  })
});

// 3. 轮询铸造状态
const checkStatus = setInterval(async () => {
  const status = await fetch(`/api/nft/mint/status/${ticketId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await status.json();
  if (data.mintStatus === 'minted') {
    clearInterval(checkStatus);
    console.log('NFT铸造成功！');
  }
}, 2000);

// 4. 查看 NFT 收藏
const nfts = await fetch('/api/user/nfts', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 错误处理

### 通用错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权或Token无效 |
| 403 | FORBIDDEN | 无权限访问 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突（如重复注册） |
| 500 | SERVER_ERROR | 服务器内部错误 |

### 业务错误示例

```json
{
  "ok": false,
  "code": "INSUFFICIENT_INVENTORY",
  "message": "库存不足"
}
```

---

## 性能优化

### 1. 分页查询

大多数列表接口支持分页：
```
GET /api/events?page=1&limit=20
```

### 2. 字段筛选

部分接口支持选择返回字段：
```
GET /api/events?fields=id,name,date,cover
```

### 3. 缓存

- 活动列表：缓存 5 分钟
- 活动详情：缓存 1 分钟
- 用户信息：无缓存

---

## 安全建议

1. **Token 存储**: 使用 HttpOnly Cookie 或安全的本地存储
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **速率限制**: API 有速率限制，避免频繁请求
4. **敏感信息**: 不要在客户端存储密码或密钥
5. **钱包安全**: 钱包私钥永远不应发送到服务器

---

## 测试环境

### 测试账号
```
手机: 13800138000
密码: Test123456
```

### 测试钱包
```
地址: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
网络: Polygon Mumbai Testnet
```

---

## 技术支持

- GitHub: https://github.com/your-org/piaociyuan
- 文档: https://docs.piaociyuan.com
- Email: dev@piaociyuan.com

---

## 更新日志

### 2025-11-02
- ✅ NFT 功能重构完成
- ✅ 新增 NFT 相关 API
- ✅ 完善钱包管理功能
- ✅ 优化票务系统

### 2025-11-01
- ✅ 添加通知系统
- ✅ 添加社交关注功能
- ✅ 优化订单流程

---

如有问题或建议，欢迎提交 Issue 或 PR。
