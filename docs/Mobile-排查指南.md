# Mobile 启动 / 登录 / 开发排查指南

> 本文是票次元 mobile 端（Expo / React Native）启动、登录、开发踩坑的**单一权威源**。CLAUDE.md 通过"📱 Mobile 启动 / 登录排查铁律"section 指向本文。
>
> 出现 mobile 启动失败 / 登录态异常 / build fail 时**第一时间查这里**，已知问题都有诊断 + 修复步骤。

---

## 1. 工具链版本要求

mobile 端依赖的版本必须跟下表对齐。任何 workspace 改动版本前先确认这表，否则 `npm ci` / EAS build 会挂。

| 工具/依赖 | 当前版本 | 来源 | 备注 |
|---|---|---|---|
| **Node.js** | >= 22 | root `package.json` `engines.node` + CI workflow + Dockerfile | 严格 22，不要装 18 |
| **npm** | >= 10 | root `package.json` `engines.npm` | Node 22 自带 |
| **Expo SDK** | 54.0.x | `apps/mobile/app.json` + `package.json` `expo` 字段 | 升 SDK = 大版本变动，要更 Expo Go 客户端 |
| **React Native** | 0.81.5 | root `package.json` `overrides` 强制锁 | 由 Expo SDK 54 决定，**不要单独升** |
| **React** | 19.1.0 | root `package.json` `overrides` 强制锁 | Web / Mobile 必须**完全一致**，否则 hooks 报错 |
| **TypeScript** | ~5.9.2 | apps/mobile/package.json | Mobile / Web / shared 必须同版本 |
| **@types/react** | ~19.1.10 | apps/mobile + apps/web | 两端要一致，Web 用 `~19.1.10` 不是 `^19` |
| **three** | ^0.182.0 | apps/web + apps/mobile（peer dep of @google/model-viewer） | 两端必须一致，删一端会让 web build 挂 |
| **expo-secure-store** | ~15.0.8 | apps/mobile/package.json | 登录 token 存储依赖 |

**改动注意事项**：
- 升 Expo SDK 必须同步升 React Native（被 SDK 锁死）+ root overrides + 所有 expo-* 子模块
- 升 React 必须同步升 React Native + Web 端 + shared 包 + root overrides
- 升 typescript 必须三个 workspace（web/mobile/shared）+ root 同时升

---

## 2. 首次启动流程

### 一次性环境准备
```bash
# 1. 装 Node 22（推荐 nvm / fnm）
nvm install 22
nvm use 22
node -v  # v22.x

# 2. 装 Expo CLI（项目内的也够用，不强求全局）
npm i -g eas-cli  # 仅 build 时需要

# 3. 装 Expo Go 客户端（手机扫码用）
#    - iOS: App Store 搜 "Expo Go"
#    - Android: Google Play / 国内 expo 官方 apk 下载
#    版本必须跟 app.json 的 expo SDK 对齐（SDK 54 → Expo Go 必须支持 SDK 54）
```

### 项目首次启动
```bash
# 在 root 装依赖（npm workspaces 会 hoist 到 root/node_modules）
cd /path/to/piaoyuzhou
npm install      # 装 root + apps/web + apps/mobile + packages/shared

# 配 mobile env（首次必做）
cd apps/mobile
cp .env.example .env
# 编辑 .env 设 EXPO_PUBLIC_API_URL，开发环境一般指本机 ip 或 localhost
# 例：EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
# **千万不要**留空 / 默认 prod，否则会指向 piaociyuan.com 而本地服务 401 全挂

# 启 web 后端（mobile 调它的 API）
# 在另一个 terminal:
cd ../web
npm run dev      # localhost:3000

# 启 mobile
cd apps/mobile
expo start       # 出二维码，手机 Expo Go 扫码
```

### Expo Go vs EAS build 什么时候用什么
| 场景 | 用法 |
|---|---|
| **日常开发 / 改 JS / 看 UI** | `expo start` + Expo Go 扫码。热重载快 |
| **改 native 模块 / 加新 expo plugin / Universal Links / 推送配置** | EAS build dev profile（`npm run build:dev`），出来一个 standalone dev client apk/ipa |
| **测试 release 包** | `npm run build:preview` → 内测分发 |
| **上架 App Store / Google Play** | `npm run build:production` + `npm run submit:*` |

> Expo Go 不支持自定义 native 模块。改了 `app.json` 的 plugins / native config 后必须重新 EAS build。

---

## 3. 常见问题清单（按发生频率）

> 每条 = 症状 + 诊断命令 + 修复

### 3.1 ⚡ API_URL 指向错误环境（登录看似成功但接口 401）

**症状**：
- 登录页输完手机号验证码点登录，没报错，但 home 页转圈或 401 弹窗
- 后端日志看不到登录请求（因为打到了 prod 不是本地）

**诊断**：
```bash
cd apps/mobile
cat .env | grep EXPO_PUBLIC_API_URL
# 没输出 = .env 缺失 → 走默认（可能是 prod）
```

