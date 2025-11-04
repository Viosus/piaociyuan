// app/api/notifications/[id]/read/route.ts
/**
 * 标记通知为已读 API
 *
 * 功能：
 * - PATCH: 标记单个通知为已读
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: notificationId } = await params;

    // 2️⃣ 检查通知是否存在且属于该用户
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOTIFICATION_NOT_FOUND',
          message: '通知不存在或不属于您',
        },
        { status: 404 }
      );
    }

    // 3️⃣ 标记为已读
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    console.log(`[MARK_NOTIFICATION_READ] notificationId=${notificationId}, userId=${userId}`);

    return NextResponse.json({
      ok: true,
      message: '通知已标记为已读',
      data: {
        id: updatedNotification.id,
        isRead: updatedNotification.isRead,
      },
    });
  } catch (error: unknown) {
    console.error('[MARK_NOTIFICATION_READ_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '标记已读失败',
      },
      { status: 500 }
    );
  }
}
