# 管理后台功能测试清单

## 准备工作

### 1. 创建管理员账户
```sql
-- 在数据库中执行
UPDATE users SET role = 'admin' WHERE phone = '你的手机号';
```

### 2. 登录管理员账户
- 访问 http://localhost:3000/auth/login
- 使用管理员账号登录
- 确认侧边栏出现"🛡️ 管理后台"入口

---

## 功能测试

### ✅ 1. 举报管理 (`/admin/reports`)

**测试步骤**：
1. 打开 `/admin/reports`
2. 查看是否能看到举报列表
3. 点击某个举报的"审核"按钮
4. 选择"批准并隐藏帖子" → 确认帖子被隐藏
5. 选择"拒绝举报" → 确认举报状态变为已拒绝

**验证数据库**：
```sql
-- 检查举报状态
SELECT id, status FROM post_reports WHERE id = '举报ID';

-- 检查帖子是否被隐藏
SELECT id, isVisible FROM posts WHERE id = '帖子ID';
```

---

### ✅ 2. 用户管理 (`/admin/users`)

**测试步骤**：
1. 打开 `/admin/users`
2. 搜索用户
3. 点击"设为管理员" → 确认用户角色变为 admin
4. 点击"取消管理员" → 确认用户角色变为 user
5. ⚠️ **删除用户需谨慎测试**（会永久删除数据）

**验证数据库**：
```sql
-- 检查用户角色
SELECT id, phone, nickname, role FROM users WHERE id = '用户ID';
```

---

### ✅ 3. 帖子管理 (`/admin/posts`)

**测试步骤**：
1. 打开 `/admin/posts`
2. 筛选"可见"或"已隐藏"
3. 点击"隐藏帖子" → 确认帖子不可见
4. 点击"显示帖子" → 确认帖子可见
5. ⚠️ **删除帖子需谨慎测试**（会永久删除帖子和评论）

**验证数据库**：
```sql
-- 检查帖子可见性
SELECT id, content, isVisible FROM posts WHERE id = '帖子ID';
```

---

### ✅ 4. 活动管理 (`/admin/events`)

**测试步骤**：
1. 打开 `/admin/events`
2. 查看活动列表
3. 按城市筛选
4. 搜索活动
5. ⚠️ **目前只有查看功能，无法修改**

**验证**：
- 能正确显示活动信息
- 筛选和搜索功能正常

---

### ✅ 5. NFT管理 (`/admin/nfts`)

**测试步骤**：
1. 打开 `/admin/nfts`
2. 查看NFT列表
3. 按分类筛选
4. 按来源筛选
5. ⚠️ **目前只有查看功能，无法修改**

**验证**：
- 能正确显示NFT信息
- 筛选功能正常

---

### ✅ 6. 认证审核 (`/admin/verifications`)

**前置条件**：先以普通用户身份提交认证申请

**测试步骤**：

#### 6.1 用户提交申请
1. 访问 `/account/verification`
2. 点击"申请认证"
3. 填写表单并提交
4. 确认申请记录显示"审核中"

**验证数据库**：
```sql
-- 检查申请记录
SELECT id, userId, status, verifiedType, realName
FROM verification_requests
WHERE status = 'pending';
```

#### 6.2 管理员审核
1. 打开 `/admin/verifications`
2. 查看待审核申请
3. 点击"审核"按钮

**测试批准**：
1. 点击"批准认证"
2. 确认申请状态变为"已通过"
3. 确认用户的 `isVerified` 变为 `true`

**验证数据库**：
```sql
-- 检查申请状态
SELECT id, status, reviewedBy, reviewedAt
FROM verification_requests
WHERE id = '申请ID';

-- 检查用户认证状态
SELECT id, isVerified, verifiedType, verifiedAt
FROM users
WHERE id = '用户ID';
```

**测试拒绝**：
1. 填写拒绝理由
2. 点击"拒绝申请"
3. 确认申请状态变为"已拒绝"
4. 确认显示拒绝理由

**验证数据库**：
```sql
-- 检查拒绝信息
SELECT id, status, rejectReason
FROM verification_requests
WHERE id = '申请ID';
```

---

## 🚨 生产环境部署前检查

### 1. 环境变量
```bash
# 确认以下环境变量已设置
✅ DATABASE_URL
✅ JWT_SECRET (必须是强密钥，至少32字符)
✅ JWT_ACCESS_EXPIRES
✅ JWT_REFRESH_EXPIRES
```

### 2. 数据库迁移
```bash
# 在服务器上运行
npx prisma migrate deploy
npx prisma generate
```

### 3. 创建管理员账户
```sql
-- 在生产数据库中执行
UPDATE users SET role = 'admin'
WHERE phone = '生产环境管理员手机号';
```

### 4. HTTPS配置
- ✅ 确保启用 SSL 证书
- ✅ JWT token 通过 HTTPS 传输
- ✅ Cookie 设置 `Secure` 标志

### 5. 安全检查
```typescript
// 确认所有管理员 API 都有权限检查
✅ 所有 /api/admin/* 路由都使用 requireAdmin()
✅ 错误信息在生产环境不暴露详细信息
✅ JWT_SECRET 使用强密钥
```

---

## 📝 预期结果

所有功能测试通过后，应该能看到：

1. ✅ 举报被正确处理，帖子可见性被更新
2. ✅ 用户角色被正确修改
3. ✅ 帖子可见性被正确控制
4. ✅ 活动和NFT信息正确显示
5. ✅ 认证申请被正确审核，用户认证状态被更新
6. ✅ 数据库中的数据与界面显示一致

---

## 🔧 常见问题排查

### 问题1：管理后台提示"需要管理员权限"
**解决**：
```sql
-- 检查用户角色
SELECT phone, role FROM users WHERE phone = '你的手机号';

-- 设置为管理员
UPDATE users SET role = 'admin' WHERE phone = '你的手机号';
```

### 问题2：数据修改不生效
**检查**：
1. 浏览器控制台是否有错误
2. 网络请求是否成功（200状态码）
3. 数据库连接是否正常

### 问题3：部署后功能失效
**检查**：
1. 环境变量是否正确配置
2. 数据库迁移是否执行
3. Prisma Client 是否生成
4. CORS 配置是否正确

---

## ✅ 测试完成确认

- [ ] 所有功能界面可以正常访问
- [ ] 数据库操作成功执行
- [ ] 数据库数据与界面显示一致
- [ ] 权限验证正常工作
- [ ] 错误处理正常
- [ ] 生产环境配置就绪
