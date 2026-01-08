/**
 * 退款 API
 * POST /api/pay/refund
 *
 * 处理订单退款请求
 */

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { normalizeId } from '@/lib/store';
import { createRefund, PaymentMethod } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, reason } = body || {};

    // 参数校验
    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '请求参数错误，缺少订单号。',
        },
        { status: 400 }
      );
    }

    const normalizedOrderId = normalizeId(orderId);

    // 查询订单
    const order = await prisma.order.findUnique({
      where: { id: normalizedOrderId },
      include: {
        tier: true,
        tickets: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          code: 'ORDER_NOT_FOUND',
          message: '订单不存在。',
        },
        { status: 404 }
      );
    }

    // 检查订单状态
    if (order.status !== 'PAID') {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_ORDER_STATUS',
          message: '只有已支付的订单才能退款。',
        },
        { status: 400 }
      );
    }

    // 检查票是否已使用
    const usedTickets = order.tickets.filter(t => t.status === 'used');
    if (usedTickets.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: 'TICKETS_USED',
          message: '票已使用，无法退款。',
        },
        { status: 400 }
      );
    }

    // 检查是否有交易号
    if (!order.transactionId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NO_TRANSACTION',
          message: '订单没有支付交易记录，无法退款。',
        },
        { status: 400 }
      );
    }

    // 计算退款金额
    const refundAmount = order.qty * order.tier.price;
    const refundId = `RF${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;

    // 判断支付方式
    const paymentMethod = (order.paymentMethod || 'mock') as PaymentMethod;

    if (paymentMethod === 'mock') {
      // 模拟退款
      console.log(`[REFUND_MOCK] 模拟退款: orderId=${normalizedOrderId}, amount=${refundAmount}`);
    } else {
      // 调用真实退款
      try {
        await createRefund(
          paymentMethod,
          {
            orderId: normalizedOrderId,
            refundId,
            totalAmount: refundAmount,
            refundAmount,
            reason: reason || '用户申请退款',
          },
          order.transactionId
        );
      } catch (refundErr: any) {
        console.error(`[REFUND_ERROR] 退款失败: ${refundErr.message}`);
        return NextResponse.json(
          {
            ok: false,
            code: 'REFUND_FAILED',
            message: refundErr.message || '退款失败，请稍后重试。',
          },
          { status: 500 }
        );
      }
    }

    // 更新订单和票的状态
    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: normalizedOrderId },
        data: {
          status: 'REFUNDED',
          refundedAt: BigInt(Date.now()),
          refundId,
        },
      });

      // 更新票的状态
      await tx.ticket.updateMany({
        where: {
          orderId: normalizedOrderId,
        },
        data: {
          status: 'refunded',
          userId: null,
        },
      });

      // 恢复库存
      await tx.tier.update({
        where: { id: order.tierId },
        data: {
          sold: {
            decrement: order.qty,
          },
        },
      });
    });

    console.log(`[REFUND_SUCCESS] 退款成功: orderId=${normalizedOrderId}, refundId=${refundId}, amount=${refundAmount}`);

    return NextResponse.json({
      ok: true,
      code: 'SUCCESS',
      message: '退款成功',
      data: {
        orderId: normalizedOrderId,
        refundId,
        refundAmount,
        status: 'REFUNDED',
      },
    });
  } catch (err: any) {
    console.error('[REFUND_ERROR]', err);
    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: err.message || '退款处理失败，请稍后重试。',
      },
      { status: 500 }
    );
  }
}
