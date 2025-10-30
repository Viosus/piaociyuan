# PostgreSQL 安装与迁移指南

## 当前进度

✅ **所有代码改进已完成！**

以下内容已经更新：
- ✅ 密码加密强度提升（10轮 → 12轮）
- ✅ 实现双 Token 机制（Access Token 15分钟 + Refresh Token 7天）
- ✅ 添加登录日志功能
- ✅ 添加会话管理（Session）
- ✅ 创建敏感信息加密工具
- ✅ 更新环境变量配置
- ✅ 更新所有认证 API

**下一步：安装 PostgreSQL 并迁移数据库**

---

## 第一步：安装 PostgreSQL

### Windows 系统安装（推荐）

#### 方案1：官方安装包

1. **下载 PostgreSQL 16**
   - 访问：https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - 选择：Windows x86-64，版本 16.x
   - 下载大小：约 350MB

2. **运行安装程序**
   ```
   postgresql-16.x-windows-x64.exe
   ```

3. **安装步骤**

   **步骤1：选择安装目录**
   ```
   默认：C:\Program Files\PostgreSQL\16
   建议：保持默认
   ```

   **步骤2：选择组件**（全选）
   ```
   ☑ PostgreSQL Server（必选）
   ☑ pgAdmin 4（图形管理工具，强烈推荐）
   ☑ Stack Builder（可选）
   ☑ Command Line Tools（必选）
   ```

   **步骤3：数据存储目录**
   ```
   默认：C:\Program Files\PostgreSQL\16\data
   建议：保持默认
   ```

   **步骤4：设置超级用户密码**
   ```
   用户名：postgres（默认，不可更改）
   密码：postgres123（自己设置，记住这个密码！）

   ⚠️ 重要：请记住这个密码，后面配置需要用到
   ```

   **步骤5：设置端口**
   ```
   默认：5432
   建议：保持默认

   ⚠️ 如果端口被占用，可以改为 5433
   ```

   **步骤6：选择语言环境**
   ```
   默认：[Default locale]
   建议：保持默认
   ```

   **步骤7：完成安装**
   - 等待安装完成（约2-3分钟）
   - 取消勾选 "Launch Stack Builder"
   - 点击 "Finish"

4. **验证安装**

   打开 PowerShell 或 CMD，运行：
   ```bash
   psql --version
   ```

   应该看到类似输出：
   ```
   psql (PostgreSQL) 16.x
   ```

   如果提示 "psql 不是内部或外部命令"，需要添加到 PATH：
   - 添加路径：`C:\Program Files\PostgreSQL\16\bin`
   - 或重启电脑后自动生效

---

## 第二步：创建数据库

### 方式1：使用 pgAdmin 4（图形界面，推荐新手）

1. **打开 pgAdmin 4**
   - 开始菜单 → PostgreSQL 16 → pgAdmin 4
   - 首次打开会要求设置 Master Password，随意设置即可

2. **连接到服务器**
   - 左侧：Servers → PostgreSQL 16
   - 输入你设置的超级用户密码（postgres123）

3. **创建数据库**
   - 右键 "Databases" → Create → Database
   - Database name: `piaociyuan`
   - Owner: `postgres`
   - 点击 "Save"

### 方式2：使用命令行（推荐熟悉命令行的用户）

打开 PowerShell 或 CMD：

```bash
# 方法1：直接创建（推荐）
createdb -U postgres piaociyuan

# 如果提示输入密码，输入你之前设置的密码：postgres123

# 方法2：通过 psql 创建
psql -U postgres
# 输入密码后，在 psql 提示符下执行：
CREATE DATABASE piaociyuan;
\q
```

### 验证数据库创建成功

```bash
psql -U postgres -l
```

应该能看到 `piaociyuan` 数据库在列表中。

---

## 第三步：更新环境变量

你的 `.env` 文件已经更新好了，但请确认数据库连接字符串中的密码：

```env
# 打开 .env 文件，确认这行配置
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/piaociyuan"
```

**格式说明**：
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]
```

**如果你的密码不是 `postgres123`，请修改这里！**

例如，如果你的密码是 `mypassword`：
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/piaociyuan"
```

---

## 第四步：运行数据库迁移

现在回到你的项目目录，运行迁移命令：

### 1. 生成 Prisma Client

```bash
npx prisma generate
```

### 2. 运行数据库迁移

```bash
npx prisma migrate dev --name init_postgresql
```

这个命令会：
- 创建所有表（users, events, tiers, holds, orders, login_logs, user_sessions）
- 创建所有索引
- 生成迁移文件

**预期输出**：
```
✔ Generated Prisma Client
✔ Your database is now in sync with your schema.

Running generate... (Use --skip-generate to skip the generators)
✔ Generated Prisma Client to .\node_modules\@prisma\client
```

### 3. 查看数据库结构（可选）

```bash
npx prisma studio
```

会打开浏览器，可以可视化地查看和管理数据库。

---

## 第五步：迁移旧数据（可选）

如果你想保留 SQLite 中的现有用户数据：

### 查看现有用户

```bash
node scripts/view-users.js
```

### 手动迁移步骤

1. **导出 SQLite 数据**
   - 你目前有 1 个用户：liniuniu7626@gmail.com

