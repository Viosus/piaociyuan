# 移动应用文档

票次元 React Native 移动应用的完整开发文档。

## 📱 快速导航

### 核心文档
- [开发进度总览](./mobile-app-setup.md) - 详细的开发进度和待办事项
- [项目开发总结](./app-development-summary.md) - 项目概述、技术栈和架构说明
- [票务功能实现](./mobile-ticketing-features.md) - 票务模块的详细实现文档

## 📚 文档结构

```
docs/mobile/
├── README.md                          # 本文件 - 文档导航
├── mobile-app-setup.md                # 开发进度和计划
├── app-development-summary.md         # 项目总体概述
└── mobile-ticketing-features.md       # 票务功能详细说明
```

## 🚀 快速开始

### 运行移动应用
```bash
# 从项目根目录
npm run mobile

# 或进入 apps/mobile 目录
cd apps/mobile
npm start
```

### 在设备上测试
1. 在手机上安装 **Expo Go** 应用
2. 扫描终端显示的二维码
3. 应用会自动加载

## 📊 项目状态

### 完成度: 70%

**✅ 已完成**:
- 用户认证系统（登录、注册）
- 票务核心功能（活动、订单、门票）
- API 客户端和状态管理
- 基础 UI 组件库

**🚧 进行中**:
- 支付流程集成
- NFT 数字藏品功能

**📋 计划中**:
- 社交功能
- 扫码验票
- 推送通知

## 🛠 技术栈

- **框架**: React Native 0.81.5 + Expo SDK 54
- **语言**: TypeScript 5.9
- **导航**: React Navigation 7
- **状态管理**: React Context API
- **安全存储**: Expo SecureStore
- **代码共享**: @piaoyuzhou/shared

## 📖 详细文档说明

### 1. mobile-app-setup.md
**内容**: 开发进度追踪和详细的待办事项

**适合阅读场景**:
- 了解当前开发进度
- 查看已完成的功能
- 规划下一步开发任务

**主要章节**:
- 已完成的工作
- 下一步计划
- 如何运行项目

---

### 2. app-development-summary.md
**内容**: 项目整体概述和技术架构

**适合阅读场景**:
- 新成员了解项目
- 技术栈选型参考
- 项目架构理解

**主要章节**:
- 项目概述
- 技术栈说明
- 项目亮点
- 下一步目标

---

### 3. mobile-ticketing-features.md
**内容**: 票务功能的详细实现文档

**适合阅读场景**:
- 理解票务功能实现细节
- 查看 API 集成方式
- 组件和服务的使用说明

**主要章节**:
- 功能概述
- 已实现的功能
- 组件库
- API 服务
- 待实现功能

## 🔗 相关链接

### 项目文档
- [Monorepo 根目录 README](../../README.md)
- [Web 应用文档](../migration-status.md)

### 技术文档
- [Expo 官方文档](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)

## 💡 开发建议

### 开发流程
1. 阅读 `app-development-summary.md` 了解项目整体架构
2. 查看 `mobile-app-setup.md` 了解当前进度
3. 参考 `mobile-ticketing-features.md` 了解具体功能实现
4. 开始开发新功能

### 添加新功能
1. 在 `mobile-app-setup.md` 中添加待办事项
2. 实现功能
3. 更新文档说明实现细节
4. 更新进度状态

## 📞 问题反馈

如有问题或建议，请：
1. 查看相关文档
2. 检查代码注释
3. 参考 Web 端实现
4. 提交 Issue

---

**最后更新**: 2025-11-03
**维护者**: Claude Code
