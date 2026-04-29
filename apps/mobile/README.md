# 票次元 Mobile App

React Native (Expo) 移动应用

## 技术栈

- **框架**: React Native + Expo
- **导航**: React Navigation 7
- **语言**: TypeScript
- **状态管理**: (待添加)
- **API 客户端**: Fetch API

## 开发

### 启动开发服务器

```bash
# 从根目录
npm run mobile

# 或在 apps/mobile 目录下
npm start
```

### 在设备上运行

```bash
# Android
npm run android

# iOS (需要 macOS)
npm run ios

# Web
npm run web
```

### 扫码预览

1. 启动开发服务器 `npm start`
2. 在手机上安装 Expo Go 应用
3. 扫描终端显示的二维码

## 项目结构

```
src/
├── components/      # 可复用组件
├── screens/         # 屏幕组件
├── navigation/      # 导航配置
├── services/        # API 服务
├── hooks/           # 自定义 Hooks
├── constants/       # 常量配置
├── types/           # TypeScript 类型
└── utils/           # 工具函数
```

## 功能特性

- ✅ 底部导航栏（首页、活动、门票、我的）
- ✅ TypeScript 支持
- ✅ 共享代码包集成 (@piaociyuan/shared)
- ✅ API 客户端配置
- 🚧 用户认证
- 🚧 活动浏览和购票
- 🚧 NFT 数字藏品
- 🚧 社交功能
- 🚧 扫码验票
- 🚧 推送通知

## 环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

## 调试

使用 Expo DevTools 进行调试：

1. 按 `j` 打开 Chrome DevTools
2. 按 `r` 重新加载应用
3. 按 `m` 切换菜单

## 构建

```bash
# Android APK
eas build --platform android

# iOS IPA
eas build --platform ios
```

详见 [Expo 文档](https://docs.expo.dev/)
