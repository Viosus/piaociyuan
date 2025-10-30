// app/api/user/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDB } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    // 验证 token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: '未登录' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: 'Token 无效' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { avatar, nickname } = body;

    console.log('[USER_UPDATE] 用户更新请求:', { userId: payload.id, avatar, nickname });

    const db = getDB();
    const now = new Date().toISOString();

    // 构建更新字段
    const updates: string[] = [];
    const values: any[] = [];

    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { ok: false, error: '没有要更新的内容' },
        { status: 400 }
      );
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(payload.id);

    // 更新数据库
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    // 获取更新后的用户信息
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id) as any;

    console.log('[USER_UPDATE] 更新成功');

    return NextResponse.json({
      ok: true,
      message: '更新成功',
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (error: any) {
    console.error('用户信息更新失败:', error);
    return NextResponse.json(
      { ok: false, error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}
