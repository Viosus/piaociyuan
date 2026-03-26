/**
 * 订单退款 API
 * POST /api/orders/[id]/refund
 *
 * 简化接口，内部委托给 /api/pay/refund 的逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { normalizeId } from '@/lib/store';
import { getErrorMessage } from '@/lib/error-utils';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { createRefund, PaymentMethod } from '@/lib/payment';

type Props = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Props) {
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
    const { id } = await params;
    const orderId = normalizeId(id);

    // 查询订单
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: true },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '订单不存在' },
        { status: 404 }
      );
    }

    // 验证所有权
    if (order.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权操作此订单' },
        { status: 403 }
      );
    }

    // 只有已支付的订单才能退款
    if (order.status !== 'PAID') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: '只有已支付的订单才能退款' },
        { status: 400 }
      );
    }

    // 检查票是否已使用
    const usedTickets = order.tickets.filter(t => t.status === 'used');
    if (usedTickets.length > 0) {
      return NextResponse.json(
        { ok: false, code: 'TICKETS_USED', message: '票已使用，无法退款' },
        { status: 400 }
      );
    }

    // 获取票档信息
    const tier = await prisma.tier.findUnique({
      where: { id: parseInt(order.tierId) },
    });

    if (!tier) {
      return NextResponse.json(
        { ok: false, code: 'TIER_NOT_FOUND', message: '票档不存在' },
        { status: 404 }
      );
    }

    const refundAmount = order.qty * tier.price;
    const refundId = `RF${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;

    // 处理退款
    const paymentMethod = (order.paymentMethod || 'mock') as PaymentMethod;

    if (paymentMethod === 'mock') {
      console.log(`[REFUND_MOCK] 模拟退款: orderId=${orderId}, amount=${refundAmount}`);
    } else if (order.transactionId) {
      try {
        await createRefund(
          paymentMethod,
          {
            orderId,
            refundId,
            totalAmount: refundAmount,
            refundAmount,
            reason: '用户申请退款',
          },
          order.transactionId
        );
      } catch (refundErr: any) {
        console.error(`[REFUND_ERROR] 退款失败: ${refundErr.message}`);
        return NextResponse.json(
          { ok: false, code: 'REFUND_FAILED', message: refundErr.message || '退款失败' },
          { status: 500 }
        );
      }
    }

    // 更新订单和票的状态
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED', refundedAt: BigInt(Date.now()), refundId },
      });

      await tx.ticket.updateMany({
        where: { orderId },
        data: { status: 'refunded', userId: null },
      });

      await tx.tier.update({
        where: { id: parseInt(order.tierId) },
        data: { sold: { decrement: order.qty } },
      });
    });

    console.log(`[REFUND_SUCCESS] orderId=${orderId}, refundId=${refundId}, amount=${refundAmount}`);

    return NextResponse.json({
      ok: true,
      data: { success: true, orderId, refundId, refundAmount, status: 'REFUNDED' },
      message: '退款成功',
    });
  } catch (error: unknown) {
    console.error('[ORDER_REFUND_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '退款失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
