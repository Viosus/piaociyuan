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
- **Node.js**: >= 22.0.0（CI workflow `setup-node@v5` 用 22 + Dockerfile `FROM node:22-alpine` 都对齐）
- **npm**: >= 10.0.0（Node 22 自带 npm 10）
- **包管理**: npm workspaces

### 核心依赖版本 (已锁定，勿随意更改)
| 依赖 | 版本 | 说明 |
|------|------|------|
| react | 19.1.0 | Web 和 Mobile 统一版本 |
| react-dom | 19.1.0 | Web |
| react-native | 0.81.5 | Mobile |
| next | ^16.1.1 | Web 框架 |
| expo | ~54.0.30 | Mobile 框架 |
| three | ^0.182.0 | 3D 渲染（Web 直用 + Mobile 留作 @google/model-viewer 的 peer dep） |
| @google/model-viewer | ^4.1.0 | 3D 模型查看器 |
| @types/react | ~19.1.10 | Web / Mobile 统一类型版本（不要写 `^19`，会和 mobile drift） |
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

## 📱 Mobile 启动 / 登录排查铁律（2026-05-11）

详见 [`docs/Mobile-排查指南.md`](docs/Mobile-排查指南.md)。**必读 5 条**：

1. **API_URL 必须显式 .env**：`apps/mobile/.env` 必须含 `EXPO_PUBLIC_API_URL`，否则静默用 prod。`cp .env.example .env` 是首次启动必做
2. **Expo Go 版本必须匹配 SDK**：扫码闪退多半是 Expo Go 跟 `app.json` 的 expo SDK 不对齐 → 卸载 Expo Go 重装最新
3. **改 mobile 代码 + 看不到效果 → 必须 `expo start --clear`**：Metro cache 污染极常见
4. **登录态自动登出 = SecureStore 权限问题**：检查 app.json android.permissions / iOS Info.plist
5. **`npx tsc --noEmit` 必须先过**：本地 `npm start` 不查类型，EAS build 才查，build 挂会浪费 30 分钟

新 mobile 启动/登录/build 错误**必须**同步写进 `docs/Mobile-排查指南.md` 第 3 章常见问题清单。

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

## 📋 测试流程的元规则（2026-05-03 用户明确要求）

所有手动测试流程（场景、checklist、入口、期望效果）的**单一权威源**是
[`docs/手动测试流程.md`](docs/手动测试流程.md)。本 CLAUDE.md 不保存测试细节。

**ship 新功能时必须同步更新该文件**：
- 在"已 ship 的功能测试入口"表格加新行（改动 ID / 测试入口 / 期望效果）
- 如新增 seed 数据 → 同步改 `apps/web/scripts/seed-test-data.js` + `docs/测试数据使用说明.md`
- 如改 admin 流程 → 同步改 `docs/admin-功能测试清单.md`
- 如改跨端共享逻辑 → 同步改 `docs/Web-Mobile功能对齐审计.md`
- 如新增 P0 冒烟级流程 → 同步改 `docs/冒烟测试清单.md`

漏更新算 ship 不完整。未来 session（包括其他 Claude 实例）通过 `docs/手动测试流程.md` 找到该测什么，没列出的功能视为"未交付"。

测试流程的细分清单（冒烟 / 回归 / 跨端 / admin / 一致性）已分别独立成
文件，新增清单时也加入 `docs/手动测试流程.md` 的"测试分类"章节。

---

## ⚠️ 不得再犯的错误

> **元规则**（2026-05-02 用户明确要求）：但凡部署、build、运行时发生的错误，**修复后必须立即把诊断 + 根因 + 修复 + 验证流程总结成一条新章节**写入本节。目的：让未来 session（包括其他 chat / 其他 Claude 实例）启动时通过 CLAUDE.md 自动加载这些教训，不再重复踩坑。新错误总结模板：
> - **症状**：用户看到的现象 + 关键日志/错误信息
> - **根因**：技术上为什么发生（一句话能讲清）
> - **铁律 / 修复**：以后该怎么避免 / 该怎么修

