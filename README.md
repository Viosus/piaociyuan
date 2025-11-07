# 票次元 (Piaociyuan) - Monorepo

一个现代化的票务平台，支持演唱会、音乐节等活动的在线购票。

> 本项目采用 **Turborepo** Monorepo 架构，支持多应用和共享代码管理。

## 技术栈

- **架构**: Turborepo Monorepo
- **前端**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL 18 + Prisma ORM 6.18
- **认证**: JWT (JSON Web Token)
- **高并发优化**: FOR UPDATE SKIP LOCKED 悲观锁机制
- **包管理**: npm workspaces

## 项目结构

```
piaoyuzhou/                    # Monorepo 根目录
├── apps/                      # 应用目录
│   ├── web/                   # Web 应用（Next.js）
│   │   ├── app/               # Next.js App Router 页面
│   │   ├── components/        # React 组件
│   │   ├── lib/               # 工具库
│   │   ├── hooks/             # React Hooks
│   │   ├── prisma/            # 数据库配置
│   │   │   ├── schema.prisma  # 数据库模型
│   │   │   └── migrations/    # 迁移文件
│   │   ├── scripts/           # 工具脚本
│   │   └── package.json       # Web 应用依赖
│   └── mobile/                # 移动应用（React Native + Expo）
│       ├── src/
│       │   ├── screens/       # 屏幕组件
│       │   ├── components/    # 可复用组件
│       │   ├── navigation/    # 导航配置
│       │   ├── services/      # API 服务
│       │   ├── contexts/      # React Contexts
│       │   ├── hooks/         # 自定义 Hooks
│       │   ├── constants/     # 常量配置
│       │   ├── types/         # TypeScript 类型
│       │   └── utils/         # 工具函数
│       ├── App.tsx            # 应用入口
│       └── package.json       # 移动应用依赖
├── packages/                  # 共享包目录
│   └── shared/                # 共享代码包
│       ├── src/
│       │   ├── types/         # 共享类型定义
│       │   └── constants/     # 共享常量
│       ├── dist/              # 编译输出
│       └── package.json       # 共享包配置
├── docs/                      # 项目文档
│   ├── mobile/                # 移动应用文档
│   │   ├── README.md          # 文档导航
│   │   ├── mobile-app-setup.md           # 开发进度
│   │   ├── app-development-summary.md    # 项目总结
│   │   └── mobile-ticketing-features.md  # 票务功能
│   └── migration-status.md    # Monorepo 迁移状态
├── package.json               # Monorepo 根配置
├── turbo.json                 # Turborepo 配置
└── README.md                  # 本文件
```

## 功能特性

### Web 应用
- ✅ 用户注册/登录（支持手机号/邮箱）
- ✅ 活动浏览与搜索
- ✅ 座位选择（自动分配 + 手动选座混合模式）
- ✅ 购票流程（锁票 → 支付 → 出票）
- ✅ 订单管理（查看、退款）
- ✅ NFT 数字藏品系统
- ✅ 社交功能（帖子、评论、点赞）
- ✅ 实时通讯（Socket.io）
- ✅ 高并发抢票支持（千人级并发测试通过）

### 移动应用
- ✅ 用户认证（登录、注册、验证码）
- ✅ 底部导航（首页、活动、门票、我的）
- ✅ 安全存储（Expo SecureStore）
- ✅ 全局状态管理（React Context）
- ✅ 活动列表和搜索
- ✅ 活动详情和票档选择
- ✅ 订单列表和管理
- ✅ 门票展示
- 🚧 支付集成
- 🚧 NFT 数字藏品
- 🚧 社交功能
- 🚧 扫码验票
- 🚧 推送通知

## 开发环境要求

- Node.js 18+
- PostgreSQL 12+
- npm 9+

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd piaoyuzhou
```

### 2. 安装依赖

```bash
# 安装所有 workspace 的依赖
npm install
```

### 3. 配置环境变量

```bash
# 复制 Web 应用的环境变量模板
cp apps/web/.env.example apps/web/.env

# 编辑 apps/web/.env 文件，填写配置：
# - DATABASE_URL: 数据库连接字符串
# - JWT_SECRET: JWT 密钥
# - ENCRYPTION_KEY: 加密密钥
```

#### 生成密钥

```bash
# 生成 JWT_SECRET（128 字符）
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 生成 ENCRYPTION_KEY（64 字符）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 设置数据库

#### 使用 PostgreSQL（推荐）

```bash
# 1. 创建数据库 "piaociyuan"

# 2. 修改 apps/web/.env 中的 DATABASE_URL
# 示例：DATABASE_URL="postgresql://postgres:password@localhost:5432/piaociyuan"

# 3. 运行数据库迁移
cd apps/web
npx prisma migrate dev
npx prisma generate

# 4. 填充种子数据（可选）
npm run db:seed

# 5. 返回根目录
cd ../..
```

