# 背景与卡片样式配置指南

> 本指南包含了整个网站的背景和卡片样式配置说明

## 📍 样式系统位置

所有样式配置都集中在 `styles` 文件夹中：
```
apps/web/styles/
├── background.css  # 背景配置
└── cards.css       # 卡片样式配置
```

这些文件已自动导入到 `globals.css` 中，无需手动引入。

---

# 第一部分：背景系统

## 📍 背景系统位置

所有背景配置都集中在一个文件中：
```
apps/web/styles/background.css
```

## 🎨 当前背景配置

### 当前使用：深粉色纯色背景
```css
:root {
  --app-bg-color: #C72471;  /* 深粉色 */
}
```

所有页面都继承这个全局背景色。

---

## 🔄 如何切换到背景图片

### 步骤 1：准备图片
将背景图片放到：
```
apps/web/public/images/background.jpg
```

支持的图片格式：`.jpg`, `.png`, `.webp`, `.svg`

### 步骤 2：修改配置文件
打开 `apps/web/styles/background.css`，修改以下内容：

```css
:root {
  /* 保留纯色作为备用（图片加载失败时显示） */
  --app-bg-color: #C72471;

  /* 👇 取消注释这一行，启用背景图片 */
  --app-bg-image: url('/images/background.jpg');

  /* 可选：调整背景图片设置 */
  --app-bg-size: cover;           /* 覆盖整个屏幕 */
  --app-bg-position: center;      /* 居中显示 */
  --app-bg-attachment: fixed;     /* 固定背景（滚动时不动） */
  --app-bg-repeat: no-repeat;     /* 不重复 */
}

/* 在 body 样式中，取消注释这一行 */
body {
  background-color: var(--app-bg-color);
  background-image: var(--app-bg-image);  /* 👈 取消注释 */
  background-size: var(--app-bg-size);
  /* ... 其他配置 ... */
}

/* 在 .page-background 样式中，取消注释这一行 */
.page-background {
  background-color: var(--app-bg-color);
  background-image: var(--app-bg-image);  /* 👈 取消注释 */
  /* ... 其他配置 ... */
}
```

### 步骤 3：保存并查看效果
刷新浏览器，所有页面的背景都会变成图片。

---

## 🎯 背景图片配置选项

### 1. 背景尺寸 (`background-size`)
```css
--app-bg-size: cover;      /* 覆盖整个屏幕（推荐） */
--app-bg-size: contain;    /* 完整显示图片 */
--app-bg-size: 100% 100%;  /* 拉伸填充 */
```

### 2. 背景位置 (`background-position`)
```css
--app-bg-position: center;       /* 居中（推荐） */
--app-bg-position: top;          /* 顶部对齐 */
--app-bg-position: bottom;       /* 底部对齐 */
--app-bg-position: left center;  /* 左侧居中 */
```

### 3. 背景附着 (`background-attachment`)
```css
--app-bg-attachment: fixed;   /* 固定背景，滚动时不动（推荐） */
--app-bg-attachment: scroll;  /* 背景随页面滚动 */
```

### 4. 背景重复 (`background-repeat`)
```css
--app-bg-repeat: no-repeat;  /* 不重复（推荐） */
--app-bg-repeat: repeat;     /* 平铺重复 */
```

---

## 🌈 使用渐变背景

如果不想用图片，也可以用渐变背景：

```css
:root {
  /* 方式 1：修改纯色为渐变 */
  --app-bg-color: linear-gradient(135deg, #C72471 0%, #8B1A5E 100%);
}
```

或者直接在 body 中设置：

```css
body {
  background: linear-gradient(135deg, #C72471 0%, #8B1A5E 50%, #C72471 100%);
}
```

---

## 📱 多个背景层叠

可以同时使用图片和渐变：

```css
body {
  /* 先渐变，后图片（图片在上层） */
  background-image:
    url('/images/background.jpg'),
    linear-gradient(135deg, rgba(199, 36, 113, 0.8) 0%, rgba(139, 26, 94, 0.8) 100%);
  background-blend-mode: overlay;  /* 混合模式 */
}
```

---

## 🎨 使用的页面类

### 1. 普通页面（有侧边栏）
不需要特殊类名，会自动继承 `body` 的背景。