2. **在新数据库中重新注册**
   - 访问：http://localhost:3000/auth/register
   - 使用相同的邮箱重新注册

**注意**：由于密码是加密存储的，无法直接迁移。用户需要重新注册或重置密码。

---

## 第六步：启动并测试

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 测试注册功能

访问：http://localhost:3000/auth/register

填写表单注册一个新用户，检查：
- ✅ 注册成功
- ✅ 自动登录
- ✅ 返回 accessToken 和 refreshToken

### 3. 测试登录功能

访问：http://localhost:3000/auth/login

使用刚注册的账号登录，检查：
- ✅ 登录成功
- ✅ 返回双 Token

### 4. 查看数据库（使用 Prisma Studio）

```bash
npx prisma studio
```

打开浏览器，检查：
- ✅ users 表有新用户
- ✅ user_sessions 表有会话记录
- ✅ login_logs 表有登录日志

---

## 新功能说明

### 1. 双 Token 机制

**Access Token（访问令牌）**
- 有效期：15分钟
- 用途：API 请求认证
- 存储：前端内存（不建议存 localStorage）

**Refresh Token（刷新令牌）**
- 有效期：7天
- 用途：刷新 Access Token
- 存储：localStorage 或 httpOnly Cookie

**使用流程**：
```javascript
// 登录后保存两个 token
const { accessToken, refreshToken } = loginResponse.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// API 请求使用 accessToken
fetch('/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// 当 accessToken 过期（401错误），使用 refreshToken 刷新
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
});

const { accessToken: newAccessToken } = response.data;
localStorage.setItem('accessToken', newAccessToken);
```

### 2. 登录日志

记录每次登录尝试（成功或失败）：
```javascript
// 查看用户登录历史
// 可以在后台管理中展示
```

### 3. 会话管理

**查看活跃会话**：
- 用户可以看到所有登录的设备
- 可以远程登出某个设备

**登出单个设备**：
```javascript
POST /api/auth/logout
{ refreshToken: "当前设备的token" }
```

**登出所有设备**：
```javascript
POST /api/auth/logout
{ refreshToken: "任意token", logoutAll: true }
```

### 4. 安全增强

- ✅ 密码加密：bcrypt 12轮（比之前更安全）
- ✅ JWT 密钥：使用了强随机密钥
- ✅ Token 过期：Access Token 15分钟（降低风险）
- ✅ 会话管理：可以撤销 Token（之前做不到）
- ✅ 登录日志：可追踪异常登录

---

## 常见问题

### Q1: 安装 PostgreSQL 时提示端口 5432 被占用

**解决方案**：
1. 安装时选择其他端口（如 5433）
2. 更新 `.env` 中的 DATABASE_URL：
   ```env
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/piaociyuan"
   ```

### Q2: psql 命令找不到

**解决方案**：
1. 重启电脑（安装程序会自动添加到 PATH）
2. 或手动添加到系统 PATH：
   - 路径：`C:\Program Files\PostgreSQL\16\bin`
   - 系统设置 → 高级系统设置 → 环境变量 → Path → 新建

### Q3: 迁移时报错 "password authentication failed"

**解决方案**：
- 检查 `.env` 中的密码是否正确
- 确认密码和安装时设置的一致

### Q4: 想暂时继续使用 SQLite

**解决方案**：
在 `.env` 中注释掉 PostgreSQL，使用 SQLite：
```env
# DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/piaociyuan"
DATABASE_URL="file:./prisma/dev.db"
```

然后在 `schema.prisma` 中改回：
```prisma
datasource db {
  provider = "sqlite"  // 改回 sqlite
  url      = env("DATABASE_URL")
}
```

运行：
```bash
npx prisma migrate dev --name back_to_sqlite
```

### Q5: 前端代码需要修改吗？

**需要小幅修改**：

原来的登录/注册代码：
```javascript
// 旧代码
localStorage.setItem('token', data.data.token);

// 新代码（向后兼容，但建议升级）
localStorage.setItem('accessToken', data.data.accessToken);
localStorage.setItem('refreshToken', data.data.refreshToken);

// 或者继续用 token（也能工作）
localStorage.setItem('token', data.data.token);
```

---

## 下一步建议

短期改进已全部完成！🎉

如果想继续优化，可以考虑：

### 中期改进（1-2周）
1. **分表设计**：将 User 表拆分为 User、UserProfile、UserSecurity
2. **添加 Redis**：缓存热点数据
3. **邮件通知**：异常登录提醒

### 长期改进（1-3个月）
1. **读写分离**：主从复制
2. **分库分表**：用户量大时按 ID 哈希
3. **监控告警**：集成监控系统

---

## 总结

你已经完成了所有短期改进：

| 改进项 | 状态 |
|--------|------|
| ✅ 升级到 PostgreSQL | 待安装 |
| ✅ 增强 JWT 安全性 | 已完成 |
| ✅ 提升密码强度 | 已完成 |
| ✅ 实现双 Token 机制 | 已完成 |
| ✅ 添加登录日志 | 已完成 |
| ✅ 会话管理 | 已完成 |
| ✅ 敏感信息加密工具 | 已完成 |

**按照本指南安装 PostgreSQL 并迁移数据库后，所有改进就全部生效了！**

如有问题，随时询问。
