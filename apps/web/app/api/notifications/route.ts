// app/api/notifications/route.ts
import { Prisma } from "@prisma/client";
/**
 * 通知系统 API
 *
 * 功能：
 * - GET: 获取用户的通知列表
 * - POST: 创建新通知（系统内部使用）
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - 获取用户的通知列表
export async function GET(req: NextRequest) {
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

    // 2️⃣ 获取查询参数
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // event_onsale, event_upcoming, price_change, low_stock, message
    const isRead = searchParams.get('isRead'); // true, false
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[NOTIFICATIONS] 查询参数:', { userId, type, isRead, limit, offset });

    // 3️⃣ 构建查询条件
    const where = {
      userId,
    } as any;

    if (type) {
      where.type = type;
    }

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    // 4️⃣ 查询通知列表
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            cover: true,
            date: true,
            city: true,
            venue: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // 5️⃣ 统计信息
    const totalCount = await prisma.notification.count({
      where: { userId },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    const stats = {
      total: totalCount,
      unread: unreadCount,
      read: totalCount - unreadCount,
    };

    console.log('[NOTIFICATIONS] 查询成功:', stats);

    return NextResponse.json({
      ok: true,
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        event: n.event
          ? {
              id: n.event.id,
              name: n.event.name,
              cover: n.event.cover,
              date: n.event.date,
              city: n.event.city,
              venue: n.event.venue,
            }
          : null,
      })),
      stats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error: unknown) {
    console.error('[NOTIFICATIONS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询通知失败',
      },
      { status: 500 }
    );
  }
}

// POST - 创建新通知
export async function POST(req: NextRequest) {
  try {
    // 1️⃣ 认证（创建通知通常由系统内部调用，这里也允许管理员手动创建）
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

    // 2️⃣ 获取请求参数
    const body = await req.json();
    const { userId, type, title, content, eventId, link } = body;

    if (!userId || !type || !title || !content) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '缺少必要参数：userId, type, title, content',
        },
        { status: 400 }
      );
    }

    // 验证通知类型
    const validTypes = ['event_onsale', 'event_upcoming', 'price_change', 'low_stock', 'message'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: `无效的通知类型，支持的类型: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 3️⃣ 创建通知
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        eventId: eventId || null,
        link: link || null,
      },
    });

    console.log(`[CREATE_NOTIFICATION_SUCCESS] id=${notification.id}, userId=${userId}, type=${type}`);

    return NextResponse.json({
      ok: true,
      message: '通知创建成功',
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        eventId: notification.eventId,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('[CREATE_NOTIFICATION_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '创建通知失败',
      },
      { status: 500 }
    );
  }
}
