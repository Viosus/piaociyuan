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

### Next.js 16 client/server 模块边界（2026-05-02 新增）
**症状**：CI build 在 `npm run build` 阶段挂，错误：
```
You're importing a component that needs "next/headers". That only works in a Server Component
Import traces:
  Client Component Browser:
    ./apps/web/lib/auth.ts [Client Component Browser]
    ./apps/web/app/auth/login/page.tsx [Client Component Browser]
```

**原因**：Next.js 16 + Turbopack 做严格的 client/server 静态分析。任何 `"use client"` 组件 import 的模块**整个 transitive 链**不能含 server-only 依赖（`next/headers`、`prisma`、`fs`、`server-only` 等）。曾有 W-F1 让 client 页面 import `@/lib/auth` 拿 `isValid*` 校验函数，但 `lib/auth.ts` 顶部 `import { headers } from 'next/headers'` 导致整个文件被标记 server-only → build fail。

**铁律**：
- **`"use client"` 文件绝对不要 import `@/lib/auth` / `@/lib/prisma` / 其他 server lib**
- 纯函数（校验器、格式化器、常量等）放 `lib/validators.ts`、`lib/format.ts` 这种 zero-dep 文件，client/server 都安全
- **新增 lib 文件前先想**：是 server-only（有 next/headers / prisma / 文件系统）还是 universal（纯函数 / 类型）？两类不能混在同一个文件
- **既有 lib 重构**：如果发现 mixed 文件，把 universal 部分拆出去，server 文件 re-export 保持 server caller 兼容
  示例：`lib/auth.ts` 含 server function `getCurrentUser()` 和纯函数 `isValidEmail()`。重构成：
  - `lib/validators.ts` → 纯函数（client/server 共用）
  - `lib/auth.ts` → 保留 server function + `export { isValidEmail } from './validators'`（向后兼容旧 server caller）
- **怎么判断一个 lib 文件是 server-only**：看顶部 imports，含以下任一就是 server-only：
  - `next/headers`、`next/cookies`、`next/server`（除了 `NextRequest/NextResponse` 在 route 用 OK）
  - `prisma` / `@/lib/prisma`
  - `fs`、`path`、`crypto` 的 node 内置版（不是 web crypto）
  - `import 'server-only'` 显式标记
  - `process.env.SOMETHING`（实际上只在 server 跑也算运行时 server-only）

**早期发现**：每次写完新代码本地跑 `cd apps/web && npm run build`（不是 typecheck，是真正的 build）能立即捕获这类错误。typecheck 不会捕获——它只看类型不看 client/server 边界。

### 删依赖前必须真 build 验证（2026-05-02 新增）
**踩坑**：删 `@google/model-viewer` 时用了 `grep -rE "from ['\"]@google/model-viewer|require\(['\"]@google/model-viewer"` 验证 0 引用 → 但漏了 `Model3DViewer.tsx:31` 里的**动态 import**：
```ts
import('@google/model-viewer')   // 函数调用形式，没有 from / require
```
ECS 上 `next build` 直接 fail：`Module not found: Can't resolve '@google/model-viewer'`。

**铁律**：
- 删任何 dep 前的 grep **必须覆盖所有 import 形态**：
  ```bash
  # 正确的全形态 grep
  grep -rE "['\"\`]<package-name>['\"/]" apps/web --include='*.ts' --include='*.tsx' --include='*.js'
  ```
  匹配任何 quote 后跟包名（`'pkg'` `"pkg"` `` `pkg` `` `'pkg/sub'` 等），覆盖：
  - `import x from 'pkg'`
  - `import('pkg')` ← 之前漏的动态 import
  - `require('pkg')`
  - `require.resolve('pkg')`
  - `declare module 'pkg' {}` ← 类型声明也算引用，需要保留

- **typecheck 不捕获 bundling 错误**——`npm run build` 才行
- **删 dep + 改 lib 边界 + 任何动到 import / module resolution 的改动**，commit 前**必须本地跑 `cd apps/web && npm run build`** 验证不报错（5-10 分钟，远比 ECS CI 跑一次 + 修补一次 + push 再跑一次的循环短）

### 多 session 并行协作（2026-05-02 新增）

### 多 session 并行协作（2026-05-02 新增）
本项目可能多个 Claude session 同时跑（用户在不同 terminal 起多个 `claude`）。冲突防范：

- **commit 前必跑** `git status` + `git fetch origin` + `git log HEAD..origin/main`，确认远端有没有新 commit / 本地有没有别的 session 的 uncommitted 改动
- **stage 文件用 explicit path**（`git add path/file1 path/file2`），**不要** `git add -A` 或 `git add .`——会把别的 session uncommitted 改动也带走
- **commit 前再次 `git diff --cached --stat`** 确认只 staged 自己改的文件
- **push 前再 `git fetch && git rebase origin/main`**（如果 remote 有新）。如果 rebase 报冲突 → 别瞎解，告诉用户让两个 session 协调
- **每次 push 后告诉用户**："push 完成（commit XXX），让另一个 session `git pull --rebase origin main` 拿到我这边改动"
- **改 client/server 边界文件**（`lib/auth.ts`、共享 components、layout 等）前 grep 一下其他 session 的工作区文件有没有引用，影响范围大的话先跟用户对一下
