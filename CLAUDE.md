# 票次元 (Piaociyuan) - Claude 环境配置

> 这是一个 monorepo 项目，包含 Web 和 Mobile 应用，用于票务和收藏品管理。

## 项目结构

```
piaociyuan/
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
- `/api/collectibles/*` - 收藏品
- `/api/orders/*` - 订单
- `/api/admin/*` - 管理后台
- `/api/banners/*` - 轮播图/横幅
- `/api/health/*` - 健康检查
- `/api/holds/*` - 锁定/预留
- `/api/homepage-sections/*` - 首页板块
- `/api/messages/*` - 消息
- `/api/notifications/*` - 通知
- `/api/pay/*` - 支付
- `/api/posts/*` - 帖子/动态
- `/api/tiers/*` - 等级/层级
- `/api/upload/*` - 文件上传
- `/api/user/*` - 当前用户
- `/api/users/*` - 用户管理

## 认证系统

- **密码加密**: bcryptjs (SALT_ROUNDS: 12)
- **Token**: JWT 双 Token (Access + Refresh)
- **验证码**: 6 位数字，5 分钟过期，存储在 `VerificationCode` 表

## Mobile 特有配置

- **导航**: @react-navigation v7
- **状态管理**: zustand
- **存储**: expo-secure-store (敏感数据), @react-native-async-storage (普通数据)

## 注意事项

1. **版本同步**: Web 和 Mobile 的共享依赖版本必须一致
2. **Prisma 迁移**: 修改 schema 后执行 `npx prisma migrate dev`
3. **TypeScript**: 严格模式，勿使用 `any`
4. **提交规范**: 使用中文 commit message，格式如 `feat:`, `fix:`, `style:` 等

## 部署系统（2026-05-01 重构）

### 当前状态
- **主路径**：ECS 本地 build。SSH 进 ECS → `git pull` → `docker compose build web` → `up -d web`
- **GHCR 路径已废弃**：`ghcr.io/viosus/piaociyuan/piaociyuan-web` 不再使用，token / package 关系混乱无法可靠 push
- **CI 工作流**：`.github/workflows/deploy.yml` —— validate 部分有用（typecheck），build/deploy 部分待 Stage B 改造

### Dockerfile 国内 ECS 优化（已加在 `apps/web/Dockerfile`）
- apk 用 `mirrors.aliyun.com` 镜像（默认 dl-cdn.alpinelinux.org 国内超时）
- npm registry 用 `https://registry.npmmirror.com`，timeout 调到 10 分钟
- Prisma 引擎下载走 `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma`

### 手动部署（current source of truth）
```bash
ssh root@8.159.155.134
cd ~/piaociyuan
git pull origin main
docker compose build web        # 5-8 分钟
docker compose up -d web        # web 短暂重启
docker compose exec -T web npx prisma db push --skip-generate
curl -sS http://localhost:3000/api/health
```

---

## ⚠️ 不得再犯的错误（2026-05-01 总结）

### Next.js 16 + Turbopack 与 native module 不兼容
**症状**：登录 500，日志报 `Cannot find module @node-rs/bcrypt-<hex hash>`
**原因**：Next.js 16 默认 `next build` 用 Turbopack，但 Turbopack 对 napi-rs 的 try/catch fallback binding 加载机制处理不全。即使配置 `serverExternalPackages` 也没用。
**铁律**：
- **服务端密码加密用 `bcryptjs`（pure JS）**，不要用 `@node-rs/bcrypt` / `bcrypt`（npm 包） / `argon2` 等 native binding
- 如果未来要切回原生加密，必须先验证 Turbopack 支持，或者把 build 强制切回 webpack（`next build --webpack`）
- bcryptjs 性能差 ~10x，但登录已有 Redis 账号级退避保护，性能不是攻击面

### CI/CD 部署链路的痛苦教训
- **`docker/build-push-action@v5` 在 push 失败时会 silent success（绿勾但 image 没 push）**。曾有 5 个 commit 共 3 周时间 deploy "成功" 但 ghcr 上 `:latest` 一字未变。
- **铁律**：任何 push 操作后必须有显式 verify assertion（`docker pull :sha` 或 manifest inspect 对比 image ID），不能信 build action 的退出码
- **GHCR token / package 权限模型很脆**：user-owned package 跟 repo `GITHUB_TOKEN` 默认不绑定，需要在 package settings 显式 Add Repository。即使绑定了，`docker pull` 也可能突然 denied
- **当前结论**：除非有强需求，避免用 GHCR。直接 ECS 本地 build（项目自带 `deploy.sh build` 命令）更稳

### 排错方法论
- **沉没成本陷阱**：改一个地方不 work 不要立刻又改一处再 push 试，要停下来质疑是不是路径错了。今天前后 7 个 commit 修 GHCR 都没用，最后绕过 GHCR 一次性解决
- **先读完所有相关 docs 再动手**：`docs/项目架构与部署说明.md` `docs/阿里云部署指南.md` `docs/管理员使用手册-含运行位置.md` 等部署相关 docs 必须读全。今天因为没读全，3 个小时都在修一条死链路，没意识到项目自带 `deploy.sh` 是原生稳定路径
- **不要假设工具链历史上 work 过**：看到 `.github/workflows/deploy.yml` 不等于它真的部署成功过。要看 commit 历史 + 实际跑结果验证
- **加 verify assertion 比反复猜测更有效**：debug 应该是"先加断言定位"而不是"改一处试一下"

### Native module / monorepo 陷阱
- **napi-rs 包（`@node-rs/*`）的 platform-specific binding 通过 `optionalDependencies` 分发**：`npm install` 在 macOS/Windows 上不会装 linux-musl binding，只有在 alpine container 里跑 `npm ci` 才会装
- Dockerfile 里 `COPY . .` 会把 host 的 `node_modules` 也 copy 进 builder stage，但随后的 `RUN npm ci` 会清空重装——这个流程是对的，**不要跳过 `npm ci` 直接用 host 的 node_modules**
- napi-rs binding 的 `binding.js` 用 try/catch fallback 加载多个备选 native 文件名，这个 pattern 跟 bundler 的 static analysis 冲突 → Turbopack/某些版本 webpack 会编译错