---

### 2026-05-01 总结

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
**踩坑 1**：删 `@google/model-viewer` 时用了 `grep -rE "from ['\"]@google/model-viewer|require\(['\"]@google/model-viewer"` 验证 0 引用 → 但漏了 `Model3DViewer.tsx:31` 里的**动态 import**：
```ts
import('@google/model-viewer')   // 函数调用形式，没有 from / require
```
ECS 上 `next build` 直接 fail：`Module not found: Can't resolve '@google/model-viewer'`。

**踩坑 2**（更糟）：删 `three` 时项目代码 0 引用确实 → 但 `three` 是 `@google/model-viewer` 的 **peerDependency**，删了之后 `npm ci` 不再装 three → model-viewer 的内部模块 `import { Mesh, ... } from 'three'` 全部 404 → CI build 挂上千行错误。本地 `npm run build` 当时 PASS 因为本地 `node_modules` 还有 three 的残留（npm install 不激进 prune）。

**铁律**：
- 删任何 dep 前的 grep **必须覆盖所有 import 形态**：
  ```bash
  # 正确的全形态 grep
  grep -rE "['\"\`]<package-name>['\"/]" apps/web --include='*.ts' --include='*.tsx' --include='*.js'
  ```
  匹配任何 quote 后跟包名（`'pkg'` `"pkg"` `` `pkg` `` `'pkg/sub'` 等），覆盖：
  - `import x from 'pkg'`
  - `import('pkg')` ← 容易漏的动态 import
  - `require('pkg')`
  - `require.resolve('pkg')`
  - `declare module 'pkg' {}` ← 类型声明也算引用，需要保留

- **检查 peerDependencies**：如果某个 dep 是其他 dep 的 peerDependency，即使你的代码 0 引用也**不能删**。命令：
  ```bash
  for pkg in $(ls apps/web/node_modules/ apps/web/node_modules/@*/); do
    grep -l "<候选删除包名>" "$pkg/package.json" 2>/dev/null
  done
  ```
  或更直接：删之前先看 `apps/web/node_modules/<候选包>/package.json` 里有没有别的包列它为 peerDependency。

- **typecheck 不捕获 bundling 错误**——`npx tsc --noEmit` 只看类型不看模块解析，必须 `npm run build`

- **本地 `npm run build` 也不可信**！原因：本地 `node_modules` 可能含已删 deps 的残留。要真 mirror CI 必须先**清空 node_modules 再装再 build**：
  ```bash
  # 删 dep / 改 import / 改 module resolution 后必跑：
  rm -rf node_modules apps/*/node_modules packages/*/node_modules
  npm install
  cd apps/web && npx prisma generate && npm run build
  ```
  这一套等价 ECS CI 的 Docker build。15 分钟，但远比 push → CI 跑 15 分钟 → 失败 → 修补 → 再 push 的循环快。

### npm workspace lockfile drift（2026-05-02 新增）
**症状**：CI 在 `npm ci --legacy-peer-deps` 之后 `next build` 报 `Module not found: Can't resolve 'three'`，但本地 `npm run build` PASS。检查 lockfile 发现 `"three":` 同时有 `"^0.172.0"` 和 `"^0.182.0"` 两个版本声明（之前删 dep 又加回来时 incremental npm install 没清干净）。

**根因**：incremental `npm install`（特别是反复加/删 dep 时）可能让 `package-lock.json` 出现 stale 引用。`npm ci` 在 CI 上严格按 lockfile 装，drift 的 lock 会产生跟本地 `npm install`（更宽松）不一致的 node_modules tree → 模块解析失败。

**铁律**：任何**删/加 dep** 操作后必须**重新生成 lockfile**：
```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules package-lock.json
npm install                                        # 生成全新 lock
cd apps/web && npx prisma generate && npm run build # 验证
```
然后才能 commit lockfile 推送。**不要**信任 incremental install 后的 lock。

