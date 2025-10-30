// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, verifyToken, findUserById } from '@/lib/auth';
import { findSessionByRefreshToken } from '@/lib/session';

/**
 * 刷新 Access Token
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { ok: false, error: '缺少 Refresh Token' },
        { status: 400 }
      );
    }

    // 验证 Refresh Token 格式
    const payload = verifyToken(refreshToken) as any;
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        { ok: false, error: '无效的 Refresh Token' },
        { status: 401 }
      );
    }

    // 检查会话是否存在且有效
    const session = await findSessionByRefreshToken(refreshToken);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Refresh Token 已过期或已撤销' },
        { status: 401 }
      );
    }

    // 获取最新的用户信息
    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 生成新的 Access Token
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      nickname: user.nickname ?? undefined,
      authProvider: user.authProvider,
    });

    return NextResponse.json({
      ok: true,
      message: 'Token 刷新成功',
      data: {
        accessToken: newAccessToken,
        // 向后兼容
        token: newAccessToken,
      },
    });
  } catch (error: any) {
    console.error('Token 刷新失败:', error);
    return NextResponse.json(
      { ok: false, error: 'Token 刷新失败' },
      { status: 500 }
    );
  }
}
