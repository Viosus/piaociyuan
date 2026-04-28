// app/api/admin/orders/route.ts
/**
 * 管理员 - 订单管理 API
 *
 * GET /api/admin/orders - 获取所有订单列表
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '20')));
    const statusFilter = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const eventIdFilter = searchParams.get('eventId') || '';

    // 构建查询条件
    const where: Record<string, unknown> = {};

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (eventIdFilter) {
      where.eventId = eventIdFilter;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { userId: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, nickname: true, phone: true, email: true, avatar: true },
          },
          tickets: {
            select: { id: true, ticketCode: true, status: true, price: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // 批量获取活动和票档
    const eventIds = [...new Set(orders.map(o => parseInt(o.eventId)))];
    const tierIds = [...new Set(orders.map(o => parseInt(o.tierId)))];

    const [events, tiers] = await Promise.all([
      prisma.event.findMany({ where: { id: { in: eventIds } } }),
      prisma.tier.findMany({ where: { id: { in: tierIds } } }),
    ]);

    const eventMap = new Map(events.map(e => [String(e.id), e]));
    const tierMap = new Map(tiers.map(t => [String(t.id), t]));

    const result = orders.map(order => {
      const event = eventMap.get(order.eventId);
      const tier = tierMap.get(order.tierId);
      const amount = tier ? tier.price * order.qty : 0;

      return {
        id: order.id,
        userId: order.userId,
        user: order.user,
        eventId: Number(order.eventId),
        tierId: Number(order.tierId),
        qty: order.qty,
        status: order.status,
        amount,
        createdAt: Number(order.createdAt),
        paidAt: order.paidAt ? Number(order.paidAt) : null,
        refundedAt: order.refundedAt ? Number(order.refundedAt) : null,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        event: event ? {
          id: event.id,
          name: event.name,
          city: event.city,
          date: event.date,
          time: event.time,
        } : null,
        tier: tier ? {
          id: tier.id,
          name: tier.name,
          price: tier.price,
        } : null,
        tickets: order.tickets,
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        orders: result,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_ORDERS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取订单列表失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
