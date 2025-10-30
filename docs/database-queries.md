# 数据库常用查询

## 快速连接

```bash
# Windows PowerShell 或 CMD
$env:PGPASSWORD="Liniuniu@7626"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d piaociyuan

# 或者使用环境变量
PGPASSWORD="Liniuniu@7626" "/c/Program Files/PostgreSQL/18/bin/psql.exe" -U postgres -d piaociyuan
```

## 基础查询

### 查看所有表
```sql
\dt
```

### 查看表结构
```sql
-- 查看 users 表结构
\d users

-- 查看 login_logs 表结构
\d login_logs

-- 查看 user_sessions 表结构
\d user_sessions
```

### 统计数据
```sql
-- 统计用户数
SELECT COUNT(*) FROM users;

-- 统计登录日志数
SELECT COUNT(*) FROM login_logs;

-- 统计活跃会话数
SELECT COUNT(*) FROM user_sessions WHERE revoked = false;
```

## 用户相关查询

### 查看所有用户
```sql
SELECT
  id,
  email,
  phone,
  nickname,
  "authProvider",
  "createdAt"
FROM users
ORDER BY "createdAt" DESC;
```

### 查看最近注册的用户
```sql
SELECT
  id,
  email,
  nickname,
  "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 10;
```

### 按注册方式统计用户
```sql
SELECT
  "authProvider",
  COUNT(*) as count
FROM users
GROUP BY "authProvider";
```

### 查找特定用户
```sql
-- 按邮箱查找
SELECT * FROM users WHERE email = 'user@example.com';

-- 按手机号查找
SELECT * FROM users WHERE phone = '13800138000';

-- 按ID查找
SELECT * FROM users WHERE id = 'user-uuid-here';
```

## 登录日志查询

### 查看最近的登录记录
```sql
SELECT
  l.id,
  l."userId",
  u.email,
  u.nickname,
  l."ipAddress",
  l.success,
  l."failReason",
  l."createdAt"
FROM login_logs l
JOIN users u ON l."userId" = u.id
ORDER BY l."createdAt" DESC
LIMIT 20;
```

### 统计登录成功/失败次数
```sql
SELECT
  success,
  COUNT(*) as count
FROM login_logs
GROUP BY success;
```

### 查看某个用户的登录历史
```sql
SELECT
  "ipAddress",
  "userAgent",
  success,
  "failReason",
  "createdAt"
FROM login_logs
WHERE "userId" = 'user-uuid-here'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### 查看失败的登录尝试
```sql
SELECT
  l."userId",
  u.email,
  l."ipAddress",
  l."failReason",
  l."createdAt"
FROM login_logs l
JOIN users u ON l."userId" = u.id
WHERE l.success = false
ORDER BY l."createdAt" DESC;
```

### 统计最近24小时的登录次数
```sql
SELECT
  DATE_TRUNC('hour', "createdAt") as hour,
  COUNT(*) as login_count
FROM login_logs
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

## 会话管理查询

### 查看所有活跃会话
```sql
SELECT
  s.id,
  s."userId",
  u.email,
  u.nickname,
  s."deviceInfo",
  s."ipAddress",
  s."expiresAt",
  s."createdAt"
FROM user_sessions s
JOIN users u ON s."userId" = u.id
WHERE s.revoked = false
  AND s."expiresAt" > NOW()
ORDER BY s."createdAt" DESC;
```

### 查看某个用户的所有会话
```sql
SELECT
  id,
  "deviceInfo",
  "ipAddress",
  revoked,
  "expiresAt",
  "createdAt"
FROM user_sessions
WHERE "userId" = 'user-uuid-here'
ORDER BY "createdAt" DESC;
```

### 统计在线用户数
```sql
SELECT COUNT(DISTINCT "userId") as online_users
FROM user_sessions
WHERE revoked = false
  AND "expiresAt" > NOW();
```

### 查看即将过期的会话
```sql
SELECT
  s.id,
  s."userId",
  u.email,
  s."expiresAt",
  s."createdAt"
FROM user_sessions s
JOIN users u ON s."userId" = u.id
WHERE s.revoked = false
  AND s."expiresAt" BETWEEN NOW() AND NOW() + INTERVAL '1 day'
ORDER BY s."expiresAt" ASC;
```

## 安全相关查询

### 查找多次登录失败的 IP
```sql
SELECT
  "ipAddress",
  COUNT(*) as fail_count,
  MAX("createdAt") as last_attempt
FROM login_logs
WHERE success = false
  AND "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY "ipAddress"
HAVING COUNT(*) > 3
ORDER BY fail_count DESC;
```

### 查找异常登录（短时间内多次登录）
```sql
SELECT
  "userId",
  COUNT(*) as login_count,
  COUNT(DISTINCT "ipAddress") as ip_count
FROM login_logs
WHERE success = true
  AND "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY "userId"
HAVING COUNT(*) > 10
ORDER BY login_count DESC;
```

### 查看多设备登录的用户
```sql
SELECT
  s."userId",
  u.email,
  COUNT(*) as session_count
FROM user_sessions s
JOIN users u ON s."userId" = u.id
WHERE s.revoked = false
  AND s."expiresAt" > NOW()
GROUP BY s."userId", u.email
HAVING COUNT(*) > 1
ORDER BY session_count DESC;
```

## 数据清理

### 清理过期的会话（手动）
```sql
DELETE FROM user_sessions
WHERE "expiresAt" < NOW();
```

### 查看可清理的过期会话数量
```sql
SELECT COUNT(*) as expired_sessions
FROM user_sessions
WHERE "expiresAt" < NOW();
```

### 撤销某个用户的所有会话
```sql
UPDATE user_sessions
SET revoked = true,
    "updatedAt" = NOW()
WHERE "userId" = 'user-uuid-here';
```

## 分析查询

### 用户增长趋势（每天）
```sql
SELECT
  DATE("createdAt") as date,
  COUNT(*) as new_users
FROM users
WHERE "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

### 登录活跃度（每天）
```sql
SELECT
  DATE("createdAt") as date,
  COUNT(*) as login_count,
  COUNT(DISTINCT "userId") as unique_users
FROM login_logs
WHERE success = true
  AND "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

### 最活跃用户（登录次数）
```sql
SELECT
  u.id,
  u.email,
  u.nickname,
  COUNT(*) as login_count
FROM login_logs l
JOIN users u ON l."userId" = u.id
WHERE l.success = true
  AND l."createdAt" > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, u.nickname
ORDER BY login_count DESC
LIMIT 10;
```

## 维护命令

### 查看数据库大小
```sql
SELECT
  pg_size_pretty(pg_database_size('piaociyuan')) as database_size;
```

### 查看各表大小
```sql
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
```

### 查看索引使用情况
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 退出 psql
```sql
\q
```