### 2. 管理后台页面
使用 `.page-background` 类：
```tsx
<div className="page-background">
  {/* 内容 */}
</div>
```

### 3. 内容卡片
使用 `.content-card` 类（半透明白色）：
```tsx
<div className="content-card">
  {/* 卡片内容 */}
</div>
```

---

## 📋 已应用背景的页面列表

### ✅ 管理后台（全部使用 `.page-background`）
- `/admin` - 管理后台主页
- `/admin/reports` - 举报管理
- `/admin/users` - 用户管理
- `/admin/posts` - 帖子管理
- `/admin/events` - 活动管理
- `/admin/nfts` - NFT管理
- `/admin/verifications` - 认证审核

### ✅ 用户页面
- `/account/verification` - 身份认证申请

### ✅ 所有其他页面
通过 `body` 继承全局背景色。

---

## 🔧 常见问题

### Q1：背景图片不显示？
**检查：**
1. 图片路径是否正确（必须在 `public/images/` 下）
2. 是否取消了 `background-image` 的注释
3. 浏览器控制台是否有 404 错误

### Q2：背景图片太大/太小？
**调整：**
```css
--app-bg-size: cover;  /* 改成 contain 或具体尺寸 */
```

### Q3：想要背景图片滚动时不动？
**设置：**
```css
--app-bg-attachment: fixed;  /* 推荐设置 */
```

### Q4：图片加载慢，能否先显示颜色？
**可以！** 系统已经配置了备用颜色：
```css
background-color: var(--app-bg-color);  /* 纯色备用 */
background-image: var(--app-bg-image);  /* 图片覆盖 */
```
图片未加载时会先显示纯色。

---

## 🚀 推荐的背景图片规格

- **分辨率**：至少 1920x1080 (Full HD)
- **文件大小**：< 500KB（使用压缩工具）
- **格式**：WebP（最佳） > JPG > PNG
- **比例**：16:9 或 16:10
- **色调**：与深粉色 `#C72471` 相协调

---

## 📝 示例：完整切换流程

### 从纯色切换到图片

1. 准备图片：
   ```
   apps/web/public/images/background.jpg
   ```

2. 编辑 `apps/web/styles/background.css`：
   ```css
   :root {
     --app-bg-color: #C72471;
     --app-bg-image: url('/images/background.jpg');  /* 👈 添加这行 */
   }

   body {
     background-color: var(--app-bg-color);
     background-image: var(--app-bg-image);  /* 👈 取消注释 */
     background-size: var(--app-bg-size);
     background-position: var(--app-bg-position);
     background-attachment: var(--app-bg-attachment);
     background-repeat: var(--app-bg-repeat);
   }

   .page-background {
     background-color: var(--app-bg-color);
     background-image: var(--app-bg-image);  /* 👈 取消注释 */
     background-size: var(--app-bg-size);
     background-position: var(--app-bg-position);
     background-attachment: var(--app-bg-attachment);
     background-repeat: var(--app-bg-repeat);
     min-height: 100vh;
   }
   ```

3. 刷新浏览器查看效果！

---

## ✨ 背景系统配置完成！

现在所有页面的背景都已统一，后续只需要修改一个文件就能更新全站背景！

---

# 第二部分：卡片样式系统

## 📍 卡片样式位置

所有卡片样式配置都集中在：
```
apps/web/styles/cards.css
```

## 🎨 卡片样式类型

### 1. 标准卡片 (`.card`)
不透明白色卡片，适合大多数场景。

```tsx
<div className="card">
  <h3 className="card-title">标题</h3>
  <p className="card-body">内容</p>
</div>
```

**特点：**
- 95% 不透明白色背景
- 中等圆角和阴影
- 适合表单、详情页等

---

### 2. 毛玻璃卡片 (`.card-glass`)
半透明 + 背景模糊效果，现代感强。

```tsx
<div className="card-glass">
  <h3 className="card-title">标题</h3>
  <p className="card-body">内容</p>
</div>
```

**特点：**
- 80% 透明白色背景
- 10px 背景模糊（毛玻璃效果）
- 悬停时变为不透明
- 适合列表、浮动面板

---

### 3. 轻量卡片 (`.card-light`)
更透明的卡片，背景若隐若现。