### 本地"npm run build" 不能 mirror CI（2026-05-02 新增）
**症状**：今天反复出现"本地 npm run build PASS 但 ECS CI build fail"，主要原因有 3 类：
1. **OS 差异**：Windows/macOS 的 npm workspace hoisting 跟 Linux/Alpine musl 不同 → 同一个 lockfile 装出不同 node_modules tree
2. **typecheck 差异**：tsserver 在 Windows 跟 Linux 上对某些 callback 推导不同（如 `(provided) =>` from @hello-pangea/dnd 在 Windows 推断成功，Linux 报 implicit any）
3. **node_modules 残留**：`npm install` 不激进 prune，本地 node_modules 可能有已删 deps 残留，build 还能 work；CI `npm ci` clean install 没残留就挂

**铁律**：**本地必须用 `docker compose build web` 做最终验证**（要求 Docker Desktop 运行）。这一条命令同时覆盖 OS、TS、模块解析所有差异，是**唯一**跟 CI 100% 等价的本地验证。
```bash
# 任何修改 deps / lib 边界 / 共享组件 / build 配置后的最终验证：
docker compose build web         # ~10 min，跟 CI 100% 等价
```
本地 `npm run build` 只能作为**快速 sanity check**，不能 ship。

不愿意每次都跑 docker build 也无所谓——但要明白每次 push 没 docker 验证 = 概率性 CI fail + 一次 ECS deploy 周期延误（~6 min/次）。3 次 fail 的累计成本 > 一次 docker build 的成本。

### Docker compose 容器名冲突 + 异步删除 race（2026-05-02 新增）
**症状 A**：CI deploy 阶段挂在 `docker compose up -d web`：
```
Conflict. The container name "/<hash>_piaociyuan-web" is already in use
by container "<other_hash>". You have to remove (or rename) that container.
```

**症状 B**（先修了 A 但又出现的）：
```
Error response from daemon: removal of container <hash> is already in progress
```

**根因**：
- A：docker compose 异常退出 / rename 留下带前缀的僵尸容器（前缀 `<hash>_` 是 rename 痕迹），顶占了主容器名
- B：`docker rm -f` 是**异步触发**的，命令返回成功但 daemon 实际清理可能 1-3s 才完成。这期间 docker compose up 撞上 "removal in progress"

**症状 C**（B 修了之后又出现的、最隐蔽的一种）：上面的轮询在 14 次后报 `✓ all piaociyuan-web containers cleaned up`，但下一秒 `docker compose up -d web` 仍报：
```
Conflict. The container name "/piaociyuan-web" is already in use by container "befffe1b5d2..."
```
而 `befffe1b5d2` 的 ID 跟 compose 当前正要 create 的 ID 一样——说明 daemon 自己在 create 过程中跟自己撞名。

**根因 C**：`docker rm -f` 在 daemon 端有**两层**异步：
- 第一层：容器对象从 `docker ps -a` 中消失（毫秒级）
- 第二层：name reservation / namespace / cgroup / 网络栈完全释放（可能 5-30s）

`docker ps -a` 只反映第一层；polling 通过后 daemon 仍可能持有 name 锁。这时 `docker compose up` 的 create 调用拿到了 ID（namespace 创建得逞），但 daemon 在写入 name → ID 映射时撞上残留的旧 reservation，错误信息把"残留 reservation 的所属 ID"误显示为新 create 的 ID（实际是 daemon 内部 race），用户看到一头雾水。

**症状 D**（C 修了之后又出现的，第四种变种）：把"手动 rm + polling"换成 compose-aware 的 `docker compose rm -f -s web` 之后，下一秒 `docker compose up --force-recreate` 仍报：
```
Error response from daemon: removal of container 19c604cbad07... is already in progress
```
这次是 daemon 自己在异步处理 rm 还没结束就被告知"再 create 同名"。

**根因 D**：`docker compose rm -f -s web` 返回的"成功"是 **"API 接受请求"** 不是 **"删除完成"**。daemon 的实际清理是异步管道（关网络 / 卸载文件系统 / 释放 cgroup / 解除名字 reservation），可能 5-30 秒。compose 自己的 `--force-recreate` 内部也是 stop → rm → create 三连，第三步触发时 daemon 还在做第二步收尾，于是撞上"removal in progress"。

