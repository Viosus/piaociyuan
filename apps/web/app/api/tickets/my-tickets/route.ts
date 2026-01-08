// app/api/tickets/my-tickets/route.ts
/**
 * 查询用户的票
 *
 * 功能：查询用户拥有的所有票（已购买或已使用）
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers.get('authorization');
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

    // 解析查询参数
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 构建 where 条件
    const where: any = {
      userId,
    };

    // 根据筛选条件设置 status
    if (statusFilter) {
      // 移动端发送的 status 值可能是 'available', 'used', 'refunded'
      // 需要映射到数据库的实际值
      const statusMap: Record<string, string[]> = {
        'available': ['sold', 'available'], // 未使用的票
        'used': ['used'], // 已使用
        'refunded': ['refunded'], // 已退票
      };

      where.status = {
        in: statusMap[statusFilter] || [statusFilter],
      };
    } else {
      // 不筛选时，显示所有用户的票（已购买、已使用、已退票）
      where.status = {
        in: ['sold', 'available', 'used', 'refunded'],
      };
    }

    // 查询用户的票
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        purchasedAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 批量获取活动和票档信息
    const eventIds = [...new Set(tickets.map((t) => t.eventId))];
    const tierIds = [...new Set(tickets.map((t) => t.tierId))];

    const [events, tiers] = await Promise.all([
      prisma.event.findMany({
        where: { id: { in: eventIds } },
      }),
      prisma.tier.findMany({
        where: { id: { in: tierIds } },
      }),
    ]);

    const eventMap = new Map(events.map((e) => [e.id, e]));
    const tierMap = new Map(tiers.map((t) => [t.id, t]));

    // 组装数据
    const result = tickets.map((ticket) => {
      const event = eventMap.get(ticket.eventId);
      const tier = tierMap.get(ticket.tierId);

      return {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        eventId: ticket.eventId,
        tierId: ticket.tierId,
        userId: ticket.userId,
        orderId: ticket.orderId,
        seatNumber: ticket.seatNumber,
        status: ticket.status,
        price: ticket.price,
        purchasedAt: ticket.purchasedAt?.toISOString(),
        usedAt: ticket.usedAt?.toISOString(),
        refundedAt: ticket.refundedAt?.toISOString(),
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        event: event
          ? {
              id: event.id,
              name: event.name,
              city: event.city,
              venue: event.venue,
              date: event.date,
              time: event.time,
              cover: event.cover,
            }
          : null,
        tier: tier
          ? {
              id: tier.id,
              name: tier.name,
              price: tier.price,
            }
          : null,
        order: ticket.order ? {
          id: ticket.order.id,
          status: ticket.order.status,
          createdAt: Number(ticket.order.createdAt),
          paidAt: ticket.order.paidAt ? Number(ticket.order.paidAt) : null,
        } : null,
      };
    });

    return NextResponse.json({
      ok: true,
      data: result,
      total: result.length,
    });
  } catch (error: unknown) {
    console.error('[MY_TICKETS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询失败',
      },
      { status: 500 }
    );
  }
}
