# 微信小程序（apps/wechat）路线图

> 票次元四端架构（网页 + 安卓 + 苹果 + 微信小程序）。本文是微信小程序端从 0 到上架的**完整 phase 计划**和**设计决定记录**。新批次基于本文推进，每完成一 phase 更新对应 ✅ 状态 + commit hash。

---

## 1. 架构定位

### 1.1 四端并存
| 端 | 路径 | 技术栈 | 共用 |
|---|---|---|---|
| 网页 | `apps/web/` | Next.js 16 + React 19 + Prisma | 后端 API（116 routes）|
| 安卓 | `apps/mobile/` | Expo SDK 54 + React Native 0.81.5 | 同上 |
| 苹果 | `apps/mobile/` | 同上（Expo 跨端） | 同上 |
| 微信小程序 | `apps/wechat/` | Taro 4.0.9 + React 19 → wxml/wxss/js | 同上 |

**关键约束**：
- 后端 `apps/web/app/api/*` 是**唯一权威源**，所有客户端走 HTTPS 调它
- 数据库 schema 在 `apps/web/prisma/schema.prisma`，所有端共用
- 各端独立 build / deploy / 发布 — 互不影响

### 1.2 为什么是 Taro（不是 webview / uni-app / 原生）

考虑过 4 个方案：

| 方案 | 工作量 | 用户体验 | 选/弃 |
|---|---|---|---|
| WebView 壳 | 1-2 周 | 跟网页一样，无 wx.pay / wx.scanCode | ❌ 弃（用户要原生体验，要 wx.pay） |
| 原生 wxml/wxss | 12+ 周 | 最原生，但完全重写 | ❌ 弃（成本太高，跟 React 体系脱钩） |
| uni-app（Vue） | 8-10 周 | 原生，但项目用 React | ❌ 弃（团队 React 体系） |
| **Taro 4（React）** | **8-12 周** | **原生 + 复用 React 思路** | ✅ **选** |

---

## 2. 完整路线图（10 周，6 Phase）

| Phase | 范围 | 估时 | 状态 | commit |
|---|---|---|---|---|
| **0** | Taro 脚手架 + project.config.json + hello world | 0.5 周 | ✅ | `4ace5a7` |
| **1** | wx.login + API/Storage adapter + tab 导航 + 5 个只读 tab 页 | 2 周 | ✅ | `4ace5a7` |
| **2a** | 活动详情 + 用户主页 + 关注/粉丝列表 + 路线图文档 | 1 周 | ✅ | _（本批，见 git log）_ |
| **2b** | Encore（帖子+评论+点赞）+ Signals 分类广场 + 收藏 + 设置 | 1.5 周 | ⏳ | — |
| **3** | 消息：私聊会话 + 群聊 + Taro.connectSocket + 图片消息 | 2 周 | ⏳ | — |
| **4** | 票务 + 支付：票列表 / 详情 / QR / 转赠 / wx.requestPayment V3 | 2 周 | ⏳ | — |
| **5** | 收藏品 / 分享 / 扫码核销 / 分包优化 / 提交审核 | 1 周 | ⏳ | — |

---

## 3. Phase 0 ✅ — 脚手架

**commit**：`4ace5a7`

已交付：
- `apps/wechat/` 新 workspace（npm workspaces 走 `apps/*` glob）
- Taro 4.0.9 + React 19.1.0 + TypeScript 5.9.2（跟 root overrides 对齐）
- `project.config.json`（AppID 占位，等用户手填）
- `config/{index,dev,prod}.ts`、`babel.config.js`、`tsconfig.json`、`global.d.ts`
- root `package.json` 加 scripts `dev:wechat` / `build:wechat`
- 跟 root overrides 兼容（React 19、不动 react-native 锁）

---

## 4. Phase 1 ✅ — Auth + 5 个只读 tab 页

**commit**：`4ace5a7`

### 4.1 后端
- **新 endpoint** `apps/web/app/api/auth/wechat-login/route.ts`：
  - 调微信 `jscode2session`（需要 `WX_APPID` + `WX_SECRET` 环境变量）→ openid
  - 查/建 `User.wechatOpenId` 用户（schema 此字段早已存在，无需 migration）
  - 复用 `lib/auth.ts` 的 `generateTokenPair` + `lib/session.ts` 的 `createUserSession`
- **`.env.example`** 加 `WX_APPID` / `WX_SECRET` 配置说明

