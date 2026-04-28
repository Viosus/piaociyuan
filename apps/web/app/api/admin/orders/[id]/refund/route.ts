// app/api/admin/orders/[id]/refund/route.ts
/**
 * 管理员 - 订单退款 API
 *
 * POST /api/admin/orders/[id]/refund - 管理员退款
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function POST(
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
      include: { tickets: true },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '订单不存在' },
        { status: 404 }
      );
    }

    if (order.status !== 'PAID') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: `订单状态为 ${order.status}，无法退款` },
        { status: 400 }
      );
    }

    // 检查是否有已使用的票
    const usedTickets = order.tickets.filter(t => t.status === 'used');
    if (usedTickets.length > 0) {
      return NextResponse.json(
        { ok: false, code: 'TICKETS_USED', message: `有 ${usedTickets.length} 张票已使用，无法退款` },
        { status: 400 }
      );
    }

    const now = Date.now();
    const refundId = `R_${now}_${Math.random().toString(36).slice(2, 8)}`;

    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          refundedAt: BigInt(now),
          refundId,
        },
      });

      // 更新所有票的状态
      await tx.ticket.updateMany({
        where: { orderId: id },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
        },
      });

      // 恢复票档库存
      const tierId = parseInt(order.tierId);
      await tx.tier.update({
        where: { id: tierId },
        data: {
          remaining: { increment: order.qty },
          sold: { decrement: order.qty },
        },
      });
    });

    return NextResponse.json({
      ok: true,
      data: { orderId: id, refundId, status: 'REFUNDED' },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_ORDER_REFUND_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '退款处理失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