### 5. 启动开发服务器

#### Web 应用

```bash
# 方式 1: 使用 Turborepo 启动所有应用
npm run dev

# 方式 2: 只启动 Web 应用
npm run dev:web
# 或
cd apps/web && npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

#### 移动应用

```bash
# 启动 Expo 开发服务器
npm run mobile
# 或
cd apps/mobile && npm start

# 在 Android 上运行
npm run mobile:android

# 在 iOS 上运行（需要 macOS）
npm run mobile:ios
```

使用 Expo Go 应用扫描二维码在真机上预览。

## Monorepo 工作流

### 可用脚本

```bash
# 构建所有应用和包
npm run build

# 只构建 Web 应用
npm run build:web

# 启动所有应用的开发服务器
npm run dev

# 只启动 Web 应用
npm run dev:web

# Lint 所有代码
npm run lint

# 安装所有依赖
npm run install-all
```

### 在单个应用中工作

```bash
# 进入 Web 应用目录
cd apps/web

# 运行特定脚本
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run db:seed      # 填充种子数据
npm run db:studio    # 启动 Prisma Studio
```

### 使用共享包

Web 应用已配置使用 `@piaoyuzhou/shared` 共享包：

```typescript
// 在 apps/web 中导入共享类型
import { ApiResponse, UserRole, TicketStatus } from '@piaoyuzhou/shared';

// 使用共享常量
import { ErrorCode, TICKET_HOLD_DURATION } from '@piaoyuzhou/shared';
```

## 数据库管理

### Prisma Studio（数据库可视化工具）

```bash
cd apps/web
npm run db:studio
```

### 数据库迁移

```bash
cd apps/web

# 创建新的迁移
npx prisma migrate dev --name 迁移名称

# 应用迁移到生产环境
npx prisma migrate deploy

# 重置数据库（⚠️ 会删除所有数据）
npx prisma migrate reset
```

## 核心功能说明

### 高并发抢票机制

本项目使用了大麦网同款的智能抢票策略：

1. **开售初期（高并发）**: 强制自动分配座位（使用 `FOR UPDATE SKIP LOCKED` 悲观锁）
2. **开售后期（低并发）**: 支持手动选座（乐观锁）
3. **自动切换**: 根据时间和并发度自动切换模式

详见：`docs/高并发优化总结.md`

### 测试结果

- ✅ 100 个用户同时抢 10 张票
- ✅ 0% 超卖率
- ✅ 平均响应时间 1.84ms
- ✅ 支持千人级并发

## 部署

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 设置 Root Directory 为 `apps/web`
4. 配置环境变量（DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY）
5. 部署

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | JWT 签名密钥（128字符） | `生成的随机字符串` |
| `JWT_ACCESS_EXPIRES` | Access Token 过期时间 | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh Token 过期时间 | `7d` |
| `ENCRYPTION_KEY` | 敏感信息加密密钥（64字符） | `生成的随机字符串` |

## 常见问题

### Q: 如何添加新的应用？

```bash
# 1. 在 apps/ 目录下创建新应用
mkdir apps/mobile

# 2. 在新应用的 package.json 中添加 workspace 依赖
{
  "name": "@piaoyuzhou/mobile",
  "dependencies": {
    "@piaoyuzhou/shared": "*"
  }
}

# 3. 在根目录重新安装依赖
npm install
```

### Q: 如何添加共享代码？

在 `packages/shared/src/` 目录下添加代码，然后在 `packages/shared/src/index.ts` 中导出。

### Q: Turborepo 缓存如何工作？

Turborepo 会缓存构建结果。如需清除缓存：

```bash
rm -rf .turbo
rm -rf apps/web/.next
rm -rf packages/shared/dist
```

### Q: 如何重置数据库？

```bash
cd apps/web
npx prisma migrate reset
npm run db:seed
```

### Q: PostgreSQL 连接失败怎么办？

1. 检查 PostgreSQL 服务是否启动
2. 确认 `apps/web/.env` 中的 DATABASE_URL 配置正确
3. 密码中的特殊字符需要 URL 编码（如 @ → %40）
4. 确认数据库已创建

## 文档

### 项目文档
- [Monorepo 迁移状态](docs/migration-status.md) - 详细的迁移记录和回退方案
- [高并发优化总结](docs/高并发优化总结.md) - 票务系统并发优化方案

### 移动应用文档
- [移动应用文档中心](docs/mobile/README.md) - 移动应用完整文档导航
- [开发进度](docs/mobile/mobile-app-setup.md) - 开发进度和待办事项
- [项目总结](docs/mobile/app-development-summary.md) - 项目概述和技术栈
- [票务功能](docs/mobile/mobile-ticketing-features.md) - 票务模块实现详情

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE)

---

**开发愉快！** 🎫✨