**修复**：
1. 创建 `apps/mobile/.env`：
   ```
   EXPO_PUBLIC_API_URL=http://<本机 IP>:3000
   ```
   本机 IP：mac/linux `ifconfig | grep inet`，windows `ipconfig`
2. `expo start --clear`（不 --clear 不读新 .env）

### 3.2 ⚡ Expo Go 版本不匹配 SDK（启动闪退 / "Module not found"）

**症状**：
- 扫码后 Expo Go 闪退，或 "JavaScript Bundle could not be loaded"
- 报错 `Cannot find module 'react-native/...'` 或类似 native module

**诊断**：
```bash
grep '"expo"' apps/mobile/package.json
# 例 "expo": "~54.0.34" → 需要支持 SDK 54 的 Expo Go
```
然后看 Expo Go 启动屏的 "SDK 支持" 是否包括项目 SDK。

**修复**：
- 卸载旧 Expo Go → 装最新版（App Store / Play）
- 国内 Android 装不上 Play 版的：去 expo.dev 官网下 apk

### 3.3 ⚡ Metro cache 污染（改代码不生效 / shared 包找不到）

**症状**：
- 改了文件保存没热更新，或 toast "shared not found"
- 删了一个 import 但运行时还在用旧版

**诊断**：
```bash
ls apps/mobile/.expo  # 看是否有 packager-info.json 等 stale 文件
```

**修复**：
```bash
cd apps/mobile
rm -rf .expo node_modules/.cache
expo start --clear   # 强制 Metro 重建 cache
```

### 3.4 ⚡ SecureStore 权限缺失（登录后刷新自动登出）

**症状**：
- 第一次登录成功，关 app 重开后又跳回登录页
- `AuthContext.checkAuth()` 拿不到 token

**诊断**：
打开 Metro logs，看启动时是否报：
```
[SecureStore] Could not access keychain ...
[apiClient] initializeTokens: no token found
```

**修复**：
- iOS：检查 `app.json` 的 `ios.infoPlist` 是否含 `NSFaceIDUsageDescription`（已加）
- Android：检查 `app.json` 的 `android.permissions` 含 `RECEIVE_BOOT_COMPLETED`（SecureStore 用到 keystore）
- 如果是模拟器：iOS 模拟器有时 keychain 损坏，重置模拟器或换设备
- 真机：检查设备是否禁了 keychain 访问（设置 → 隐私 → 启用应用权限）

### 3.5 ⚡ Token refresh 静默失败（启动后 401 loop）

**症状**：
- 启动后所有 API 都 401，但本地 storage 里明明有 token
- 看不到错误弹窗，UI 看起来正常但全是空数据

**诊断**：
Metro logs 看：
```
[apiClient] 401 response, attempting refresh
[apiClient] refreshAccessToken: failed silently
```

**根因**：refresh token 也过期了（默认 30 天），但 `AuthContext` 没正确把 user 状态清掉 → UI 以为还登录着。

**修复**（本批未实现，留 follow-up）：
当前 mobile 的 `AuthContext.checkAuth()` 在 refresh 失败时**应该**把 user 清掉跳登录页。如果发现没清，改 `apps/mobile/src/contexts/AuthContext.tsx` 的 `checkAuth()`：
```typescript
const refreshed = await apiClient.refreshAccessToken();
if (!refreshed) {
  setUser(null);          // ← 关键
  await clearStorage();   // ← 关键
  return;
}
```

临时绕过：用户手动退出登录重新登录。

### 3.6 ⚡ Socket 连接过早（401 loop + reconnect 风暴）

**症状**：
- Metro logs 报满屏 `[socket] connection refused, retrying...`
- 后端日志看到大量 jwt verify failed

**根因**：Socket 在 token 还没装载完就开始连，导致首次 auth fail → 后续 reconnect 都用错误 token。

**修复**（本批未实现，留 follow-up）：
在 `apps/mobile/src/services/socket.ts` 或类似处，确认 socket connect 调用前**等 `apiClient.initializeTokens()` 完成**：
```typescript
await apiClient.initializeTokens();
if (apiClient.hasValidToken()) {
  socket.connect();
}
```

### 3.7 ⚡ TypeScript 类型在 build 才暴露（npm start 通过但 EAS build 挂）

**症状**：
- 本地 `expo start` 一切正常
- EAS build cloud 跑到 typecheck 步骤挂，错误如 `Property 'xxx' does not exist on type 'never'`

**根因**：`expo start` 是开发模式，不严格类型检查；EAS build 默认会跑 `tsc --noEmit`。

**铁律**：每次 commit 前**必须**：
```bash
cd apps/mobile
npx tsc --noEmit
```
没过不能 push。本地 fail = EAS build 100% fail，省 30 min cloud build 时间。

---

## 4. 登录流程内部细节

