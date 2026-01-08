/**
 * 支付宝 API - 创建支付订单
 * POST /api/pay/alipay
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeId } from '@/lib/store';
import { purgeExpiredHolds } from '@/lib/inventory';
import {
  createPayment,
  getPaymentConfig,
} from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const now = Date.now();
    await purgeExpiredHolds(now);

    const body = await req.json().catch(() => ({}));
    const { orderId, payType = 'app' } = body || {};

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

    const config = getPaymentConfig();
    if (!config.alipay.appId || !config.alipay.privateKey) {
      return NextResponse.json(
        {
          ok: false,
          code: 'PAYMENT_NOT_CONFIGURED',
          message: '支付宝未配置，请联系管理员。',
        },
        { status: 500 }
      );
    }

    const normalizedOrderId = normalizeId(orderId);

    // 查询订单
    const order = await prisma.order.findUnique({
      where: { id: normalizedOrderId },
      include: {
        tier: {
          include: {
            event: true,
          },
        },
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
    if (order.status === 'PAID') {
      return NextResponse.json({
        ok: true,
        code: 'ORDER_ALREADY_PAID',
        message: '订单已支付',
        data: { status: 'PAID' },
      });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_ORDER_STATUS',
          message: '订单状态无效，无法支付。',
        },
        { status: 400 }
      );
    }

    // 验证 hold
    const hold = await prisma.hold.findUnique({
      where: { id: order.holdId },
    });

    if (!hold || Number(hold.expireAt) <= now) {
      return NextResponse.json(
        {
          ok: false,
          code: 'HOLD_EXPIRED',
          message: '锁票已过期，请重新选择票档并下单。',
        },
        { status: 410 }
      );
    }

    // 计算订单金额（单位：分）
    const amount = order.qty * order.tier.price;

    // 创建支付宝订单
    const payResult = await createPayment(
      'alipay',
      {
        orderId: normalizedOrderId,
        amount,
        description: `${order.tier.event.name} - ${order.tier.name} x${order.qty}`,
      },
      payType as 'app' | 'native' | 'web'
    );

    // 更新订单支付方式
    await prisma.order.update({
      where: { id: normalizedOrderId },
      data: {
        paymentMethod: 'alipay',
      },
    });

    console.log(`[ALIPAY] 创建支付订单成功: orderId=${normalizedOrderId}`);

    return NextResponse.json({
      ok: true,
      code: 'SUCCESS',
      message: '创建支付订单成功',
      data: {
        orderId: normalizedOrderId,
        amount,
        orderString: payResult.alipay?.orderString,
        payUrl: payResult.alipay?.payUrl,
      },
    });
  } catch (err: any) {
    console.error('[ALIPAY_ERROR]', err);
    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: err.message || '创建支付订单失败，请稍后重试。',
      },
      { status: 500 }
    );
  }
}
