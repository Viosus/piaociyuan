// app/api/tickets/verify/route.ts
/**
 * 票据核销功能
 *
 * 功能：
 * - 扫描票号（二维码/条形码）
 * - 验证票的状态
 * - 标记为已使用
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TicketStatus, ErrorCode } from '@piaoyuzhou/shared';

export async function POST(req: Request) {
  try {
    // 获取参数
    const body = await req.json();
    const { ticketCode } = body;

    if (!ticketCode) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '请提供票号',
        },
        { status: 400 }
      );
    }

    // 查询票
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            paidAt: true,
          },
        },
      },
    });

    // 验证票是否存在
    if (!ticket) {
      return NextResponse.json(
        {
          ok: false,
          code: 'TICKET_NOT_FOUND',
          message: '票不存在',
        },
        { status: 404 }
      );
    }

    // 验证票的状态
    if (ticket.status === TicketStatus.USED) {
      return NextResponse.json(
        {
          ok: false,
          code: ErrorCode.TICKET_ALREADY_USED,
          message: '票已使用',
          data: {
            usedAt: ticket.usedAt,
          },
        },
        { status: 400 }
      );
    }

    if (ticket.status !== TicketStatus.SOLD) {
      return NextResponse.json(
        {
          ok: false,
          code: ErrorCode.INVALID_INPUT,
          message: `票状态异常（${ticket.status}），无法核销`,
        },
        { status: 400 }
      );
    }

    // 获取活动和票档信息
    const [event, tier] = await Promise.all([
      prisma.event.findUnique({
        where: { id: ticket.eventId },
      }),
      prisma.tier.findUnique({
        where: { id: ticket.tierId },
      }),
    ]);

    // 标记为已使用
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.USED,
        usedAt: new Date(),
      },
    });

    console.log(`[VERIFY_SUCCESS] ticketCode=${ticketCode}, userId=${ticket.userId}`);

    return NextResponse.json({
      ok: true,
      message: '验票成功',
      data: {
        ticketCode: ticket.ticketCode,
        status: 'used',
        usedAt: new Date(),
        event: event
          ? {
              id: event.id,
              name: event.name,
              city: event.city,
              venue: event.venue,
              date: event.date,
              time: event.time,
            }
          : null,
        tier: tier
          ? {
              id: tier.id,
              name: tier.name,
              price: tier.price,
            }
          : null,
        user: ticket.user,
      },
    });
  } catch (error: unknown) {
    console.error('[VERIFY_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '验票失败',
      },
      { status: 500 }
    );
  }
}
