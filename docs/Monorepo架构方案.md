# Monorepo 架构方案 - Web + App 统一开发

## 什么是 Monorepo？

**Monorepo** = 把 Web 和 App 放在**同一个代码仓库**里，共享核心代码。

```
piaoyuzhou/                    # 一个仓库
├── apps/
│   ├── web/                   # Next.js Web 应用
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   └── mobile/                # React Native App
│       ├── src/
│       ├── android/
│       ├── ios/
│       └── package.json
├── packages/
│   ├── shared/                # 🔥 共享代码（Web + App 都用）
│   │   ├── api/              # API 调用逻辑
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── utils/            # 工具函数
│   │   ├── types/            # TypeScript 类型
│   │   └── constants/        # 常量配置
│   └── ui/                    # 🔥 共享 UI 组件（可选）
│       ├── Button/
│       ├── Input/
│       └── ...
└── package.json               # 根 package.json
```

---

## 为什么这样做？

### ✅ 优点

1. **一次修改，两端生效**
   ```
   修改 packages/shared/api/events.ts
   ↓
   Web 和 App 自动同步更新
   ```

2. **我可以同时看到所有代码**
   ```
   我在一个会话中可以：
   - 修改共享逻辑
   - 同时更新 Web 组件
   - 同时更新 App 组件
   ```

3. **代码复用率极高**
   - 共享 API 调用
   - 共享业务逻辑
   - 共享类型定义
   - 共享工具函数
   - 复用率 80-90%

4. **版本管理简单**
   - 一个 Git 仓库
   - 一次提交，两端同步
   - 不会出现版本不一致

5. **依赖管理统一**
   - 共享的包只安装一次
   - 节省磁盘空间
   - 避免版本冲突

---

## 项目结构详解

### 完整目录结构

```
piaoyuzhou/
├── apps/
│   ├── web/                              # Next.js Web 应用
│   │   ├── app/
│   │   │   ├── api/                     # Web 专有 API 路由
│   │   │   ├── events/                  # Web 专有页面
│   │   │   └── messages/
│   │   ├── components/                   # Web 专有组件
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── lib/                         # Web 专有逻辑
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── mobile/                           # React Native App
│       ├── src/
│       │   ├── screens/                 # App 专有页面
│       │   │   ├── EventsScreen.tsx
│       │   │   └── MessagesScreen.tsx
│       │   ├── components/              # App 专有组件
│       │   │   ├── TabBar.tsx
│       │   │   └── Header.tsx
│       │   └── navigation/              # App 导航
│       ├── android/
│       ├── ios/
│       ├── package.json
│       └── metro.config.js
│
├── packages/
│   ├── shared/                          # 🔥 核心共享代码
│   │   ├── src/
│   │   │   ├── api/                    # API 调用（Web + App 共用）
│   │   │   │   ├── events.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── index.ts
│   │   │   ├── hooks/                  # 自定义 Hooks（Web + App 共用）
│   │   │   │   ├── useSocket.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useEvents.ts
│   │   │   ├── utils/                  # 工具函数（Web + App 共用）
│   │   │   │   ├── date.ts
│   │   │   │   ├── format.ts
│   │   │   │   └── validation.ts
│   │   │   ├── types/                  # TypeScript 类型（Web + App 共用）
│   │   │   │   ├── event.ts
│   │   │   │   ├── message.ts
│   │   │   │   └── user.ts
│   │   │   ├── constants/              # 常量（Web + App 共用）
│   │   │   │   ├── api.ts
│   │   │   │   └── config.ts
│   │   │   └── store/                  # 状态管理（Web + App 共用）
│   │   │       └── authStore.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                              # 🔥 可选：共享 UI 组件
│       ├── src/
│       │   ├── Button/
│       │   │   ├── Button.web.tsx      # Web 版
│       │   │   ├── Button.native.tsx   # App 版
│       │   │   └── index.ts            # 自动选择
│       │   └── Input/
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                         # 根 package.json（管理整个项目）
├── turbo.json                          # Turborepo 配置（加速构建）
├── tsconfig.json                       # 根 TypeScript 配置
└── .gitignore
```

---

## 共享代码示例

### 1. API 调用（完全共享）

