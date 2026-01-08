// app/api/tickets/[id]/route.ts
/**
 * 门票详情 API
 * GET - 获取门票详情
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 认证
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
    const { id: ticketId } = await params;

    // 查询门票
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
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
    });

    if (!ticket) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '门票不存在',
        },
        { status: 404 }
      );
    }

    // 验证门票是否属于当前用户
    if (ticket.userId !== userId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FORBIDDEN',
          message: '无权访问此门票',
        },
        { status: 403 }
      );
    }

    // 查询活动和票档信息
    const [event, tier] = await Promise.all([
      prisma.event.findUnique({
        where: { id: ticket.eventId },
        select: {
          id: true,
          name: true,
          city: true,
          venue: true,
          date: true,
          time: true,
          cover: true,
        },
      }),
      prisma.tier.findUnique({
        where: { id: ticket.tierId },
        select: {
          id: true,
          name: true,
          price: true,
        },
      }),
    ]);

    // 组装返回数据
    const result = {
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
      order: ticket.order
        ? {
            id: ticket.order.id,
            status: ticket.order.status,
            createdAt: Number(ticket.order.createdAt),
            paidAt: ticket.order.paidAt ? Number(ticket.order.paidAt) : null,
          }
        : null,
    };

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('[TICKET_DETAIL_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询门票失败',
      },
      { status: 500 }
    );
  }
}
