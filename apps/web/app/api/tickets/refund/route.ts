// app/api/tickets/refund/route.ts
/**
 * 退票功能
 *
 * 功能：
 * - 验证票是否属于该用户
 * - 更新票状态为 refunded
 * - 清空 userId 和 orderId（票回到库存）
 * - 更新订单状态为 refunded
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1️⃣ 认证
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

    // 2️⃣ 获取参数
    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '请提供票 ID',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 验证票是否属于该用户
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId,
        status: 'sold', // 只能退已售出的票
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          ok: false,
          code: 'TICKET_NOT_FOUND',
          message: '票不存在、不属于您或已使用',
        },
        { status: 404 }
      );
    }

    // 4️⃣ 执行退票（事务）
    await prisma.$transaction(async (tx) => {
      // a. 更新票的状态为 refunded，保留 orderId 和 userId 以维护历史记录
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'refunded', // 标记为已退票（不再进入库存）
          refundedAt: new Date(), // 记录退票时间
          // 保留 userId 和 orderId，保持历史记录完整性
        },
      });

      // b. 检查订单的其他票是否都已退款
      const orderTickets = await tx.ticket.findMany({
        where: {
          orderId: ticket.orderId,
        },
      });

      // 通过 refundedAt 字段判断票是否已退款（而不是status）
      const allRefunded = orderTickets.every(
        (t) => t.id === ticketId || t.refundedAt !== null
      );

      // c. 如果订单的所有票都已退款，更新订单状态
      if (allRefunded && ticket.orderId) {
        await tx.order.update({
          where: { id: ticket.orderId },
          data: {
            status: 'refunded',
          },
        });
      }
    });

    console.log(`[REFUND_SUCCESS] ticketId=${ticketId}, userId=${userId}`);

    return NextResponse.json({
      ok: true,
      message: '退票成功',
      data: {
        ticketId,
        ticketCode: ticket.ticketCode,
      },
    });
  } catch (error: unknown) {
    console.error('[REFUND_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '退票失败',
      },
      { status: 500 }
    );
  }
}