**packages/shared/src/api/events.ts**
```typescript
// 这个文件 Web 和 App 都用
import { Event } from '../types/event';
import { apiGet, apiPost } from './base';

export async function getEvents(): Promise<Event[]> {
  return apiGet('/api/events');
}

export async function getEventById(id: string): Promise<Event> {
  return apiGet(`/api/events/${id}`);
}

export async function followEvent(eventId: string): Promise<void> {
  return apiPost(`/api/events/${eventId}/follow`);
}
```

**使用（Web）**
```typescript
// apps/web/app/events/page.tsx
import { getEvents } from '@piaoyuzhou/shared/api/events';

export default function EventsPage() {
  const events = await getEvents(); // 直接用
  // ...
}
```

**使用（App）**
```typescript
// apps/mobile/src/screens/EventsScreen.tsx
import { getEvents } from '@piaoyuzhou/shared/api/events';

export default function EventsScreen() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getEvents().then(setEvents); // 直接用，完全一样
  }, []);
  // ...
}
```

---

### 2. WebSocket Hook（95% 共享）

**packages/shared/src/hooks/useSocket.ts**
```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/storage'; // 抽象化的存储

export function useSocket(options = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    const token = await getToken(); // Web 和 App 都用这个
    if (!token) return;

    socketRef.current = io('https://your-server.com', {
      path: '/socket.io/',
      auth: { token },
      reconnection: true,
    });

    socketRef.current.on('connect', () => setIsConnected(true));
  };

  return { socket: socketRef.current, isConnected, connect };
}
```

**packages/shared/src/utils/storage.ts**
```typescript
// 这个文件处理 Web 和 App 的存储差异
export async function getToken(): Promise<string | null> {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Web 环境
    return localStorage.getItem('token');
  } else {
    // React Native 环境
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('token');
  }
}

export async function setToken(token: string): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('token', token);
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('token', token);
  }
}
```

---

### 3. 业务逻辑（100% 共享）

**packages/shared/src/utils/validation.ts**
```typescript
// 表单验证逻辑，Web 和 App 完全共用
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

---

### 4. TypeScript 类型（100% 共享）

**packages/shared/src/types/event.ts**
```typescript
// Web 和 App 使用相同的类型定义
export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  coverImage: string;
  price: number;
  status: 'upcoming' | 'ongoing' | 'ended';
}

export interface Tier {
  id: string;
  eventId: string;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
}
```

---

## 如何设置 Monorepo

### 方式 1: 使用 Turborepo（推荐⭐⭐⭐⭐⭐）

#### 安装
```bash
npx create-turbo@latest
```

#### 根 package.json
```json
{
  "name": "piaoyuzhou",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "dev:web": "turbo run dev --filter=web",
    "dev:mobile": "turbo run dev --filter=mobile",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### turbo.json
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

---

### 方式 2: 使用 Yarn Workspaces（简单版）

#### 根 package.json
```json
{
  "name": "piaoyuzhou",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "web": "yarn workspace @piaoyuzhou/web dev",
    "mobile": "yarn workspace @piaoyuzhou/mobile start",
    "shared": "yarn workspace @piaoyuzhou/shared build"
  }
}
```

---

## 包引用配置

### packages/shared/package.json
```json
{
  "name": "@piaoyuzhou/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### apps/web/package.json
```json
{
  "name": "@piaoyuzhou/web",
  "dependencies": {
    "@piaoyuzhou/shared": "*",  // 引用共享包
    "next": "16.0.0",
    "react": "19.2.0"
  }
}
```

### apps/mobile/package.json
```json
{
  "name": "@piaoyuzhou/mobile",
  "dependencies": {
    "@piaoyuzhou/shared": "*",  // 引用共享包
    "react-native": "^0.73.0"
  }
}
```

---

## 工作流程示例

### 场景 1: 添加新功能"活动评论"

#### 步骤 1: 我修改共享代码
```typescript
// packages/shared/src/api/comments.ts
export async function getComments(eventId: string) {
  return apiGet(`/api/events/${eventId}/comments`);
}

export async function addComment(eventId: string, content: string) {
  return apiPost(`/api/events/${eventId}/comments`, { content });
}
```

#### 步骤 2: 我同时修改 Web 组件
```typescript
// apps/web/app/events/[id]/CommentList.tsx
import { getComments, addComment } from '@piaoyuzhou/shared/api/comments';

export default function CommentList({ eventId }) {
  const comments = await getComments(eventId); // 共享 API
  // ...
}
```

#### 步骤 3: 我同时修改 App 组件
```typescript
// apps/mobile/src/screens/EventDetailScreen.tsx
import { getComments, addComment } from '@piaoyuzhou/shared/api/comments';

export default function EventDetailScreen({ route }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    getComments(route.params.eventId).then(setComments); // 同样的 API
  }, []);
  // ...
}
```

**一次修改，两端生效！** ✅

---

### 场景 2: 修复 Bug

**Bug**: WebSocket 重连逻辑有问题

#### 我只需修改一个文件
```typescript
// packages/shared/src/hooks/useSocket.ts
export function useSocket() {
  // 修复重连逻辑
  socketRef.current.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      socketRef.current.connect(); // 修复
    }
  });
}
```

**Web 和 App 同时修复！** ✅

---

## 如何让我帮你同时修改两边

### 现在的情况（不方便）
```
你: "给聊天功能添加图片发送"