### 4.2 Taro 端服务封装
- `services/storage.ts` — 包 `Taro.setStorageSync`，接口对齐 mobile
- `services/api.ts` — 包 `Taro.request`，401 自动 refresh，refresh 失败跳 login
- `services/auth.ts` — `loginWithWechat()`：`Taro.login()` → `/api/auth/wechat-login` → 存 token

### 4.3 公共组件
- `components/Avatar.tsx`
- `components/Card.tsx`
- `components/Empty.tsx`
- `components/Toast.ts`（包 `Taro.showToast`）

### 4.4 主题
- `app.scss` 定义 `--foreground` / `--foreground-soft` / `--foreground-faint` / `--primary` 等 CSS 变量，对齐 web 端

### 4.5 5 个 tab 页
| 页 | 路径 | 内容 |
|---|---|---|
| 主页 | `pages/home/index` | 活动列表（瀑布 / 列表）|
| 活动 | `pages/events/index` | 分类筛选（演唱会 / 音乐节 / 展览 / 体育...）|
| 搜索 | `pages/search/index` | 综合搜索（用户 / 帖子 / 活动 三 tab）|
| 消息 | `pages/messages/index` | 占位（Phase 3 上线）|
| 我的 | `pages/me/index` | 个人信息 + 通知入口 + 退出登录 |

### 4.6 登录页
- `pages/login/index`：微信一键登录按钮

---

## 5. Phase 2a ✅（本批） — 活动详情 + 用户主页 + 关注/粉丝

### 5.1 新页（3 个）
| 页 | 路径 | 关键 API |
|---|---|---|
| 活动详情 | `pages/event-detail/index?id=` | `GET /api/events/[id]` |
| 用户主页 | `pages/user-profile/index?id=` | `GET /api/user/[id]` |
| 关注/粉丝列表 | `pages/user-followers/index?id=&type=followers\|following` | `GET /api/user/[id]/{followers\|following}` |

### 5.2 新组件（3 个）
- `EventDetailHeader.tsx` — banner + 名称 + 状态徽章 + 艺人 + 日期/场地
- `FollowButton.tsx` — 乐观更新 toggle，调 `POST/DELETE /api/users/[id]/follow`
- `UserCard.tsx` — 列表行（头像 + 昵称 + bio + FollowButton），点击跳主页

### 5.3 接线
- home / events / search 的活动卡片 → `navigateTo` event-detail
- search 的用户卡片 → user-profile
- me 加"查看我的主页"行 → user-profile
- user-profile 的粉丝/关注数 → user-followers
- user-followers 用 `useReachBottom` 分页

### 5.4 本批 NOT 做
- 帖子列表（属于 Phase 2b 的 Encore）
- 改头像 / 改资料（属于 Phase 2b 的设置）
- 收藏 / Signals 分类广场（Phase 2b）

---

## 6. Phase 2b ⏳ — Encore + Signals + 收藏 + 设置

### 6.1 范围（约 1.5 周）
- **Encore 帖子流** `pages/encore/index`：信息流 + `useReachBottom` 分页
- **帖子详情** `pages/post-detail/index?id=`：帖子内容 + 图片轮播 + 评论 + 嵌套回复
- **评论交互**：发评论 / 回复 / 点赞评论
- **帖子点赞 / 收藏 / 分享** 按钮（点赞用 `POST /api/posts/[id]/like` toggle）
- **Signals 广场** `pages/signals/index`：分类筛选 chip + 活动卡片瀑布
- **收藏** `pages/favorites/index`：三 tab（帖子 / 活动 / 关注），调 `/api/user/favorites` + `/api/user/following`
- **设置** `pages/settings/index`：改昵称 / 改头像（`wx.chooseMedia` + `wx.uploadFile` → `POST /api/upload` → `POST /api/user/update`）

### 6.2 新组件
- `PostCard`：帖子卡片（用户头条 + 文字 + 图片轮播 + 计数行）
- `CommentItem`：评论行 + 嵌套回复
- `ImageSwiper`：Taro `<Swiper>` 多图轮播
- `TagChip`：分类筛选 chip

### 6.3 风险
- 评论嵌套回复 → 用 collapsible "查看更多回复" UI
- 多图帖子 → `Taro.Swiper`
- 改头像 → `wx.chooseMedia` 拿临时文件 → `Taro.uploadFile` 到 `/api/upload`

---

## 7. Phase 3 ⏳ — 消息系统