```tsx
<div className="card-light">
  <p>内容</p>
</div>
```

**特点：**
- 60% 透明白色背景
- 8px 背景模糊
- 适合辅助信息、提示框

---

### 4. 微透明卡片 (`.card-subtle`)
最透明的卡片，与背景融为一体。

```tsx
<div className="card-subtle">
  <p>内容</p>
</div>
```

**特点：**
- 40% 透明白色背景
- 5px 背景模糊
- 适合装饰性元素

---

## 📏 卡片尺寸

### 小号卡片
```tsx
<div className="card card-sm">小卡片</div>
<div className="card-glass card-sm">小毛玻璃卡片</div>
```

### 默认尺寸
```tsx
<div className="card">默认卡片</div>
```

### 大号卡片
```tsx
<div className="card card-lg">大卡片</div>
<div className="card-glass card-lg">大毛玻璃卡片</div>
```

---

## 🎯 特殊卡片类型

### 可点击卡片
自动添加悬停效果和光标样式。

```tsx
<div className="card card-clickable" onClick={handleClick}>
  可点击的卡片
</div>
```

**效果：**
- 悬停时向上移动 2px
- 阴影增强
- 边框颜色变化
- 光标变为手型

---

### 管理后台卡片
适合管理后台的标准卡片。

```tsx
<div className="card-admin">
  <h3>后台卡片</h3>
</div>
```

---

### 表单卡片
适合表单页面，更大的圆角和阴影。

```tsx
<div className="card-form">
  <form>...</form>
</div>
```

---

### 列表项卡片
适合列表中的每一项。

```tsx
<div className="card-list-item">
  <p>列表项内容</p>
</div>
```

**特点：**
- 默认毛玻璃效果
- 悬停时变为不透明
- 自动悬停动画

---

## 🧩 卡片组件部分

### 完整结构示例

```tsx
<div className="card">
  {/* 头部 */}
  <div className="card-header">
    <h3 className="card-title">卡片标题</h3>
    <p className="card-subtitle">副标题或描述</p>
  </div>

  {/* 主体内容 */}
  <div className="card-body">
    这里是卡片的主要内容区域。
  </div>

  {/* 底部 */}
  <div className="card-footer">
    <button>操作按钮</button>
  </div>
</div>
```

### 各部分说明

**`.card-header`**
- 卡片头部区域
- 自动添加下边框和间距

**`.card-title`**
- 卡片标题样式
- 加粗、较大字号

**`.card-subtitle`**
- 副标题样式
- 小字号、浅色文字

**`.card-body`**
- 主要内容区域
- 标准文字颜色

**`.card-footer`**
- 底部区域
- 自动添加上边框和间距

---

## 🎨 卡片配置变量

在 `apps/web/styles/cards.css` 的 `:root` 中定义：

### 背景色变量
```css
--card-bg-solid: rgba(255, 255, 255, 0.95);   /* 不透明白色 */
--card-bg-glass: rgba(255, 255, 255, 0.8);    /* 半透明毛玻璃 */
--card-bg-light: rgba(255, 255, 255, 0.6);    /* 更透明 */
--card-bg-subtle: rgba(255, 255, 255, 0.4);   /* 微透明 */
```

### 边框色变量
```css
--card-border: rgba(255, 235, 245, 1);        /* #FFEBF5 */
--card-border-hover: rgba(255, 227, 240, 1);  /* #FFE3F0 */
--card-border-subtle: rgba(255, 235, 245, 0.5);
```

### 圆角变量
```css
--card-radius-sm: 0.5rem;   /* 8px */
--card-radius-md: 0.75rem;  /* 12px */
--card-radius-lg: 1rem;     /* 16px */
--card-radius-xl: 1.5rem;   /* 24px */
```

### 阴影变量
```css
--card-shadow-sm: 0 1px 3px 0 rgba(234, 243, 83, 0.3);
--card-shadow-md: 0 4px 6px -1px rgba(234, 243, 83, 0.3);
--card-shadow-lg: 0 10px 15px -3px rgba(234, 243, 83, 0.4);
--card-shadow-hover: 0 10px 15px -3px rgba(234, 243, 83, 0.4),
                     0 0 20px rgba(234, 243, 83, 0.5);
```

