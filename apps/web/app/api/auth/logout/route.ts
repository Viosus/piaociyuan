// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { revokeSession, revokeAllUserSessions } from '@/lib/session';

/**
 * 登出
 * POST /api/auth/logout
 * Body: { refreshToken?: string, logoutAll?: boolean }
 *
 * - 如果提供 refreshToken：撤销该会话
 * - 如果 logoutAll=true：撤销该用户的所有会话
 */
export async function POST(req: NextRequest) {
  try {
    const { refreshToken, logoutAll } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { ok: false, error: '缺少 Refresh Token' },
        { status: 400 }
      );
    }

    // 验证 Refresh Token 以获取用户ID
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: '无效的 Refresh Token' },
        { status: 401 }
      );
    }

    if (logoutAll) {
      // 登出所有设备
      await revokeAllUserSessions(payload.id);
      return NextResponse.json({
        ok: true,
        message: '已登出所有设备',
      });
    } else {
      // 只登出当前设备
      await revokeSession(refreshToken);
      return NextResponse.json({
        ok: true,
        message: '登出成功',
      });
    }
  } catch (error: unknown) {
    console.error('登出失败:', error);
    return NextResponse.json(
      { ok: false, error: '登出失败' },
      { status: 500 }
    );
  }
}