### 7.1 范围（2 周）
- **私聊会话列表** `pages/messages/index`（替换当前占位）：调 `/api/messages/conversations`
- **私聊会话页** `pages/chat/index?id=`：消息列表 + 输入栏 + 发文字 + 发图片
- **群聊会话**：同 chat 页面，但 isGroup 分支
- **群详情** `pages/group-detail/index?id=`：成员列表 + 设置（参考 web 端 `/messages/groups/[id]`）
- **实时推送**：`Taro.connectSocket` 替换 web 端 socket.io；后端 socket server 已有
- **图片消息**：`wx.chooseMedia` + 上传 + 发 `{ messageType: 'image', content: <url> }`

### 7.2 风险
- WebSocket 在小程序里跟 socket.io 协议**不完全兼容**，可能要后端加 Taro 适配层 / 用原生 ws
- 实时未读 badge 更新（tabBar 的 message tab 数字角标用 `Taro.setTabBarBadge`）
- 后台保活：小程序进后台一段时间 ws 会断，需要 `onShow` 重连

---

## 8. Phase 4 ⏳ — 票务 + 支付

### 8.1 范围（2 周）
- **我的票列表** `pages/tickets/index`：调 `/api/tickets/my-tickets`
- **票详情** `pages/ticket-detail/index?id=`：banner + QR 码 + 转赠按钮 + 退款入口
- **QR 码**：小程序里用 `taro-canvas-qrcode` 或 `weapp-qrcode` 库生成
- **转赠** `pages/ticket-transfer/index?id=`：表单 + 生成转赠 link
- **接收转赠** `pages/ticket-accept/index?code=`：通过 wx.shareAppMessage 接入
- **下单** `pages/checkout/index?eventId=&tierId=`：选数量 → 创建 order → 调 `wx.requestPayment`
- **微信支付 V3**：后端**新增** `/api/pay/wechat/prepay` endpoint（创建预支付订单）
- **退款**：`/api/orders/refund` + 后端处理微信退款

### 8.2 硬前置
- **微信支付商户号**：用户需在微信商户平台申请（要等几天审核）
- **商户证书 + API V3 密钥**：从商户后台下载，配 ECS 环境变量
- **退款回调域名**：商户平台白名单 piaociyuan.com

---

## 9. Phase 5 ⏳ — 收尾 + 上架

### 9.1 范围（1 周）
- **收藏品** `pages/collectibles/index`：调 `/api/user/me/collectibles`
- **分享**：`wx.shareAppMessage` 在每个详情页加分享按钮
- **扫码核销**（员工 / 现场）：`wx.scanCode` 扫票 QR → `/api/tickets/verify` + `/use`
- **分包优化**：把大资源（图片 / 不常用页面）放到 subpackage，主包 ≤2MB
- **PNG tab 图标**：替换当前纯文字 tab，加 5 套 81×81 px @ 2x icon
- **性能审计**：开发者工具的 Audits 跑分 > 80
- **提交审核**：在微信公众平台后台提交版本，等审核（2-7 天）

### 9.2 硬前置
- **类目认证**：服务类目含"票务 / 演出"（公众平台 → 基本设置 → 服务类目）
- **业务域名白名单**：开发管理 → 服务器域名 → request 合法域名加 `https://piaociyuan.com`
- **审核话术**：准备测试账号 + 功能说明文档给微信审核员

---

## 10. 设计决定记录

### 10.1 为什么 5 个 tab 不带 icon
**症状**：Phase 1 ship 时没准备 PNG 图标。
**决定**：先纯文字 tab，能用就行。Phase 5 收尾时再做正式 icon。
**铁律**：tabBar `iconPath` 是可选的，但一旦加就要 5 个都加齐，且必须 PNG（不能用 emoji / svg）。

### 10.2 为什么暂不引用 `@piaociyuan/shared`
**症状**：shared 包可能含 web/mobile 特有 import（如 `next/...` 或 `react-native/...`），引入小程序会编译失败。
**决定**：Phase 1-2 在 apps/wechat 里**独立写**业务类型 + service，不引 shared。
**未来**：Phase 5 收尾时 audit shared 包，把纯类型 / 纯 util 剥出来给小程序用，重命名为 `@piaociyuan/shared-mini` 或 conditional export。

### 10.3 为什么后端走 `/api/auth/wechat-login` 不复用 `/api/auth/login`
**症状**：现有 `/api/auth/login` 接收 `{ account, password, verificationCode }`，跟微信的 `{ code }` 流程完全不同。
**决定**：单独 endpoint 干净分离；复用 `generateTokenPair` 等 lib 函数。