**最终铁律（症状 A→B→C→D 累计教训）**：用 `docker stop` + `docker wait` + `docker rm` + `docker inspect` 做四段同步等待，让 shell 真的看到 daemon 端清干净再进入 `up`：
```bash
container_id=$(docker ps -aq --filter "name=piaociyuan-web" | head -1)
if [ -n "$container_id" ]; then
  docker stop -t 30 "$container_id" 2>/dev/null || true
  # docker wait 阻塞直到容器进入 exited 状态——daemon 端真停了，不是异步触发
  docker wait "$container_id" 2>/dev/null || true
  docker rm -f "$container_id" 2>/dev/null || true

  # docker inspect 失败 = 对象彻底从 daemon 状态机消失（比 docker ps 更靠谱）
  for i in $(seq 1 30); do
    if ! docker inspect "$container_id" >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi

# 游离容器（rename 残留 / 异常退出留下的带前缀僵尸）也清
stragglers=$(docker ps -aq --filter "name=piaociyuan-web")
if [ -n "$stragglers" ]; then
  echo "$stragglers" | xargs -r docker rm -f 2>/dev/null || true
  sleep 3
fi

docker compose up -d --force-recreate --remove-orphans web
```

**关键点**：
- `docker wait` 是阻塞调用，daemon 端容器真正进入 exited 之前不返回——这是 shell 唯一能"看到"daemon 完成停止的方式
- `docker inspect <id>` 失败（exit != 0）= 对象在 daemon 状态机里彻底没了——这比 `docker ps -a` 更晚，因为 ps 在对象 marked-for-removal 时就已经不显示，而 inspect 会一直能查到直到清理完毕
- `|| true` 兜底首次 deploy 没旧容器时 `set -e` 不误终止
- **不要再相信 `docker compose rm -f -s` 单独能给后续操作让出干净状态**——它跟 `docker rm -f` 一样是异步触发，不是同步等待

**症状 E**（A→B→C→D 全都解决了之后还有的最后一个变种）：cleanup 完美——`docker stop` + `docker wait` + `docker rm` + `docker inspect` 轮询确认容器消失（实测 19s）——下一秒 `docker compose up -d --force-recreate web` 仍报：
```
Container piaociyuan-web Creating
Error response from daemon: Conflict. The container name "/piaociyuan-web" is already in use by container "3de92db41f1a..."
```
而 `3de92db41f1a` 这个 ID 在 cleanup 时还不存在（cleanup 删的是另一个 ID）。

**根因 E**：docker compose v2 的内部 race。compose CLI 在 `up --force-recreate` 时大致流程：
1. 检查 service 是否存在
2. 调 daemon API 创建容器，daemon 给新 ID 例如 `3de92db41f1a`
3. compose CLI 自己再做"recreate"分支：尝试再创建一次 / rename 一次 → 撞上自己刚创建的 → daemon 报"name in use by 3de92db41f1a"
4. compose CLI exit 非零，但 daemon 端容器其实已经创建成功，甚至 running

这是 compose 自己跟 daemon 状态同步的 bug，不是我们脚本错。

**解法（最终）**：把 compose up 失败当成可能是 false-alarm，校验 daemon 端实际状态：
```bash
compose_up() {
  docker compose up -d --force-recreate --remove-orphans web
}

if ! compose_up; then
  # 看 daemon 端实际有没有跑
  if docker ps --filter "name=piaociyuan-web" --filter "status=running" -q | grep -q .; then
    echo "✓ compose CLI 误报，daemon 端 container 已在跑，继续"
  else
    # 真没跑：按 container_name 暴力删 + 重试一次
    docker rm -f piaociyuan-web 2>/dev/null || true
    sleep 8
    compose_up || exit 1
  fi
fi
```
关键洞见：**`docker compose up` 的 exit code 不可信**。判定 deploy 是否成功要看 daemon 端容器是否在 running 状态，再加后续 health check。