### 内边距变量
```css
--card-padding-sm: 1rem;    /* 16px */
--card-padding-md: 1.5rem;  /* 24px */
--card-padding-lg: 2rem;    /* 32px */
```

---

## 🔄 如何自定义卡片样式

### 方式 1：修改 CSS 变量
打开 `apps/web/styles/cards.css`，修改 `:root` 中的变量：

```css
:root {
  /* 例如：让所有卡片更透明 */
  --card-bg-solid: rgba(255, 255, 255, 0.85);
  --card-bg-glass: rgba(255, 255, 255, 0.7);

  /* 例如：使用更大的圆角 */
  --card-radius-lg: 1.5rem;

  /* 例如：改变边框颜色 */
  --card-border: rgba(255, 200, 220, 1);
}
```

保存后，所有使用该变量的卡片都会自动更新。

---

### 方式 2：创建自定义卡片类
在 `apps/web/styles/cards.css` 末尾添加：

```css
/* 自定义：深色卡片 */
.card-dark {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--card-radius-lg);
  padding: var(--card-padding-md);
}

/* 自定义：彩色卡片 */
.card-gradient {
  background: linear-gradient(135deg, rgba(199, 36, 113, 0.8), rgba(234, 243, 83, 0.8));
  backdrop-filter: blur(10px);
  color: white;
  border: none;
  border-radius: var(--card-radius-lg);
  padding: var(--card-padding-md);
}
```

然后在组件中使用：
```tsx
<div className="card-dark">深色卡片</div>
<div className="card-gradient">渐变卡片</div>
```

---

## 📋 常见使用场景

### 场景 1：活动列表卡片
```tsx
<div className="card-glass card-clickable" onClick={() => goToEvent(event.id)}>
  <img src={event.cover} alt={event.name} />
  <h3 className="card-title">{event.name}</h3>
  <p className="card-body">{event.description}</p>
</div>
```

---

### 场景 2：用户信息卡片
```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">个人信息</h3>
    <p className="card-subtitle">查看和编辑你的资料</p>
  </div>
  <div className="card-body">
    <p>昵称：{user.nickname}</p>
    <p>邮箱：{user.email}</p>
  </div>
  <div className="card-footer">
    <button>编辑资料</button>
  </div>
</div>
```

---

### 场景 3：登录/注册表单
```tsx
<div className="card-form">
  <h1 className="card-title">欢迎登录</h1>
  <form>
    <input type="email" placeholder="邮箱" />
    <input type="password" placeholder="密码" />
    <button type="submit">登录</button>
  </form>
</div>
```

---

### 场景 4：管理后台导航卡片
```tsx
<div className="card-admin card-clickable" onClick={() => navigate('/admin/users')}>
  <h3 className="card-title">👥 用户管理</h3>
  <p className="card-subtitle">管理所有用户账号</p>
</div>
```

---

### 场景 5：消息列表
```tsx
{conversations.map(conv => (
  <div key={conv.id} className="card-list-item">
    <img src={conv.user.avatar} alt={conv.user.name} />
    <div>
      <h4 className="card-title">{conv.user.name}</h4>
      <p className="card-body">{conv.lastMessage}</p>
    </div>
  </div>
))}
```

---

## 🔧 与 Tailwind 的兼容性

### 已覆盖的 Tailwind 类

为了统一样式，以下 Tailwind 类会自动使用我们的卡片变量：

```css
.bg-white       → 使用 --card-bg-solid
.bg-white/80    → 使用 --card-bg-glass
.bg-gray-50     → 使用 --card-bg-light
.bg-gray-100    → 使用 --card-bg-subtle
```

**这意味着：**
你可以继续使用 Tailwind 类，它们会自动应用统一的卡片样式：

```tsx
{/* 这两种写法效果相同 */}
<div className="card">...</div>
<div className="bg-white rounded-lg shadow p-6">...</div>
```

---

### 组合使用

你可以混合使用预定义卡片类和 Tailwind 工具类：