### 10.4 为什么不删 `apps/mobile` 的 `three`
**症状**：mobile 端 0 引用 three，但 `@google/model-viewer` 是它的 peer dep。
**决定**：保留 three 在 mobile，不影响小程序（小程序不引用 mobile 代码）。这是跨端 monorepo 的 hoisting 规则。

### 10.5 为什么 401 自动 refresh 而不是直接跳 login
**症状**：access token 短期（1 天）过期不能让用户每天重登。
**决定**：apiClient 收到 401 自动用 refresh_token 调 `/api/auth/refresh`，成功则重试原请求；失败才跳 login。

### 10.6 为什么乐观更新 follow toggle
**症状**：网络慢时点关注按钮没反应体验差。
**决定**：FollowButton 立即 toggle UI 状态 → 后台调 API → 失败回滚 + Toast。
**铁律**：所有"toggle 类"操作（关注 / 点赞 / 收藏）都用乐观更新；"创建类"操作（发帖 / 发评论 / 下单）不用乐观更新（用户预期等结果）。

---

## 11. 部署 / 上架准备

### 11.1 必备凭证
| 凭证 | 哪里获取 | 用途 | Phase |
|---|---|---|---|
| AppID | mp.weixin.qq.com → 开发管理 | 小程序唯一标识，填 project.config.json | 0 |
| AppSecret | mp.weixin.qq.com → 开发管理 → AppSecret | 后端调 jscode2session 用 | 1 |
| 业务域名 SSL | 域名注册商 / 阿里云 | request 白名单要求 HTTPS | 1 |
| 类目认证 | 公众平台 → 基本设置 → 服务类目 | 加"票务 / 演出"分类 | 4 |
| 商户号 | pay.weixin.qq.com | 微信支付 | 4 |
| 商户证书 + V3 密钥 | 商户平台 → 账户中心 | 调 wx.requestPayment 后端签名用 | 4 |

### 11.2 ECS 环境变量
```bash
# apps/web/.env（也写到 ECS docker compose env）
WX_APPID="wxxxxxxxxxxx"
WX_SECRET="xxxxxxxxxxxxxxxx"
# Phase 4 加：
WECHAT_PAY_MCH_ID=""           # 商户号
WECHAT_PAY_V3_KEY=""           # V3 API 密钥
WECHAT_PAY_CERT_PATH=""        # 商户证书路径
WECHAT_PAY_NOTIFY_URL=""       # 支付回调 URL
```

### 11.3 业务域名白名单（上架硬条件）
mp.weixin.qq.com → 开发管理 → 开发设置 → 服务器域名：
- **request 合法域名**：`https://piaociyuan.com`
- **socket 合法域名**（Phase 3 加）：`wss://piaociyuan.com`
- **uploadFile 合法域名**：`https://piaociyuan.com`
- **downloadFile 合法域名**：`https://piaociyuan.com`

开发期可在微信开发者工具勾选"不校验合法域名"绕过，但**提交审核前必须配齐**。

### 11.4 审核话术准备
准备：
- 测试账号 + 密码（用 13900000099 / Test123456!）
- 功能说明文档（可基于 docs/手动测试流程.md 改写）
- 营业执照 / 演出经纪资质（票务类必查）

---

## 12. 参考资料

| 文档 | 位置 | 用途 |
|---|---|---|
| 开发者快速上手 | [apps/wechat/README.md](../apps/wechat/README.md) | 首次启动小程序开发 |
| 测试入口表 | [docs/手动测试流程.md](手动测试流程.md) | 每 phase ship 后跑测试 |
| Mobile 排查 | [docs/Mobile-排查指南.md](Mobile-排查指南.md) | 跟 mobile 端共享的排查思路（部分适用） |
| 部署 | [docs/阿里云部署指南.md](阿里云部署指南.md) | 后端 ECS 部署（小程序后端共用）|
| 项目铁律 | [CLAUDE.md](../CLAUDE.md) | 跨端通用规则 |

---

## 13. ship 节奏

- **每 phase 单独 plan + commit + push**
- 完成后更新本文 Phase 状态（`⏳` → `✅` + commit hash）
- 更新 `docs/手动测试流程.md` 加该 phase 测试入口
- 不 ship 完整 phase 不进下一阶段（避免半成品堆积）