A→E 五种变种走完，至此 deploy 链路对 docker / compose 的所有已知 race 都有兜底。

**症状 E 续**（在 ff6012c 兜底前的最后一个故障案例）：ace060a 的 deploy 看到 `No existing piaociyuan-web container, skip cleanup`（`docker ps -aq --filter name=piaociyuan-web` 返回空），但下一秒 compose up 仍报 ID `3de92db41f1a` 占用 name——这个 ID 正是上一次 failed deploy（e00ae70）创建后没清理留下的 **ghost container**。daemon 的 name registry 持有 → ID 映射，但 container 对象在某种部分初始化态下不在 `docker ps -a` 里显示。

**新增兜底（彻底）**：在 cleanup 流程开头加一个 idempotent 的 `docker rm -f piaociyuan-web`（按 name 而非 ID）。daemon 会自己按 name 解析到 ghost ID 并清掉；没 ghost 就 silent no-op：
```bash
# Pre-emptive name-based force rm（ghost cleanup）
docker rm -f piaociyuan-web 2>/dev/null || true
sleep 2

# 然后才走正常 ps -a 查找 + stop + wait + rm + inspect 流程
container_id=$(docker ps -aq --filter "name=piaociyuan-web" | head -1)
...
```

**铁律**：`docker ps -a` ≠ daemon name registry。要清干净一个名字，按 name 强删比按 ID 强删更可靠（ID 强删要求你能列出 ID，name 强删交给 daemon 自己解析）。

### npm workspace hoisting：peer dep 必须能被 root 包找到（2026-05-02 新增）
**症状**：上面的 three 案例还有一层 hoisting 微妙：删了又加 three 后，CI 的 `npm ci` 把 `three` 装在 `apps/web/node_modules/three`，但 `@google/model-viewer` 的 transitive dep `@monogrid/gainmap-js` 被 hoist 到 root `/node_modules/@monogrid/`。从 `/node_modules/@monogrid/gainmap-js/` 走 Node 模块解析找不到 `apps/web/node_modules/three`（属于另一棵子树）。

**根因**：npm workspace hoisting 的非确定性。当某个根级 package（被 hoist 到 root）的 peer dep 只在 child workspace 装了，模块解析会失败。

**修复**：重新生成 lockfile 后 `three` 同时出现在 root `/node_modules/three` 和 `apps/web/node_modules/three`（lockfile-based determinism）→ root 的 @monogrid 也能找到。

**铁律**：当一个 transitive dep（像 model-viewer 这种带 peer dep 的）出问题，先看 lockfile 是否干净。如果 lockfile 没问题但 hoisting 还诡异，把那个 peer dep 也加到**根 package.json** 强制 hoist 到 root：
```json
// 根 package.json
{
  "dependencies": {
    "three": "^0.182.0"  // 强制 root level
  }
}
```

### 多 session 并行协作（2026-05-02 新增）

### 多 session 并行协作（2026-05-02 新增）
本项目可能多个 Claude session 同时跑（用户在不同 terminal 起多个 `claude`）。冲突防范：

- **commit 前必跑** `git status` + `git fetch origin` + `git log HEAD..origin/main`，确认远端有没有新 commit / 本地有没有别的 session 的 uncommitted 改动
- **stage 文件用 explicit path**（`git add path/file1 path/file2`），**不要** `git add -A` 或 `git add .`——会把别的 session uncommitted 改动也带走
- **commit 前再次 `git diff --cached --stat`** 确认只 staged 自己改的文件
- **push 前再 `git fetch && git rebase origin/main`**（如果 remote 有新）。如果 rebase 报冲突 → 别瞎解，告诉用户让两个 session 协调
- **每次 push 后告诉用户**："push 完成（commit XXX），让另一个 session `git pull --rebase origin main` 拿到我这边改动"
- **改 client/server 边界文件**（`lib/auth.ts`、共享 components、layout 等）前 grep 一下其他 session 的工作区文件有没有引用，影响范围大的话先跟用户对一下
