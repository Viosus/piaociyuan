// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  generateTokenPair,
  findUserByEmail,
  findUserByPhone,
  isValidEmail,
} from '@/lib/auth';
import { verifyCode } from '@/lib/services/verification';
import { createUserSession, createLoginLog, extractDeviceInfo, getClientIP } from '@/lib/session';
import {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
  formatRetryAfter,
} from '@/lib/login-throttle';

type LoginMethod = 'password' | 'code';

// 后台写日志，不阻塞响应
function fireAndForgetLog(data: Parameters<typeof createLoginLog>[0]) {
  createLoginLog(data).catch((err) => {
    console.error('[LOGIN] createLoginLog failed:', err);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      account,
      password,
      verificationCode,
      loginMethod = 'password',
      rememberMe = false,
    } = body;

    console.log('[LOGIN] 登录尝试:', { account, loginMethod, rememberMe });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: '请输入账号' },
        { status: 400 }
      );
    }

    // 账号级退避检查（在查 DB 前先拦截，省 Prisma 调用）
    const gate = await checkLoginAllowed(account);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: 'ACCOUNT_LOCKED',
          retryAfterSec: gate.retryAfterSec,
          error: `登录尝试过多，请 ${formatRetryAfter(gate.retryAfterSec)}后再试`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(gate.retryAfterSec) },
        }
      );
    }

    const isEmail = isValidEmail(account);
    console.log('[LOGIN] 账号类型:', isEmail ? '邮箱' : '手机号');

    const user = isEmail ? await findUserByEmail(account) : await findUserByPhone(account);
    console.log('[LOGIN] 用户查找结果:', user ? `找到用户 ${user.id}` : '未找到用户');

    const ipAddress = getClientIP(req.headers);
    const userAgent = req.headers.get('user-agent') || undefined;
    const deviceInfo = extractDeviceInfo(userAgent);

    const method = loginMethod as LoginMethod;

    if (method === 'code') {
      if (!verificationCode) {
        return NextResponse.json(
          { ok: false, error: '请输入验证码' },
          { status: 400 }
        );
      }

      const isCodeValid = await verifyCode({
        email: isEmail ? account : undefined,
        phone: !isEmail ? account : undefined,
        code: verificationCode,
        type: 'login',
      });

      if (!isCodeValid) {
        const failResult = await recordLoginFailure(account);
        if (user) {
          fireAndForgetLog({
            userId: user.id,
            ipAddress,
            userAgent,
            success: false,
            failReason: '验证码错误或已过期',
          });
        }

        if (failResult.locked) {
          return NextResponse.json(
            {
              ok: false,
              code: 'ACCOUNT_LOCKED',
              retryAfterSec: failResult.retryAfterSec,
              error: `登录尝试过多，请 ${formatRetryAfter(failResult.retryAfterSec)}后再试`,
            },
            {
              status: 429,
              headers: { 'Retry-After': String(failResult.retryAfterSec) },
            }
          );
        }

        return NextResponse.json(
          { ok: false, error: '验证码错误或已过期', attemptsLeft: failResult.attemptsLeft },
          { status: 401 }
        );
      }

      if (!user) {
        // 模糊响应，不泄露账号是否存在
        return NextResponse.json(
          { ok: false, error: '账号或验证码错误' },
          { status: 401 }
        );
      }
    } else {
      if (!password) {
        return NextResponse.json(
          { ok: false, error: '请输入密码' },
          { status: 400 }
        );
      }

      // 用户不存在：依然计入失败计数（避免攻击者用是否触发 429 来枚举账号）
      if (!user) {
        const failResult = await recordLoginFailure(account);
        if (failResult.locked) {
          return NextResponse.json(
            {
              ok: false,
              code: 'ACCOUNT_LOCKED',
              retryAfterSec: failResult.retryAfterSec,
              error: `登录尝试过多，请 ${formatRetryAfter(failResult.retryAfterSec)}后再试`,
            },
            { status: 429, headers: { 'Retry-After': String(failResult.retryAfterSec) } }
          );
        }
        return NextResponse.json(
          { ok: false, error: '账号或密码错误', attemptsLeft: failResult.attemptsLeft },
          { status: 401 }
        );
      }

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
        const failResult = await recordLoginFailure(account);
        fireAndForgetLog({
          userId: user.id,
          ipAddress,
          userAgent,
          success: false,
          failReason: '密码错误',
        });

        if (failResult.locked) {
          return NextResponse.json(
            {
              ok: false,
              code: 'ACCOUNT_LOCKED',
              retryAfterSec: failResult.retryAfterSec,
              error: `登录尝试过多，请 ${formatRetryAfter(failResult.retryAfterSec)}后再试`,
            },
            { status: 429, headers: { 'Retry-After': String(failResult.retryAfterSec) } }
          );
        }

        return NextResponse.json(
          { ok: false, error: '账号或密码错误', attemptsLeft: failResult.attemptsLeft },
          { status: 401 }
        );
      }
    }

    // 登录成功，清零失败计数
    await clearLoginFailures(account);

    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      nickname: user.nickname ?? undefined,
      authProvider: user.authProvider,
      role: user.role,
    }, rememberMe);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    await createUserSession({
      userId: user.id,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    fireAndForgetLog({
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
        token: accessToken,
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
