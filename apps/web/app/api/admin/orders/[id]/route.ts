// app/api/admin/orders/[id]/route.ts
/**
 * 管理员 - 单个订单管理 API
 *
 * GET /api/admin/orders/[id] - 获取订单详情
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nickname: true, phone: true, email: true, avatar: true },
        },
        tickets: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '订单不存在' },
        { status: 404 }
      );
    }

    // 获取活动和票档信息
    const [event, tier] = await Promise.all([
      prisma.event.findUnique({ where: { id: parseInt(order.eventId) } }),
      prisma.tier.findUnique({ where: { id: parseInt(order.tierId) } }),
    ]);

    const amount = tier ? tier.price * order.qty : 0;

    return NextResponse.json({
      ok: true,
      data: {
        id: order.id,
        userId: order.userId,
        user: order.user,
        eventId: Number(order.eventId),
        tierId: Number(order.tierId),
        qty: order.qty,
        status: order.status,
        amount,
        holdId: order.holdId,
        createdAt: Number(order.createdAt),
        paidAt: order.paidAt ? Number(order.paidAt) : null,
        refundedAt: order.refundedAt ? Number(order.refundedAt) : null,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        refundId: order.refundId,
        event: event ? {
          id: event.id,
          name: event.name,
          category: event.category,
          city: event.city,
          venue: event.venue,
          date: event.date,
          time: event.time,
          cover: event.cover,
          artist: event.artist,
        } : null,
        tier: tier ? {
          id: tier.id,
          name: tier.name,
          price: tier.price,
          capacity: tier.capacity,
          remaining: tier.remaining,
        } : null,
        tickets: order.tickets.map(t => ({
          id: t.id,
          ticketCode: t.ticketCode,
          seatNumber: t.seatNumber,
          status: t.status,
          price: t.price,
          purchasedAt: t.purchasedAt,
          usedAt: t.usedAt,
          refundedAt: t.refundedAt,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_ORDER_DETAIL_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取订单详情失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
