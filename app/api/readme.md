/app/api
├── holds/
│ └── route.ts # 创建锁票（保留票）
├── orders/
│ └── route.ts # 创建订单
├── pay/
│ └── mock/
│ └── route.ts # 模拟支付（将订单状态改为已支付）
└── README.md # 当前说明文件

## 🪙 1️⃣ `/api/holds` — 锁票接口

### 作用
用户点击“提交订单”时，系统先创建一个临时锁票记录，保证这几张票在 10 分钟内不会被他人购买。

### 请求
```json
POST /api/holds
{
  "eventId": 1,
  "tierId": 101,
  "qty": 2
}

响应
{
  "holdId": "1b6f...fdb1",
  "expireAt": 1735564800000
}

🧾 2️⃣ /api/orders — 创建订单
作用

锁票成功后，创建一条订单记录（状态为 PENDING）。

请求
POST /api/orders
{
  "eventId": 1,
  "tierId": 101,
  "qty": 2,
  "holdId": "1b6f...fdb1"
}

响应
{
  "orderId": "e01a...77b3",
  "status": "PENDING"
}

错误示例
状态码	含义
404	hold 不存在
409	hold 已过期
400	请求体无效

💳 3️⃣ /api/pay/mock — 模拟支付
作用

模拟用户付款行为，将订单状态改为 PAID。

在真实系统中，这一步通常会接入第三方支付（支付宝、微信、Stripe 等）。

请求
POST /api/pay/mock
{
  "orderId": "e01a...77b3"
}

响应
{
  "status": "PAID"
}

错误示例
状态码	含义
404	订单不存在
409	状态不合法（如已支付）
🧠 实现原理（简要）

所有接口暂时使用内存数据结构保存：

// /api/holds/route.ts
const g = globalThis as any;
g._holds = g._holds || new Map();


这样在本地开发模式下，数据会在热更新中短暂保留，模拟一个数据库。

未来如要接入数据库，可直接将这些 Map 改为数据库操作，而无需改动接口逻辑。

🔄 调用顺序图
用户在 /checkout 点击「提交订单」
        │
        ▼
POST /api/holds        —— 创建锁票（10 分钟有效）
        │
        ▼
POST /api/orders       —— 创建订单（status = "PENDING"）
        │
        ▼
跳转 /order/[id]       —— 显示订单详情 + 支付按钮
        │
        ▼
POST /api/pay/mock     —— 模拟支付，返回 {status: "PAID"}
        │
        ▼
跳转 /account/badges   —— 展示电子纪念品

🧱 未来扩展方向
功能	接口规划	说明
订单查询	GET /api/orders/[id]	查看订单详情
订单列表	GET /api/orders?user=xxx	我的订单页
实时库存	GET /api/tiers/:id/availability	查询余票
实际支付接入	POST /api/pay/alipay / wechat	替换 Mock 支付
数据持久化	连接数据库（PostgreSQL / MongoDB）	保存订单与票务数据
🧩 技术提示

所有接口默认返回 JSON。

统一错误格式：

{ "error": "MESSAGE" }


如果你使用 fetch() 调用：

const res = await fetch("/api/holds", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ eventId: 1, tierId: 101, qty: 2 })
});
const data = await res.json();