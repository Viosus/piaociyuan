// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  hashPassword,
  generateToken,
  findUserByEmail,
  findUserByPhone,
  createUser,
  isValidEmail,
  isValidPhone,
  isValidPassword,
} from '@/lib/auth';
import { verifyCode } from '@/lib/verification';

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

    // 邮箱注册需要验证码
    if (email) {
      if (!verificationCode) {
        return NextResponse.json(
          { ok: false, error: '请输入邮箱验证码' },
          { status: 400 }
        );
      }

      // 验证验证码
      const isCodeValid = verifyCode(email, verificationCode, 'register');
      if (!isCodeValid) {
        return NextResponse.json(
          { ok: false, error: '验证码错误或已过期' },
          { status: 400 }
        );
      }
    }

    // 验证手机号格式
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: '手机号格式不正确' },
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
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { ok: false, error: '该邮箱已被注册' },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existingUser = findUserByPhone(phone);
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
    createUser({
      id: userId,
      email: email || undefined,
      phone: phone || undefined,
      password: hashedPassword,
      nickname: nickname || (email ? email.split('@')[0] : `用户${phone?.slice(-4)}`),
      authProvider: 'local',
    });

    // 生成 token
    const token = generateToken({
      id: userId,
      email,
      phone,
      nickname: nickname || (email ? email.split('@')[0] : `用户${phone?.slice(-4)}`),
      authProvider: 'local',
    });

    return NextResponse.json({
      ok: true,
      message: '注册成功',
      data: {
        userId,
        token,
      },
    });
  } catch (error: any) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { ok: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