```tsx
<div className="card mt-4 max-w-2xl mx-auto">
  {/* card 提供基础样式 */}
  {/* mt-4 添加上边距 */}
  {/* max-w-2xl mx-auto 控制宽度和居中 */}
  内容
</div>
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **使用预定义类**
   ```tsx
   <div className="card">...</div>
   ```

2. **场景选择合适的卡片类型**
   - 详情页 → `.card`
   - 列表项 → `.card-glass` 或 `.card-list-item`
   - 浮动面板 → `.card-glass`
   - 表单页 → `.card-form`

3. **使用卡片组件类**
   ```tsx
   <div className="card">
     <div className="card-header">...</div>
     <div className="card-body">...</div>
     <div className="card-footer">...</div>
   </div>
   ```

---

### ❌ 不推荐做法

1. **避免内联样式覆盖**
   ```tsx
   {/* ❌ 不推荐 */}
   <div className="card" style={{backgroundColor: 'white'}}>...</div>

   {/* ✅ 推荐：创建新的卡片类 */}
   <div className="card-custom">...</div>
   ```

2. **避免过度自定义**
   ```tsx
   {/* ❌ 不推荐 */}
   <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">...</div>

   {/* ✅ 推荐 */}
   <div className="card card-lg">...</div>
   ```

---

## 🐛 常见问题

### Q1：卡片背景不透明？
**检查：**
1. 是否使用了正确的类名（`.card-glass` 而不是 `.card`）
2. 是否有其他 CSS 覆盖了背景样式
3. 浏览器是否支持 `backdrop-filter`

**解决：**
```tsx
{/* 确保使用毛玻璃卡片类 */}
<div className="card-glass">...</div>
```

---

### Q2：悬停效果不起作用？
**检查：**
是否添加了 `.card-clickable` 类？

**解决：**
```tsx
<div className="card card-clickable" onClick={...}>
  可点击的卡片
</div>
```

---

### Q3：想要全局改变所有卡片的透明度？
**解决：**
编辑 `apps/web/styles/cards.css`：
```css
:root {
  --card-bg-glass: rgba(255, 255, 255, 0.9);  /* 从 0.8 改为 0.9 */
}
```

保存后所有使用 `.card-glass` 的卡片都会更新。

---

### Q4：如何让某个卡片完全不透明？
**解决：**
使用 `.card` 而不是 `.card-glass`，或者直接使用 Tailwind：
```tsx
<div className="card opacity-100">...</div>
```

---

### Q5：卡片圆角太大/太小？
**解决：**
方式 1：使用尺寸变体
```tsx
<div className="card card-sm">小圆角</div>
<div className="card">默认圆角</div>
<div className="card card-lg">大圆角</div>
```

方式 2：修改全局配置
编辑 `apps/web/styles/cards.css`：
```css
:root {
  --card-radius-lg: 0.5rem;  /* 改为更小的圆角 */
}
```

---

## ✨ 卡片系统配置完成！

现在所有卡片样式都已统一，后续只需要：
1. 使用预定义的卡片类
2. 需要调整时修改 `apps/web/styles/cards.css` 中的变量
3. 需要新样式时在该文件中添加新的卡片类

所有卡片会自动保持风格一致！

---

# 📚 附录

## 完整的样式文件列表

```
apps/web/
├── app/
│   └── globals.css          # 导入所有样式文件
└── styles/
    ├── background.css       # 背景配置（第一部分）
    └── cards.css            # 卡片样式（第二部分）
```

## 修改样式的优先级

1. **最优先**：修改 CSS 变量（`:root` 中的变量）
   - 影响：全局所有使用该变量的元素
   - 文件：`background.css` 或 `cards.css`

2. **次优先**：修改预定义类（`.card`, `.card-glass` 等）
   - 影响：所有使用该类的元素
   - 文件：`cards.css`

3. **最后**：创建新的自定义类
   - 影响：仅使用该新类的元素
   - 文件：`cards.css` 末尾添加

## 快速参考

### 背景系统
- 文件：`apps/web/styles/background.css`
- 当前背景色：`#C72471`（深粉色）
- 切换图片：取消注释 `--app-bg-image` 相关行

### 卡片系统
- 文件：`apps/web/styles/cards.css`
- 常用类：`.card`, `.card-glass`, `.card-clickable`
- 自定义：修改 `:root` 中的 CSS 变量

---

## 🎉 全部完成！

现在你的网站拥有完整统一的背景和卡片样式系统，所有修改都在两个文件中完成！
