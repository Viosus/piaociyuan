// app/api/notifications/read-all/route.ts
/**
 * 标记所有通知为已读 API
 *
 * 功能：
 * - PATCH: 标记用户的所有通知为已读
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // 2️⃣ 标记所有未读通知为已读
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    console.log(`[MARK_ALL_READ] userId=${userId}, count=${result.count}`);

    return NextResponse.json({
      ok: true,
      message: `已标记 ${result.count} 条通知为已读`,
      data: {
        markedCount: result.count,
      },
    });
  } catch (error: unknown) {
    console.error('[MARK_ALL_READ_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '标记全部已读失败',
      },
      { status: 500 }
    );
  }
}
