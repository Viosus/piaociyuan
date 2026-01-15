// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  generateTokenPair,
  findUserByEmail,
  findUserByPhone,
  isValidEmail,
} from '@/lib/auth';
import { createUserSession, createLoginLog, extractDeviceInfo, getClientIP } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account, password, rememberMe = false } = body;

    console.log('[LOGIN] 登录尝试:', { account, rememberMe });

    // 验证输入
    if (!account || !password) {
      return NextResponse.json(
        { ok: false, error: '请输入账号和密码' },
        { status: 400 }
      );
    }

    // 判断是邮箱还是手机号
    const isEmail = isValidEmail(account);
    console.log('[LOGIN] 账号类型:', isEmail ? '邮箱' : '手机号');

    const user = isEmail ? await findUserByEmail(account) : await findUserByPhone(account);
    console.log('[LOGIN] 用户查找结果:', user ? `找到用户 ${user.id}` : '未找到用户');

    if (!user) {
      return NextResponse.json(
        { ok: false, error: '账号或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    if (!user.password) {
      console.log('[LOGIN] 用户无密码，可能是第三方登录账号');
      return NextResponse.json(
        { ok: false, error: '该账号使用第三方登录，请使用对应方式登录' },
        { status: 400 }
      );
    }

    console.log('[LOGIN] 开始验证密码...');
    const isPasswordValid = await verifyPassword(password, user.password);
    console.log('[LOGIN] 密码验证结果:', isPasswordValid ? '正确' : '错误');

    // 获取请求信息
    const ipAddress = getClientIP(req.headers);
    const userAgent = req.headers.get('user-agent') || undefined;
    const deviceInfo = extractDeviceInfo(userAgent);

    if (!isPasswordValid) {
      // 记录失败的登录尝试
      await createLoginLog({
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        failReason: '密码错误',
      });

      return NextResponse.json(
        { ok: false, error: '账号或密码错误' },
        { status: 401 }
      );
    }

    // 生成双 Token（根据 rememberMe 设置不同有效期）
    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      nickname: user.nickname ?? undefined,
      authProvider: user.authProvider,
      role: user.role, // 添加角色信息
    }, rememberMe);

    // 创建会话（存储 Refresh Token）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 记住我：30天，否则7天

    await createUserSession({
      userId: user.id,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    // 记录成功的登录
    await createLoginLog({
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
    });

    return NextResponse.json({
      ok: true,
      message: '登录成功',
      data: {
        accessToken,
        refreshToken,
        // 向后兼容：保留 token 字段
        token: accessToken,
        // 用户信息
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
        },
      },
    });
  } catch (error: unknown) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { ok: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
