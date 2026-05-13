# 票次元微信小程序（apps/wechat）

> **Phase 0 + 1 已 ship**：脚手架 + 微信登录 + Tab 导航 + 5 个只读页（主页/活动/搜索/通知/我的）。Phase 2-5 路线图见根目录 `~/.claude/plans/terminal-docs-scalable-meadow.md`。

## 技术栈

- **Taro 4.0.9**：编译 React → 微信小程序原生
- **React 19.1.0** + TypeScript 5.9.2（跟 root overrides 对齐）
- **SCSS**：样式（小程序里编译为 wxss）
- 后端共用 [apps/web](../web) 的 API（116 个 route）

## 首次启动

### 1. 在 root 装依赖（一次性）
```bash
cd /path/to/piaoyuzhou
npm install
```
> npm workspaces 会把 Taro deps hoist 到 root `node_modules`。Taro 4.0.9 跟 React 19 兼容。

### 2. 配 AppID
打开 `apps/wechat/project.config.json`，把 `"appid": "wx_TODO_REPLACE_APPID"` 改为真实 AppID（在 mp.weixin.qq.com→开发→开发设置查）。

### 3. 后端配 WX 凭证（首次必做）
```bash
# 在 apps/web/.env 加
WX_APPID="wxxxxxxxxxxx"    # 跟上一步的 AppID 一致
WX_SECRET="xxxxxxxxxxxx"   # 在 mp.weixin.qq.com→开发→开发设置→AppSecret
```
ECS 同步：`docker compose exec web sh -c 'echo WX_APPID=xxx >> .env'` 然后重启 web 容器。

### 4. 配业务域名白名单（真机需要）
登录 mp.weixin.qq.com → 开发管理 → 开发设置 → 服务器域名 → request 合法域名加：
- `https://piaociyuan.com`

**开发期不配也可以**：微信开发者工具勾选"不校验合法域名"。但提交审核前必须配。

### 5. 编译 + 用 WeChat DevTools 打开
```bash
cd apps/wechat
npm run dev:weapp        # watch 模式，改代码实时编译到 dist/
# 或一次性 build：
npm run build:weapp
```

然后打开微信开发者工具：
1. "导入项目" → 项目目录选 `apps/wechat/`（**不是 dist/，是根目录**，因为 project.config.json 已指向 dist）
2. AppID 用 project.config.json 里的
3. 启动 → 看到登录页

> 微信开发者工具下载：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

## 目录结构

```
apps/wechat/
├── config/                # Taro 编译配置（dev / prod）
├── src/
│   ├── app.config.ts      # 小程序全局配置（pages / tabBar）
│   ├── app.tsx            # 入口组件
│   ├── app.scss           # 全局样式 + CSS 变量主题
│   ├── components/        # 公共组件：Avatar / Card / Empty / Toast
│   ├── pages/             # 页面：login / home / events / search / me / messages / notifications
│   └── services/          # api / storage / auth client
├── project.config.json    # 微信开发者工具识别文件（含 AppID）
├── package.json
└── README.md
```

## Phase 1 已实现

- ✅ 微信一键登录（wx.login → 后端 /api/auth/wechat-login → JWT）
- ✅ Token 自动 refresh + 过期跳登录
- ✅ Tab 导航（5 个 tab，纯文字）
- ✅ 5 个核心只读页：
  - **主页**：活动列表 + 售票状态
  - **全部活动**：分类筛选（演唱会/音乐节/展览等）
  - **搜索**：综合搜索（用户/帖子/活动三 tab）
  - **我的**：个人信息 + 退出登录
  - **通知**：通知列表 + 已读未读

## Phase 2-5 计划（不在本批次）

| Phase | 范围 | 估时 |
|---|---|---|
| 2 | 活动详情 / 帖子 / 用户主页 / 关注 / 收藏 / 设置 | 2.5 周 |
| 3 | 私聊 / 群聊 / Taro.connectSocket 实时推送 | 2 周 |
| 4 | 票务 + 二维码 + 转赠 + 下单 + wx.requestPayment | 2 周 |
| 5 | 分享 / 扫码核销 / 性能（分包） / 提交审核 | 1 周 |

## 常见问题

### 编译失败 "tab list count <= 5"
微信限制 tabBar 最多 5 个 tab。当前正好 5 个，别再加。

### Taro.request 报"不在合法域名列表中"
真机 / 不勾选"不校验合法域名"会报这个。解决：mp.weixin.qq.com 加 piaociyuan.com 到 request 白名单。

### 改了代码 dist 没更新
- 检查 `npm run dev:weapp` 是否在跑
- 微信开发者工具左上角 → "编译"按钮强制刷新
- 如果还不行：清 .expo / node_modules/.cache 等缓存（参考 docs/Mobile-排查指南.md 思路）

### 401 死循环
代码里 refresh 失败会 clearAll + 跳 login。如果一直 401，检查：
- 后端 /api/auth/refresh 是否正常
- access_token / refresh_token 是否写入了 storage（开发者工具的 Storage 面板查）
- WX_APPID / WX_SECRET 后端是否配对

## 后续 ship 节奏

每 phase 一次单独 plan + commit。本 batch（Phase 0+1）commit hash 见 git log。