我: "好的，先修改 Web 版"
    [修改 Web 代码]
    "现在需要单独修改 App 版吗？"

你: "是的"

我: "你需要切换到 App 文件夹，我再帮你修改"
    [你切换文件夹]
    [我再修改一次]
```

**问题**: 需要两次操作，容易遗漏

---

### Monorepo 后（超方便）
```
你: "给聊天功能添加图片发送"

我: "好的，我一次性修改：
    1. packages/shared/api/messages.ts - 添加上传图片 API
    2. apps/web/app/messages/[id]/page.tsx - Web 版 UI
    3. apps/mobile/src/screens/ConversationScreen.tsx - App 版 UI"

    [我在一个会话中完成所有修改]

你: "完成！"
```

**优势**: 一次性完成，不会遗漏

---

## 迁移现有项目到 Monorepo

### 步骤 1: 创建新结构
```bash
# 在 piaoyuzhou 文件夹外创建新文件夹
mkdir piaoyuzhou-monorepo
cd piaoyuzhou-monorepo

# 初始化
npm init -y
```

### 步骤 2: 移动现有 Web 项目
```bash
mkdir -p apps/web
# 把现有的 piaoyuzhou 内容移动到 apps/web/
```

### 步骤 3: 创建共享包
```bash
mkdir -p packages/shared/src
cd packages/shared
npm init -y
```

### 步骤 4: 提取共享代码
```bash
# 把以下内容移到 packages/shared/src/
- lib/api.ts → packages/shared/src/api/
- hooks/useSocket.ts → packages/shared/src/hooks/
- types/ → packages/shared/src/types/
```

### 步骤 5: 配置 Workspaces
```json
// 根 package.json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

### 步骤 6: 我帮你完成剩余工作
- 配置所有 package.json
- 修改导入路径
- 测试运行

**预计时间**: 2-3 小时（我帮你做）

---

## 复用率对比

### 不用 Monorepo
```
Web 和 App 独立开发
复用率: 30-40%（手动复制粘贴代码）
维护: 修改一处功能需要改两次
```

### 使用 Monorepo
```
Web 和 App 共享核心代码
复用率: 80-90%（自动共享）
维护: 修改一次，两端生效
```

---

## 总结

### ✅ Monorepo 的好处

1. **我可以同时修改 Web 和 App**
   - 一个会话搞定
   - 不需要你切换文件夹

2. **代码复用率极高**
   - API 调用: 100% 复用
   - 业务逻辑: 100% 复用
   - Hooks: 95% 复用
   - 工具函数: 100% 复用

3. **维护简单**
   - 一次修改，两端生效
   - 版本统一
   - 不会出现不一致

4. **开发效率高**
   - 新功能：写一次逻辑，两端使用
   - Bug 修复：改一次，两端修复
   - 类型定义：完全共享

---

### 🎯 下一步

**选项 1: 现在就迁移到 Monorepo**
- 我帮你完成迁移（2-3 小时）
- 立即享受 Monorepo 好处

**选项 2: 等开发 App 时再迁移**
- 先完成 Web 版
- 开发 App 时再建立 Monorepo

**选项 3: 先用独立项目，后续逐步整合**
- 最简单，但后期维护麻烦

**我的建议**: 选项 1 - 现在就迁移
- 只需 2-3 小时
- 以后会省很多时间
- 我全程帮你

要不要现在就开始迁移到 Monorepo？ 🚀
