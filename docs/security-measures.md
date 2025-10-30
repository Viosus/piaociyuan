# 安全防护措施指南

本文档说明票次元系统的安全防护措施，防止恶意注册、爬虫攻击等问题。

## 📋 已实现的防护措施

### 1. 邮箱验证码 ✅

**实现方式：**
- 邮箱注册需要输入验证码
- 验证码6位数字，5分钟有效期
- 验证码使用后自动失效
- 60秒发送频率限制

**防护效果：**
- ⭐⭐⭐⭐ 有效防止批量注册
- ⭐⭐⭐ 防止机器人（结合验证码图形会更好）

**使用方法：**
```bash
# 开发环境：验证码会输出到控制台
npm run dev
# 查看控制台可以看到发送的验证码

# 生产环境：需要配置邮件服务（见下文）
```

### 2. 发送频率限制 ✅

**实现位置：** `lib/verification.ts` - `canSendCode()`

**限制规则：**
- 同一邮箱60秒内只能发送一次验证码
- 超过限制会提示等待时间

**代码示例：**
```typescript
const rateCheck = canSendCode(email);
if (!rateCheck.ok) {
  return { error: rateCheck.message, waitTime: rateCheck.waitTime };
}
```

### 3. 验证码自动过期 ✅

**机制：**
- 验证码5分钟后自动过期
- 使用后立即失效（防止重复使用）
- 定期清理过期验证码

**清理函数：**
```typescript
import { cleanExpiredCodes } from '@/lib/verification';

// 建议每小时执行一次
cleanExpiredCodes();
```

## 🔧 待实现的防护措施

### 1. Google reCAPTCHA（推荐）⭐⭐⭐⭐⭐

**优势：**
- 完全免费
- 效果最好
- 用户体验好（自动验证）

**实现步骤：**

1. 申请 reCAPTCHA
   - 访问：https://www.google.com/recaptcha/admin
   - 选择 reCAPTCHA v3（无需点击）
   - 获取 Site Key 和 Secret Key

2. 安装依赖
   ```bash
   npm install next-recaptcha-v3
   ```

3. 配置环境变量（.env）
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
   RECAPTCHA_SECRET_KEY=your_secret_key
   ```

4. 前端集成
   ```tsx
   // app/auth/register/page.tsx
   import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

   function RegisterForm() {
     const { executeRecaptcha } = useGoogleReCaptcha();

     const handleSubmit = async () => {
       const token = await executeRecaptcha('register');
       // 将 token 发送到后端验证
     };
   }
   ```

5. 后端验证
   ```typescript
   // app/api/auth/register/route.ts
   async function verifyRecaptcha(token: string) {
     const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
     });
     const data = await res.json();
     return data.success && data.score > 0.5; // 0.5 是推荐阈值
   }
   ```

### 2. IP频率限制

**建议使用：** `express-rate-limit` 或 Next.js 中间件

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
  } else {
    const data = requestCounts.get(ip)!;
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + 60000;
    } else {
      data.count++;
      if (data.count > 100) {
        return NextResponse.json(
          { error: '请求过于频繁' },
          { status: 429 }
        );
      }
    }
  }

  return NextResponse.next();
}
```

### 3. 手机短信验证（收费）

**适用场景：** 高安全要求的场景

**推荐服务商：**
- 阿里云短信服务
- 腾讯云短信
- 云片网

**成本：** 约0.03-0.05元/条

## 📧 邮件服务配置

### 开发环境

开发环境下，验证码会输出到控制台，无需配置邮件服务。

### 生产环境配置

在 `.env` 文件中添加以下配置：

```env
# SMTP 邮件服务配置
SMTP_HOST=smtp.gmail.com        # 邮件服务器地址
SMTP_PORT=587                    # 端口
SMTP_SECURE=false                # 是否使用 SSL
SMTP_USER=your@email.com         # 邮箱账号
SMTP_PASS=your_app_password      # 邮箱密码或应用专用密码
SMTP_FROM=your@email.com         # 发件人邮箱
```

### 常用邮件服务商配置

**1. Gmail**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password  # 需要在 Google 账户中生成应用专用密码
```

**2. QQ邮箱**
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@qq.com
SMTP_PASS=authorization_code  # QQ邮箱授权码
```

**3. 163邮箱**
```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your@163.com
SMTP_PASS=authorization_code
```

**4. 专业邮件服务（推荐）**
- SendGrid（免费100封/天）
- Mailgun（免费5000封/月）
- AWS SES（价格便宜，0.1美元/1000封）

## 🛡️ 综合防护建议

### 最小配置（适合开发/小型项目）
✅ 邮箱验证码
✅ 发送频率限制

### 推荐配置（适合生产环境）
✅ 邮箱验证码
✅ 发送频率限制
✅ Google reCAPTCHA v3
✅ IP 频率限制

### 高安全配置（适合大型项目）
✅ 邮箱验证码
✅ 手机短信验证码
✅ Google reCAPTCHA v3
✅ IP 频率限制
✅ 设备指纹识别
✅ 异常行为检测

## 📊 监控建议

建议记录以下指标：
- 每日注册数量
- 验证码发送量
- 失败注册尝试
- 被拦截的可疑请求

```typescript
// 可以在 API 中添加日志
console.log('[SECURITY] 注册尝试:', {
  email,
  ip: request.headers.get('x-forwarded-for'),
  timestamp: Date.now(),
  success: true/false,
});
```

## ✅ 当前状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 邮箱验证码 | ✅ 已实现 | 开发环境输出到控制台 |
| 发送频率限制 | ✅ 已实现 | 60秒/次 |
| 验证码过期 | ✅ 已实现 | 5分钟自动过期 |
| 邮件服务 | ⏳ 需配置 | 生产环境需配置 SMTP |
| reCAPTCHA | ❌ 未实现 | 建议添加 |
| IP 限制 | ❌ 未实现 | 可选 |
| 短信验证 | ❌ 未实现 | 可选 |

---

更新时间：2025-10-30
