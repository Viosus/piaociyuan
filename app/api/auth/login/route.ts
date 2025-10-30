// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  generateToken,
  findUserByEmail,
  findUserByPhone,
  isValidEmail,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account, password } = body;

    console.log('[LOGIN] 登录尝试:', { account });

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

    const user = isEmail ? findUserByEmail(account) : findUserByPhone(account);
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

    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, error: '账号或密码错误' },
        { status: 401 }
      );
    }

    // 生成 token
    const token = generateToken({
      id: user.id,
      email: user.email,
      phone: user.phone,
      nickname: user.nickname,
      authProvider: user.authProvider,
    });

    return NextResponse.json({
      ok: true,
      message: '登录成功',
      data: {
        userId: user.id,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        token,
      },
    });
  } catch (error: any) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { ok: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
