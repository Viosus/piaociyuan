// app/api/auth/refresh/route.ts
/**
 * Token 刷新 API
 *
 * 功能：使用 Refresh Token 获取新的 Access Token
 */

import { NextResponse } from 'next/server';
import { verifyToken, generateAccessToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '缺少 refresh token',
        },
        { status: 400 }
      );
    }

    // 验证 refresh token
    const payload = verifyToken(refreshToken);
    if (!payload || !payload.id) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token 无效或已过期',
        },
        { status: 401 }
      );
    }

    // 查询用户是否仍然存在
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        authProvider: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: 'USER_NOT_FOUND',
          message: '用户不存在',
        },
        { status: 404 }
      );
    }

    // 生成新的 access token
    const newAccessToken = generateAccessToken({
      id: user.id,
      phone: user.phone || undefined,
      email: user.email || undefined,
      role: user.role,
      authProvider: user.authProvider,
    });

    console.log('[TOKEN_REFRESH_SUCCESS]', { userId: user.id });

    return NextResponse.json({
      ok: true,
      message: 'Token 刷新成功',
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[TOKEN_REFRESH_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: 'Token 刷新失败',
      },
      { status: 500 }
    );
  }
}
