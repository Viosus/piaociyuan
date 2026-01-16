# 票次元 (Piaoyuzhou) - Claude 环境配置

> 这是一个 monorepo 项目，包含 Web 和 Mobile 应用，用于票务和 NFT 数字藏品管理。

## 项目结构

```
piaoyuzhou/
├── apps/
│   ├── web/          # Next.js Web 应用
│   └── mobile/       # Expo React Native 应用
├── packages/
│   └── shared/       # 共享代码包
└── package.json      # 根 monorepo 配置
```

## 技术栈版本 (必须遵守)

### 运行环境
- **Node.js**: >= 18.0.0 (当前 22.x)
- **npm**: >= 9.0.0 (当前 10.x)
- **包管理**: npm workspaces

### 核心依赖版本 (已锁定，勿随意更改)
| 依赖 | 版本 | 说明 |
|------|------|------|
| react | 19.1.0 | Web 和 Mobile 统一版本 |
| react-dom | 19.1.0 | Web |
| react-native | 0.81.5 | Mobile |
| next | ^16.1.1 | Web 框架 |
| expo | ~54.0.30 | Mobile 框架 |
| three | ^0.172.0 | 3D 渲染 |
| @google/model-viewer | ^4.1.0 | 3D 模型查看器 |
| typescript | ~5.9.2 | 类型检查 |

### 数据库
- **ORM**: Prisma ^6.18.0
- **数据库**: PostgreSQL
- **Schema 位置**: `apps/web/prisma/schema.prisma`

## 根目录 package.json overrides

```json
{
  "overrides": {
    "react": "19.1.0",
    "react-native": "0.81.5",
    "use-latest-callback": "0.3.3"
  }
}
```

> **重要**: 修改任何 workspace 的 react 版本时，必须同步更新所有位置，否则 `npm ci` 会失败。

## 常用命令

```bash
# 安装依赖 (根目录执行)
npm install

# 启动 Web 开发服务器
npm run dev:web

# 启动 Mobile 开发服务器
npm run dev:mobile

# 构建 Web
npm run build:web
```

## Docker 构建注意事项

1. **npm workspaces**: 依赖会被 hoist 到根目录 `node_modules`，各 workspace 下没有独立的 `node_modules`
2. **Dockerfile 路径**: `apps/web/Dockerfile`
3. **Prisma**: 构建时需要 `npx prisma generate`

## CSS 配色变量

主要配色文件:
- `apps/web/styles/background.css` - 背景色
- `apps/web/app/globals.css` - 主色调、文字、边框
- `apps/web/styles/cards.css` - 卡片样式

当前配色:
```css
--app-bg-color: #E0DFFD;      /* 淡紫色背景 */
--primary: #46467A;           /* 深紫蓝色主色调 */
--foreground: #1a1a1f;        /* 文字颜色 */
```

## API 路由结构

Web API 路径: `apps/web/app/api/`

主要模块:
- `/api/auth/*` - 认证 (登录、注册、验证码)
- `/api/events/*` - 活动管理
- `/api/tickets/*` - 票务
- `/api/nft/*` - NFT 数字藏品
- `/api/orders/*` - 订单
- `/api/admin/*` - 管理后台

## 认证系统

- **密码加密**: bcryptjs (SALT_ROUNDS: 12)
- **Token**: JWT 双 Token (Access + Refresh)
- **验证码**: 6 位数字，5 分钟过期，存储在 `VerificationCode` 表

## Mobile 特有配置

- **导航**: @react-navigation v7
- **状态管理**: zustand
- **存储**: expo-secure-store (敏感数据), @react-native-async-storage (普通数据)
- **钱包**: ethers.js 6.x

## 注意事项

1. **版本同步**: Web 和 Mobile 的共享依赖版本必须一致
2. **Prisma 迁移**: 修改 schema 后执行 `npx prisma migrate dev`
3. **TypeScript**: 严格模式，勿使用 `any`
4. **提交规范**: 使用中文 commit message，格式如 `feat:`, `fix:`, `style:` 等

## GitHub Actions

- **CI/CD**: `.github/workflows/`
- **Docker Registry**: ghcr.io/viosus/piaociyuan/piaoyuzhou-web
- **部署**: 阿里云 ECS
