// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  hashPassword,
  generateTokenPair,
  findUserByEmail,
  findUserByPhone,
  createUser,
  isValidEmail,
  isValidPhone,
  isValidPassword,
} from '@/lib/auth';
import { verifyCode } from '@/lib/services/verification';
import { createUserSession, createLoginLog, extractDeviceInfo, getClientIP } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, password, nickname, verificationCode } = body;

    // 验证：必须提供邮箱或手机号其中之一
    if (!email && !phone) {
      return NextResponse.json(
        { ok: false, error: '请提供邮箱或手机号' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证手机号格式
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // 验证码必填
    if (!verificationCode) {
      return NextResponse.json(
        { ok: false, error: email ? '请输入邮箱验证码' : '请输入短信验证码' },
        { status: 400 }
      );
    }

    // 验证验证码
    const isCodeValid = await verifyCode({
      email: email || undefined,
      phone: phone || undefined,
      code: verificationCode,
      type: 'register',
    });

    if (!isCodeValid) {
      return NextResponse.json(
        { ok: false, error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 验证密码
    if (!password || !isValidPassword(password)) {
      return NextResponse.json(
        { ok: false, error: '密码至少需要6位' },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    if (email) {
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { ok: false, error: '该邮箱已被注册' },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existingUser = await findUserByPhone(phone);
      if (existingUser) {
        return NextResponse.json(
          { ok: false, error: '该手机号已被注册' },
          { status: 409 }
        );
      }
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const userId = randomUUID();
    const userNickname = nickname || (email ? email.split('@')[0] : `用户${phone?.slice(-4)}`);

    await createUser({
      id: userId,
      email: email || undefined,
      phone: phone || undefined,
      password: hashedPassword,
      nickname: userNickname,
      authProvider: 'local',
    });

    // 生成双 Token
    const { accessToken, refreshToken } = generateTokenPair({
      id: userId,
      email,
      phone,
      nickname: userNickname,
      authProvider: 'local',
      role: 'user', // 新注册用户默认为普通用户
    });

    // 获取请求信息
    const ipAddress = getClientIP(req.headers);
    const userAgent = req.headers.get('user-agent') || undefined;
    const deviceInfo = extractDeviceInfo(userAgent);

    // 创建会话（存储 Refresh Token）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    await createUserSession({
      userId,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    // 记录首次登录（注册即登录）
    await createLoginLog({
      userId,
      ipAddress,
      userAgent,
      success: true,
    });

    return NextResponse.json({
      ok: true,
      message: '注册成功',
      data: {
        accessToken,
        refreshToken,
        // 向后兼容：保留 token 字段
        token: accessToken,
        // 用户信息
        user: {
          id: userId,
          phone: phone || undefined,
          email: email || undefined,
          nickname: userNickname,
          role: 'user',
        },
      },
    });
  } catch (error: unknown) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { ok: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
