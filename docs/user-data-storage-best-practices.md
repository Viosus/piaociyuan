# 主流社交软件用户信息存储最佳实践

## 目录
1. [主流社交软件存储方案对比](#主流社交软件存储方案对比)
2. [数据库选择](#数据库选择)
3. [用户信息存储架构](#用户信息存储架构)
4. [安全最佳实践](#安全最佳实践)
5. [你的项目现状分析](#你的项目现状分析)
6. [改进建议](#改进建议)

---

## 主流社交软件存储方案对比

### 1. 微信 (WeChat)
**数据库类型**:
- 关系型数据库：MySQL / PostgreSQL (核心业务)
- NoSQL：Redis (缓存、会话)
- MongoDB (日志、消息记录)
- HBase (历史消息、朋友圈)

**存储架构**:
```
用户基础信息表 (users)
├── 用户ID (主键, 唯一)
├── 微信号 (唯一索引)
├── 手机号 (加密存储, 唯一索引)
├── 昵称
├── 头像URL
├── 密码哈希 (bcrypt/argon2)
├── 盐值 (salt)
├── 账号状态
├── 创建时间
└── 最后登录时间

用户扩展信息表 (user_profiles)
├── 用户ID (外键)
├── 性别
├── 地区
├── 个性签名
├── 二维码
└── 隐私设置 (JSON)

用户安全表 (user_security)
├── 用户ID (外键)
├── 登录设备列表 (JSON)
├── 密保问题
├── 人脸识别数据
└── 实名认证信息 (加密)
```

**关键特点**:
- **分表存储**: 基础信息、扩展信息、安全信息分开
- **读写分离**: 主库写，从库读
- **分库分表**: 按用户ID哈希分片
- **冷热分离**: 活跃用户数据在热存储，历史数据归档

---

### 2. Twitter / X
**数据库类型**:
- MySQL (用户基础信息)
- Manhattan (Twitter自研分布式数据库)
- Redis (缓存)
- Memcached (会话管理)

**存储特点**:
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    bio TEXT,
    avatar_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

CREATE TABLE user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_info JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**关键特点**:
- **Snowflake ID**: 分布式唯一ID生成
- **会话独立表**: session 信息单独存储
- **索引优化**: 所有查询字段都有索引

---

### 3. Facebook / Instagram (Meta)
**数据库类型**:
- MySQL (用户基础数据)
- TAO (Facebook自研图数据库缓存)
- Cassandra (消息、动态)
- Memcache (分布式缓存)

**存储架构**:
```
分层存储策略：

L1: Memcache (毫秒级响应)
    ├── 用户基础信息缓存
    └── 会话Token

L2: TAO (图数据缓存层)
    ├── 社交关系图
    └── 用户关联数据

L3: MySQL (持久化存储)
    ├── 用户表 (分片)
    ├── 认证表
    └── 隐私设置表

L4: Hadoop/Hive (冷数据)
    └── 历史数据归档
```

**关键特点**:
- **多层缓存**: 减少数据库压力
- **地理分布**: 数据中心全球分布
- **数据复制**: 多副本保证可用性

---

## 数据库选择

### 关系型数据库 (RDBMS)
适用于：核心用户信息、交易数据

| 数据库 | 适用场景 | 优点 | 缺点 |
|--------|---------|------|------|
| **PostgreSQL** | 中大型应用 | ACID完整、JSON支持、扩展性强 | 配置复杂 |
| **MySQL** | 中小型应用 | 生态成熟、易部署 | 并发性能较弱 |
| **SQLite** | 小型应用、开发环境 | 零配置、轻量级 | 不支持高并发 |

### NoSQL数据库
适用于：缓存、会话、日志、消息

| 数据库 | 适用场景 |
|--------|---------|
| **Redis** | 缓存、会话存储、实时排行榜 |
| **MongoDB** | 灵活文档存储、日志 |
| **Cassandra** | 大规模写入、消息存储 |

---

## 用户信息存储架构

### 架构层级

```
┌─────────────────────────────────────────┐
│         应用层 (Next.js API)            │
│  - 业务逻辑                              │
│  - 数据验证                              │
│  - Token生成/验证                        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         缓存层 (Redis)                  │
│  - 用户Session                          │
│  - 热点数据缓存                          │
│  - 登录限流                              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│    数据访问层 (ORM / Query Builder)     │
│  - Prisma ORM                           │
│  - SQL优化                               │
│  - 连接池管理                            │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      数据库层 (PostgreSQL/MySQL)        │
│  - users (基础信息)                      │
│  - user_profiles (扩展信息)              │
│  - user_security (安全信息)              │
│  - user_sessions (会话管理)              │
└─────────────────────────────────────────┘
```

---

## 安全最佳实践

### 1. 密码存储
```javascript
// ❌ 错误做法
password: user.password  // 明文存储

// ✅ 正确做法 - bcrypt
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 12);  // 12轮salt

// ✅ 更安全 - argon2 (推荐)
import argon2 from 'argon2';
const hashedPassword = await argon2.hash(password);
```

**主流社交软件使用**:
- 微信: Argon2id
- Twitter: bcrypt (14轮)
- Facebook: scrypt

### 2. 敏感信息加密
```javascript
// 加密手机号、邮箱、身份证等
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

### 3. Token管理
```javascript
// JWT Token 最佳实践
{
    "sub": "user_id",               // 用户ID
    "iat": 1234567890,              // 签发时间
    "exp": 1234567890,              // 过期时间 (短期：15分钟)
    "jti": "unique_token_id",       // Token唯一ID
    "type": "access"                // access | refresh
}

// Refresh Token 存储在数据库
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    device_info JSON,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. 数据库安全
```sql
-- 行级安全 (PostgreSQL)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON users
    USING (id = current_user_id());

-- 字段级加密
CREATE EXTENSION pgcrypto;

INSERT INTO users (email, phone)
VALUES (
    pgp_sym_encrypt('user@email.com', 'encryption_key'),
    pgp_sym_encrypt('13800138000', 'encryption_key')
);
```

### 5. 索引优化
```sql
-- 常用查询字段建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 复合索引 (多条件查询)
CREATE INDEX idx_users_status_created ON users(status, created_at);

-- 唯一索引 (防止重复)
CREATE UNIQUE INDEX idx_users_email_unique ON users(email)
    WHERE email IS NOT NULL;
```

---

## 你的项目现状分析

### 当前实现
```typescript
// prisma/schema.prisma
model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  phone         String?  @unique
  password      String?  // bcrypt加密
  nickname      String?
  avatar        String?
  wechatOpenId  String?  @unique
  qqOpenId      String?  @unique
  authProvider  String   @default("local")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 存储方式
- **数据库**: SQLite (`prisma/dev.db`)
- **访问方式**: better-sqlite3 (直接SQL)
- **密码加密**: bcryptjs (10轮salt)
- **认证**: JWT Token (7天有效期)

### 优点
1. ✅ 密码使用bcrypt加密存储
2. ✅ 邮箱、手机号设置唯一索引
3. ✅ 支持多种登录方式 (邮箱/手机/第三方)
4. ✅ 使用JWT进行无状态认证
5. ✅ 用户ID使用UUID (防止被枚举)

### 问题
1. ❌ SQLite不适合生产环境 (不支持高并发)
2. ❌ 密码Salt轮数偏低 (建议12-14轮)
3. ❌ 敏感信息 (手机号/邮箱) 未加密存储
4. ❌ JWT密钥使用默认值，不安全
5. ❌ Token过期时间太长 (7天)
6. ❌ 没有Refresh Token机制
7. ❌ 没有Session管理 (无法撤销Token)
8. ❌ 缺少登录日志/审计功能
9. ❌ 所有信息在一个表 (应该分表)

---

## 改进建议

### 短期改进 (立即可做)

#### 1. 升级到生产数据库
```bash
# 安装 PostgreSQL
npm install pg

# 修改 .env
DATABASE_URL="postgresql://user:password@localhost:5432/piaociyuan"

# 更新 schema.prisma
datasource db {
  provider = "postgresql"  // 改为 postgresql
  url      = env("DATABASE_URL")
}
```

#### 2. 增强JWT安全性
```typescript
// .env
JWT_SECRET="使用以下命令生成真正的随机密钥"
// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_ACCESS_EXPIRES="15m"    // Access Token: 15分钟
JWT_REFRESH_EXPIRES="7d"    // Refresh Token: 7天
```

#### 3. 增加密码强度
```typescript
// lib/auth.ts
const SALT_ROUNDS = 12;  // 从10改为12

// 或使用更安全的 argon2
import argon2 from 'argon2';
export async function hashPassword(password: string) {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
    });
}
```

#### 4. 敏感信息加密
```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const algorithm = 'aes-256-gcm';

export function encryptField(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptField(encrypted: string): string {
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
```

#### 5. 添加登录日志
```prisma
model LoginLog {
  id         String   @id @default(uuid())
  userId     String
  ipAddress  String
  userAgent  String
  location   String?
  success    Boolean
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("login_logs")
}
```

### 中期改进 (1-2周)

#### 1. 分表设计
```prisma
// 用户基础表
model User {
  id           String       @id @default(uuid())
  username     String       @unique
  email        String?      @unique
  phone        String?      @unique
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  profile      UserProfile?
  security     UserSecurity?
  sessions     UserSession[]
  loginLogs    LoginLog[]
}

// 用户资料表
model UserProfile {
  userId       String   @id
  nickname     String?
  avatar       String?
  bio          String?
  birthday     DateTime?
  gender       String?
  location     String?

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 用户安全表
model UserSecurity {
  userId          String   @id
  password        String?  // bcrypt/argon2 hash
  passwordUpdatedAt DateTime?
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?

  // 第三方登录
  wechatOpenId    String?  @unique
  qqOpenId        String?  @unique
  googleId        String?  @unique

  authProvider    String   @default("local")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 会话表
model UserSession {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  refreshToken String  @unique
  expiresAt   DateTime
  deviceInfo  Json?
  ipAddress   String?
  revoked     Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
}
```

#### 2. 实现 Refresh Token
```typescript
// app/api/auth/refresh/route.ts
export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();

  // 验证 refresh token
  const session = await findSessionByRefreshToken(refreshToken);
  if (!session || session.revoked || new Date() > session.expiresAt) {
    return NextResponse.json({ error: '无效的刷新令牌' }, { status: 401 });
  }

  // 生成新的 access token
  const newAccessToken = generateAccessToken(session.userId);

  return NextResponse.json({ accessToken: newAccessToken });
}
```

#### 3. 添加 Redis 缓存
```typescript
// lib/redis.ts
import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);

// 缓存用户信息
export async function cacheUser(userId: string, user: any) {
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
}

export async function getCachedUser(userId: string) {
    const cached = await redis.get(`user:${userId}`);
    return cached ? JSON.parse(cached) : null;
}
```

### 长期改进 (1-3个月)

1. **分库分表**: 按用户ID哈希分片
2. **读写分离**: 主从复制
3. **CDN**: 头像等静态资源上传到OSS
4. **监控告警**: 登录异常检测
5. **数据备份**: 定期备份策略
6. **合规性**: GDPR/隐私政策

---

## 快速实施指南

### Step 1: 切换到 PostgreSQL
```bash
# 1. 安装 PostgreSQL
brew install postgresql  # macOS
# 或访问 https://www.postgresql.org/download/

# 2. 创建数据库
createdb piaociyuan

# 3. 更新项目
npm install pg
```

```env
# .env
DATABASE_URL="postgresql://localhost:5432/piaociyuan"
JWT_SECRET="运行 node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\" 生成"
ENCRYPTION_KEY="运行 node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" 生成"
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
# 4. 迁移数据库
npx prisma migrate dev --name init_postgresql
npx prisma generate
```

### Step 2: 应用分表设计
复制上面的完整 schema，运行迁移：
```bash
npx prisma migrate dev --name split_user_tables
```

### Step 3: 更新 Auth 逻辑
```typescript
// lib/auth.ts
import argon2 from 'argon2';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  // 推荐使用 argon2
  return argon2.hash(password);

  // 或继续用 bcrypt 但提高轮数
  // return bcrypt.hash(password, 12);
}

export function generateAccessToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(user: UserPayload): string {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
}
```

---

## 总结对比

| 特性 | 你的项目 (当前) | 主流社交软件 | 建议改进 |
|------|----------------|--------------|---------|
| 数据库 | SQLite | PostgreSQL/MySQL | ✅ 切换到 PostgreSQL |
| 密码加密 | bcrypt (10轮) | argon2/bcrypt (12+) | ✅ 增加到12轮或用argon2 |
| 敏感信息 | 明文 | AES-256加密 | ✅ 加密手机/邮箱 |
| Token机制 | JWT (7天) | Access (15m) + Refresh (7d) | ✅ 实现双Token |
| 会话管理 | 无 | 数据库Session表 | ✅ 添加Session管理 |
| 缓存 | 无 | Redis多层缓存 | ⏳ 后期添加Redis |
| 分表 | 单表 | 多表分离 | ✅ 分离基础/扩展/安全表 |
| 日志 | 无 | 完整审计日志 | ✅ 添加登录日志 |
| 扩展性 | 差 | 分库分表 | ⏳ 后期考虑 |

## 参考资料
- [OWASP 密码存储备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [PostgreSQL 安全最佳实践](https://www.postgresql.org/docs/current/security.html)
- [JWT 最佳实践](https://datatracker.ietf.org/doc/html/rfc8725)
- [NIST 密码指南](https://pages.nist.gov/800-63-3/sp800-63b.html)
