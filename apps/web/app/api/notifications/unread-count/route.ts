/**
 * 未读通知数 API
 * GET /api/notifications/unread-count
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(req: NextRequest) {
  try {
    // 认证
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '未提供认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '认证信息无效或已过期' },
        { status: 401 }
      );
    }

    const userId = payload.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return NextResponse.json({
      ok: true,
      data: { count },
    });
  } catch (error: unknown) {
    console.error('[NOTIFICATION_UNREAD_COUNT_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '查询未读通知数失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