### `AuthContext.checkAuth()` 调用顺序
1. App 启动 → `AuthProvider` mount → `useEffect(() => checkAuth())`
2. `checkAuth()` 调 `apiClient.initializeTokens()`：从 SecureStore 读 access + refresh token
3. 如果有 access token → 调 `GET /api/auth/me`
4. 如果 401 → 调 `apiClient.refreshAccessToken()` 用 refresh token 换新的 access
5. refresh 成功 → 重试 `/api/auth/me`
6. refresh 失败 → 清 user state，跳登录

### `apiClient.initializeTokens()` 行为
- 从 `expo-secure-store` 读 `access_token` 和 `refresh_token` 两个 key
- 设到 internal state
- **不**触发任何 API 请求
- 失败（store 异常 / token 缺失）→ silent，不抛错

### 401 触发 refreshAccessToken
所有 `apiClient.{get,post,put,patch,delete}` 在拿到 401 时自动调 `refreshAccessToken` 一次。如果还 401 → 把错误返回给调用方。
**不会**自动跳登录页——这是上层（screen）的责任。

### 失败兜底（理想行为）
- refresh fail = 用户得重新登录 → 跳 LoginScreen
- 但避免"刚启动就跳" 的体验：可以保留 cached user state 几秒，让 UI 渲染，后台静默尝试 refresh

---

## 5. 健康检查命令

启动遇到问题先一键过下面这串：

```bash
cd apps/mobile

# 1. 检查 .env
cat .env | grep EXPO_PUBLIC_API_URL
# 应输出非空且不是 prod URL（开发场景）

# 2. 检查 Expo SDK
grep '"expo"' app.json
# 应是 ~54.0.x

# 3. 检查 node 版本
node -v
# 应是 v22.x

# 4. 清 metro cache（必跑）
rm -rf .expo node_modules/.cache

# 5. 强制无缓存启动
expo start --clear

# 6. 全量 typecheck
npx tsc --noEmit
# 应无输出 / 0 error

# 7. 测后端连通性
curl http://<你的 EXPO_PUBLIC_API_URL>/api/health
# 应回 {"ok":true,...}
```

---

## 6. 调试技巧

### Android 真机：adb logcat 过滤
```bash
adb devices                                  # 列设备
adb logcat -c                                # 清旧 log
adb logcat *:E ReactNativeJS:V               # 只看 error 和 RN js
adb logcat | grep -i piaociyuan              # 过滤 app 包名
```

### Expo DevTools 网络面板
- `expo start` 后按 `m` 打开开发菜单，或摇手机
- 浏览器开 React DevTools 看 component tree
- Network 面板看每个 API 请求的 status / headers / body

### SecureStore 失败 fallback 到 AsyncStorage（参考实现）
当前实现：登录 token 一律走 SecureStore。如果项目后续需要降级，参考 pattern：
```typescript
async function safeSetItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn('[storage] SecureStore failed, fallback to AsyncStorage', e);
    await AsyncStorage.setItem(`fallback_${key}`, value);
  }
}
```
**注意**：fallback 后安全性下降，不建议生产用——理想方式是先排查 SecureStore 为啥失败。

### Metro 跑端口冲突
默认 8081 端口。被占了：
```bash
EXPO_DEV_SERVER_PORT=8082 expo start
# 或杀进程
lsof -ti:8081 | xargs kill -9    # mac/linux
netstat -ano | findstr :8081      # windows 看 PID 再 taskkill /F /PID xxx
```

---

## 7. EAS Build 注意事项

### eas.json 配置
- `development` profile：含 dev client，可以连本机 metro
- `preview` profile：internal distribution，可装真机但不上 store
- `production` profile：上 store 用，签名 + 优化

### Build 前必做
```bash
cd apps/mobile

# 1. typecheck 必须过
npx tsc --noEmit

# 2. 看 app.json 的 version / runtimeVersion 是否需要 bump
#    iOS App Store / Google Play 必须比上一版高

# 3. 看 eas.json 的 ios.bundleIdentifier / android.package 是否正确
```

### 国内网络下载 Expo Go runtime
- EAS build 在 cloud 跑，不受国内网络影响
- 但**本地 `expo start` + Expo Go 客户端**首次下载 JS runtime 可能慢 / fail（CDN 国内不稳）
- 解决：要么挂代理，要么用 dev client（local build），不依赖 Expo Go runtime

---

## 8. 已知 follow-up（本批未做的改动）

下面是排查过程中发现但**本批没改代码**的优化项，记下来等下次专门处理：

1. **Token refresh 失败时 graceful degradation**（参 3.5）：当前 mobile 的 `AuthContext.checkAuth()` 在 refresh 失败时可能没正确清 user state
2. **API_URL 启动时校验**：建议在 `apiClient` 构造时检查 `EXPO_PUBLIC_API_URL` 是否为空 / 是否合法 URL，否则 console.warn 醒目提示
3. **Socket 连接时机**（参 3.6）：socket connect 应等 token 装载完成
4. **登录表单 maxLength / regex 校验**：手机号 11 位、验证码 6 位等基础校验在 mobile 端不够严
5. **EAS build 前 hook**：考虑在 eas.json 的 `prebuild` 加 `npx tsc --noEmit` 强制 typecheck
