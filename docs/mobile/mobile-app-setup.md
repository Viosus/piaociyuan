# Mobile App 开发进度

## 已完成

### 1. 项目初始化 ✅
- 使用 Expo 创建 React Native 项目
- 配置为 Monorepo 的一部分 (@piaoyuzhou/mobile)
- 集成 @piaoyuzhou/shared 共享包

### 2. TypeScript 配置 ✅
- 配置路径映射，支持 `@piaoyuzhou/shared` 导入
- 配置别名 `@/*` 指向项目根目录
- TypeScript 严格模式开启

### 3. 项目基础结构 ✅
- 创建清晰的目录结构：
  - `src/screens/` - 屏幕组件
  - `src/components/` - 可复用组件
  - `src/navigation/` - 导航配置
  - `src/services/` - API 服务
  - `src/hooks/` - 自定义 Hooks
  - `src/constants/` - 常量配置
  - `src/types/` - TypeScript 类型
  - `src/utils/` - 工具函数

### 4. React Navigation 集成 ✅
- 安装 React Navigation 7
- 创建底部导航栏 (Bottom Tabs)
- 4 个主要屏幕：
  - 首页 (Home)
  - 活动 (Events)
  - 门票 (Tickets)
  - 我的 (Profile)

### 5. API 客户端 ✅
- 创建基础 API 客户端 (`src/services/api.ts`)
- 支持 GET/POST/PUT/DELETE 请求
- 自动处理 Authorization header
- 集成 @piaoyuzhou/shared 的 ApiResponse 类型

### 6. 认证服务 ✅
- 创建认证相关的 API 封装 (`src/services/auth.ts`)
- 登录、注册、发送验证码、刷新 Token 等功能

### 7. 主题和样式 ✅
- 定义统一的颜色系统
- 定义间距和字体大小常量
- 可复用的样式配置

## 下一步计划

### 1. 创建认证模块 ✅
- [x] 登录屏幕
- [x] 注册屏幕
- [x] 验证码输入组件
- [x] 存储和管理 Token (使用 expo-secure-store)
- [x] 认证状态管理

### 2. 实现票务核心功能 ✅
- [x] 活动列表页面
- [x] 活动详情页面
- [x] 购票流程
- [x] 票档选择
- [x] 订单列表
- [x] 门票展示
- [ ] 支付集成（待后续实现）
- [ ] 订单详情页面（待后续实现）

### 3. NFT 数字藏品 📋
- [ ] NFT 列表
- [ ] NFT 详情
- [ ] 钱包集成
- [ ] NFT 转赠功能

### 4. 社交功能 📋
- [ ] 帖子列表
- [ ] 发布帖子
- [ ] 评论功能
- [ ] 点赞功能
- [ ] 个人主页

### 5. 移动端特有功能 📋
- [ ] 扫码验票 (expo-camera)
- [ ] 推送通知 (expo-notifications)
- [ ] 位置服务 (expo-location)
- [ ] 图片上传 (expo-image-picker)

### 6. 状态管理 📋
- [ ] 选择并集成状态管理方案 (Context API / Zustand / Redux)
- [ ] 实现全局用户状态
- [ ] 实现购物车状态

### 7. UI 组件库 📋
- [ ] 按钮组件
- [ ] 输入框组件
- [ ] 卡片组件
- [ ] 列表组件
- [ ] 加载状态组件
- [ ] 错误提示组件

### 8. 优化和测试 📋
- [ ] 性能优化
- [ ] 图片懒加载
- [ ] 列表虚拟化
- [ ] 错误边界
- [ ] 单元测试
- [ ] E2E 测试

## 如何运行

### 启动开发服务器
```bash
# 从根目录
npm run mobile

# 或
cd apps/mobile
npm start
```

### 在设备上运行
```bash
# Android
npm run mobile:android

# iOS (需要 macOS)
npm run mobile:ios
```

### 扫码预览
1. 在手机上安装 Expo Go 应用
2. 扫描终端显示的二维码

## 技术栈

- **框架**: React Native + Expo SDK 54
- **导航**: React Navigation 7
- **语言**: TypeScript 5
- **状态管理**: (待定)
- **UI 库**: (待定)
- **API 客户端**: Fetch API

## 与 Web 端的代码共享

通过 `@piaoyuzhou/shared` 包共享：
- TypeScript 类型定义
- API 响应类型
- 错误代码常量
- 业务逻辑常量

示例：
```typescript
import { ApiResponse, UserRole, TicketStatus } from '@piaoyuzhou/shared';
import { ErrorCode, TICKET_HOLD_DURATION } from '@piaoyuzhou/shared';
```

## 注意事项

1. **环境变量**：使用 `EXPO_PUBLIC_` 前缀，例如 `EXPO_PUBLIC_API_URL`
2. **路径映射**：可以使用 `@piaoyuzhou/shared` 和 `@/*` 别名
3. **TypeScript**：启用了严格模式，需要显式类型标注
4. **导航**：使用 TypeScript 进行类型安全的导航

## 已知问题

暂无

## 最后更新

2025-11-03
