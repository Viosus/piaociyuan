// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: '未提供认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: '认证信息无效或已过期' },
        { status: 401 }
      );
    }

    // 从数据库获取最新用户信息
    const user = await findUserById(payload.id);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 返回用户信息（不包含密码）
    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (error: unknown) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { ok: false, error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
