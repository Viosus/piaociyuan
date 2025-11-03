# 票次元 (Piaociyuan)

一个现代化的票务平台，支持演唱会、音乐节等活动的在线购票。

## 技术栈

- **前端**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL 18 + Prisma ORM 6.18
- **认证**: JWT (JSON Web Token)
- **高并发优化**: FOR UPDATE SKIP LOCKED 悲观锁机制

## 功能特性

- ✅ 用户注册/登录（支持手机号/邮箱）
- ✅ 活动浏览与搜索
- ✅ 座位选择（自动分配 + 手动选座混合模式）
- ✅ 购票流程（锁票 → 支付 → 出票）
- ✅ 订单管理（查看、退款）
- ✅ 数字纪念品收藏系统
- ✅ 社交功能（帖子、评论、点赞）
- ✅ 高并发抢票支持（千人级并发测试通过）

## 开发环境要求

- Node.js 20+
- PostgreSQL 12+ （或使用 SQLite 作为替代）
- npm / yarn / pnpm

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd piaoyuzhou
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写您的配置：
# - DATABASE_URL: 数据库连接字符串
# - JWT_SECRET: JWT 密钥（生成方法见下文）
# - ENCRYPTION_KEY: 加密密钥（生成方法见下文）
```

#### 生成密钥

```bash
# 生成 JWT_SECRET（128 字符）
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 生成 ENCRYPTION_KEY（64 字符）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 设置数据库

#### 选项 A：使用 PostgreSQL（推荐）

```bash
# 1. 安装 PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# 2. 创建数据库
# 使用 psql 命令行或 pgAdmin 创建数据库 "piaociyuan"

# 3. 修改 .env 文件中的 DATABASE_URL
# 示例：DATABASE_URL="postgresql://postgres:your_password@localhost:5432/piaociyuan?connection_limit=20&pool_timeout=10&connect_timeout=10"

# 4. 运行数据库迁移
npx prisma migrate dev

# 5. 生成 Prisma Client
npx prisma generate

# 6. 填充种子数据（可选）
npm run db:seed
npm run db:create-tickets
```

#### 选项 B：使用 SQLite（仅开发/测试）

```bash
# 1. 修改 .env 文件，取消注释 SQLite 配置：
# DATABASE_URL="file:./prisma/dev.db"

# 2. 运行迁移和生成客户端
npx prisma migrate dev
npx prisma generate

# 3. 填充种子数据
npm run db:seed
npm run db:create-tickets
```

### 5. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 数据库管理

### Prisma Studio（数据库可视化工具）

```bash
npm run db:studio
# 或
npx prisma studio
```

### 种子数据脚本

```bash
# 填充活动、票档、用户等基础数据
npm run db:seed

# 生成票务数据
npm run db:create-tickets
```

### 数据库迁移

```bash
# 创建新的迁移
npx prisma migrate dev --name 迁移名称

# 应用迁移到生产环境
npx prisma migrate deploy

# 重置数据库（⚠️ 会删除所有数据）
npx prisma migrate reset
```

## 项目结构

```
piaoyuzhou/
├── app/                    # Next.js App Router 页面
│   ├── account/           # 用户账户相关页面
│   ├── auth/              # 登录/注册页面
│   ├── checkout/          # 购票结算页面
│   ├── events/            # 活动详情页面
│   ├── order/             # 订单管理页面
│   ├── api/               # API 路由
│   └── layout.tsx         # 全局布局
├── lib/                   # 工具库
│   ├── auth.ts            # JWT 认证逻辑
│   ├── database.ts        # 数据库操作（向后兼容层）
│   ├── inventory.ts       # 库存管理（高并发锁票逻辑）
│   ├── ticket-strategy.ts # 智能选座策略
│   └── prisma.ts          # Prisma 客户端
├── prisma/                # Prisma 配置
│   ├── schema.prisma      # 数据库模型定义
│   ├── migrations/        # 数据库迁移文件
│   └── seed.ts            # 种子数据脚本
├── scripts/               # 工具脚本
│   ├── create-tickets.ts  # 生成票务数据
│   └── test-concurrency.ts # 并发测试脚本
├── docs/                  # 项目文档
└── components/            # 可复用组件（如果有的话）
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

## 可用脚本

```bash
npm run dev          # 启动开发服务器（带 Turbopack）
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint 检查
npm run db:seed      # 填充种子数据
npm run db:create-tickets  # 生成票务数据
npm run db:studio    # 启动 Prisma Studio
```

## 部署

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量（DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY）
4. 部署

详见：[Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)

### Docker 部署

```bash
# TODO: 添加 Dockerfile
```

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | JWT 签名密钥（128字符） | `生成的随机字符串` |
| `JWT_ACCESS_EXPIRES` | Access Token 过期时间 | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh Token 过期时间 | `7d` |
| `ENCRYPTION_KEY` | 敏感信息加密密钥（64字符） | `生成的随机字符串` |

## 常见问题

### Q: 如何重置数据库？

```bash
npx prisma migrate reset
npm run db:seed
npm run db:create-tickets
```

### Q: 如何查看数据库内容？

```bash
npm run db:studio
```

在浏览器打开 http://localhost:5555

### Q: PostgreSQL 连接失败怎么办？

1. 检查 PostgreSQL 服务是否启动
2. 确认 .env 中的 DATABASE_URL 配置正确
3. 密码中的特殊字符需要 URL 编码（如 @ → %40）
4. 确认数据库已创建

### Q: 如何添加测试用户？

运行种子脚本会自动创建测试用户：
- 手机号: `17701790343`, 密码: `password123`
- 手机号: `13800138001`, 密码: `password123`

或手动注册新用户。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE)

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。

---

**开发愉快！** 🎫✨
