# 我的收藏系统文档

## 📋 概述

"我的收藏"系统是一个数字纪念品管理系统，用户购票后自动获得对应的数字纪念品，支持2D图片、3D模型和AR功能。

## 🗄️ 数据库架构

### Badge 表 (纪念品定义)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 纪念品ID |
| eventId | Int | 所属活动 |
| tierId | Int? | 所属票档（可选） |
| name | String | 名称 |
| description | Text | 描述 |
| imageUrl | String | 2D图片URL |
| rarity | String | 稀有度 |
| type | String | 类型 |
| **has3DModel** | Boolean | 是否有3D模型 |
| **model3DUrl** | String? | 3D模型URL (.glb) |
| **modelFormat** | String? | 模型格式 |
| **hasAR** | Boolean | 是否支持AR |
| **arUrl** | String? | AR模型URL (.usdz) |
| **hasAnimation** | Boolean | 是否有动画 |
| **animationUrl** | String? | 动画URL |
| **modelConfig** | JSON | 3D模型配置 |

### UserBadge 表 (用户拥有的纪念品)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 记录ID |
| userId | UUID | 用户ID |
| badgeId | UUID | 纪念品ID |
| ticketId | UUID? | 通过哪张票获得 |
| orderId | String? | 通过哪个订单获得 |
| obtainedAt | DateTime | 获得时间 |
| metadata | JSON | 元数据 |

## 🎨 纪念品分类

### 按稀有度

- 🟡 **legendary** (传说) - VIP/内场限量海报
- 🟣 **epic** (史诗) - 预留
- 🔵 **rare** (稀有) - 活动参与纪念徽章
- ⚪ **common** (普通) - 票根纪念品

### 按类型

- **badge** (徽章) - 活动级别
- **ticket_stub** (票根) - 票档级别
- **poster** (海报) - VIP专享
- **certificate** (证书) - 预留

## 🎮 3D/AR 功能

### 支持的格式

1. **Web 3D**
   - 格式: `.glb` (glTF Binary)
   - 查看器: Three.js, Babylon.js, Model Viewer

2. **iOS AR**
   - 格式: `.usdz`
   - 查看器: AR Quick Look

3. **Android AR**
   - 格式: `.glb`
   - 查看器: Scene Viewer

### 模型配置 (JSON)

```json
{
  "position": { "x": 0, "y": 0, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 },
  "lighting": {
    "ambient": { "intensity": 0.5 },
    "directional": {
      "intensity": 1.0,
      "position": { "x": 10, "y": 10, "z": 10 }
    }
  },
  "camera": {
    "fov": 75,
    "position": { "x": 0, "y": 0, "z": 5 }
  },
  "animation": {
    "autoRotate": true,
    "rotateSpeed": 0.5,
    "bounce": false
  }
}
```

## 🔗 API 端点

### GET /api/user/collection

获取用户的收藏品

**Headers:**
```
Authorization: Bearer {token}
```

**Query参数:**
- `rarity` - 稀有度筛选 (common/rare/epic/legendary)
- `type` - 类型筛选 (badge/ticket_stub/poster/certificate)
- `eventId` - 活动筛选

**响应:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "badge": {
        "id": "uuid",
        "name": "纪念品名称",
        "description": "描述",
        "imageUrl": "/badges/...",
        "rarity": "legendary",
        "type": "poster",
        "has3DModel": true,
        "model3DUrl": "/models/poster-1.glb",
        "hasAR": true,
        "arUrl": "/models/poster-1.usdz",
        "modelConfig": { ... },
        "event": { ... }
      },
      "ticket": { ... },
      "order": { ... },
      "obtainedAt": "2025-10-30T...",
      "metadata": { ... }
    }
  ],
  "stats": {
    "total": 3,
    "byRarity": { ... },
    "byType": { ... },
    "has3D": 2,
    "hasAR": 2
  }
}
```

## 📱 前端页面

### /account/collection

展示用户的所有数字纪念品

**功能:**
- 网格布局展示收藏品
- 按稀有度和类型筛选
- 显示统计信息
- 3D/AR标记
- 响应式设计

**入口:**
- 订单详情页 → "🎨 我的收藏" 按钮
- 订单列表页 → 顶部 "🎨 我的收藏" 按钮

## 🚀 使用流程

### 1. 创建纪念品库

```bash
npx tsx scripts/seed-badges.ts
```

为每个活动创建：
- 1个活动徽章 (rare)
- N个票根 (common，每个票档1个)
- VIP/内场专享海报 (legendary)

### 2. 配置3D/AR模型

```bash
npx tsx scripts/add-3d-models.ts
```

为纪念品添加：
- 3D模型URL
- AR模型URL
- 动画配置
- 模型参数

### 3. 分配纪念品

用户购票支付后自动触发：

```typescript
// 订单支付成功时
await prisma.userBadge.create({
  data: {
    userId,
    badgeId,
    ticketId,
    orderId,
    metadata: JSON.stringify({ ... })
  }
});
```

### 4. 查看收藏

用户访问 `/account/collection` 查看所有收藏品

## 📊 当前数据

- **纪念品库**: 13个
  - 🟡 传说: 3个 (限量海报)
  - 🔵 稀有: 3个 (活动徽章)
  - ⚪ 普通: 7个 (票根)

- **3D/AR支持**: 6个
  - 3个海报 (3D + AR + 动画)
  - 3个徽章 (3D + AR)

## 🔮 未来扩展

1. **3D查看器集成**
   - Three.js / Babylon.js
   - 交互式3D预览
   - 手势控制

2. **AR功能**
   - iOS Quick Look
   - Android Scene Viewer
   - WebXR

3. **社交分享**
   - 分享收藏品
   - 收藏展示墙
   - NFT集成

4. **成就系统**
   - 收集徽章
   - 完成度统计
   - 稀有度排行

5. **交易市场**
   - 纪念品交换
   - 礼物赠送
   - 限量版拍卖

## 📝 注意事项

1. **3D模型文件**
   - 当前为占位URL，需准备实际模型文件
   - 建议使用CDN存储
   - 优化模型大小（< 5MB）

2. **性能优化**
   - 图片懒加载
   - 3D模型按需加载
   - 分页查询

3. **安全性**
   - 验证用户所有权
   - 防止刷纪念品
   - 限流保护

## 🛠️ 相关脚本

| 脚本 | 功能 |
|------|------|
| `scripts/seed-badges.ts` | 创建纪念品库 |
| `scripts/add-3d-models.ts` | 添加3D/AR配置 |
| `scripts/create-test-order.ts` | 创建测试订单并分配纪念品 |
| `scripts/test-badges.ts` | 为已支付订单分配纪念品 |

## 📚 技术栈

- **数据库**: PostgreSQL + Prisma ORM
- **后端**: Next.js App Router + API Routes
- **前端**: React + TypeScript + Tailwind CSS
- **3D**: 预留 Three.js / Babylon.js 集成
- **AR**: 预留 iOS Quick Look / Android Scene Viewer

---

**创建时间**: 2025-10-30
**版本**: 1.0.0
