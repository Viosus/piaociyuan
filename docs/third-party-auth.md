# 第三方登录接入指南

本文档说明如何接入微信和QQ第三方登录功能。

## 📋 前置准备

### 微信开放平台

1. **注册开放平台账号**
   - 访问：https://open.weixin.qq.com/
   - 注册并认证开发者账号（需企业资质）

2. **创建网站应用**
   - 登录开放平台管理中心
   - 创建"网站应用"
   - 填写网站信息和回调域名
   - 获取 `AppID` 和 `AppSecret`

3. **配置回调URL**
   ```
   https://yourdomain.com/api/auth/wechat/callback
   ```

### QQ互联平台

1. **注册QQ互联账号**
   - 访问：https://connect.qq.com/
   - 注册并认证开发者账号

2. **创建应用**
   - 创建"网站应用"
   - 填写网站信息和回调地址
   - 获取 `App ID` 和 `App Key`

3. **配置回调URL**
   ```
   https://yourdomain.com/api/auth/qq/callback
   ```

## 🔧 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 微信登录
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_CALLBACK_URL=https://yourdomain.com/api/auth/wechat/callback

# QQ登录
QQ_APP_ID=your_qq_app_id
QQ_APP_KEY=your_qq_app_key
QQ_CALLBACK_URL=https://yourdomain.com/api/auth/qq/callback
```

## 📝 实现步骤

### 1. 微信登录流程

**API 路由：** `app/api/auth/wechat/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const appId = process.env.WECHAT_APP_ID;
  const redirectUri = encodeURIComponent(process.env.WECHAT_CALLBACK_URL!);
  const state = Math.random().toString(36).substring(7); // 防CSRF

  // 重定向到微信授权页面
  const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

  return NextResponse.redirect(authUrl);
}
```

**回调处理：** `app/api/auth/wechat/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateToken, createUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect('/auth/login?error=wechat_auth_failed');
  }

  try {
    // 1. 使用 code 换取 access_token
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.errcode) {
      throw new Error('获取access_token失败');
    }

    // 2. 使用 access_token 获取用户信息
    const userRes = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}`
    );
    const userData = await userRes.json();

    // 3. 查找或创建用户
    // TODO: 实现用户查找和创建逻辑
    // - 通过 wechatOpenId 查找用户
    // - 如果不存在则创建新用户
    // - 生成 JWT token

    return NextResponse.redirect('/events?login=success');
  } catch (error) {
    return NextResponse.redirect('/auth/login?error=wechat_auth_failed');
  }
}
```

### 2. QQ登录流程

**API 路由：** `app/api/auth/qq/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const appId = process.env.QQ_APP_ID;
  const redirectUri = encodeURIComponent(process.env.QQ_CALLBACK_URL!);
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${appId}&redirect_uri=${redirectUri}&state=${state}&scope=get_user_info`;

  return NextResponse.redirect(authUrl);
}
```

**回调处理：** `app/api/auth/qq/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('/auth/login?error=qq_auth_failed');
  }

  try {
    // 1. 使用 code 换取 access_token
    const tokenRes = await fetch(
      `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.QQ_APP_ID}&client_secret=${process.env.QQ_APP_KEY}&code=${code}&redirect_uri=${process.env.QQ_CALLBACK_URL}`
    );
    const tokenText = await tokenRes.text();
    // 解析 token（QQ返回的是URL参数格式）
    const params = new URLSearchParams(tokenText);
    const accessToken = params.get('access_token');

    // 2. 获取 openid
    const openidRes = await fetch(
      `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}`
    );
    const openidText = await openidRes.text();
    // 解析 openid（返回的是JSONP格式）

    // 3. 获取用户信息
    // 4. 查找或创建用户
    // 5. 生成 token 并重定向

    return NextResponse.redirect('/events?login=success');
  } catch (error) {
    return NextResponse.redirect('/auth/login?error=qq_auth_failed');
  }
}
```

### 3. 更新前端按钮

修改 `app/auth/login/page.tsx` 和 `app/auth/register/page.tsx`：

```typescript
<button
  type="button"
  onClick={() => window.location.href = '/api/auth/wechat/login'}
  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
>
  微信登录
</button>

<button
  type="button"
  onClick={() => window.location.href = '/api/auth/qq/login'}
  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
>
  QQ登录
</button>
```

## ⚠️ 注意事项

1. **域名要求**
   - 必须使用已备案的域名
   - 必须使用 HTTPS
   - 回调URL必须与在开放平台配置的完全一致

2. **安全性**
   - 使用 state 参数防止 CSRF 攻击
   - 妥善保管 AppSecret/AppKey，不要泄露到前端
   - 验证回调中的 state 参数

3. **用户绑定**
   - 考虑实现账号绑定功能（微信/QQ与本地账号关联）
   - 处理同一用户多种登录方式的情况

4. **错误处理**
   - 处理授权被拒绝的情况
   - 处理网络错误
   - 提供友好的错误提示

## 📚 参考文档

- [微信开放平台 - 网站应用接入](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [QQ互联 - OAuth2.0开发文档](https://wiki.connect.qq.com/oauth2-0%E7%AE%80%E4%BB%8B)

## ✅ 当前状态

- ✅ 数据库已支持第三方登录字段（wechatOpenId, qqOpenId）
- ✅ 前端UI已预留第三方登录按钮位置
- ⏳ 需要申请开放平台账号并配置
- ⏳ 需要实现具体的OAuth回调逻辑
- ⏳ 需要部署到有域名的服务器
