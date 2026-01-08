/**
 * 支付宝回调通知处理
 * POST /api/pay/alipay/notify
 *
 * 支付宝支付成功后会调用此接口通知服务器
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseAlipayNotification, getPaymentConfig } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const config = getPaymentConfig();

    // 将 FormData 转换为对象
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log(`[ALIPAY_NOTIFY] 收到回调: out_trade_no=${params.out_trade_no}`);

    // 解析并验证回调数据
    const notification = parseAlipayNotification(params, config);

    if (!notification) {
      console.error('[ALIPAY_NOTIFY] 签名验证失败或交易状态无效');
      return new Response('fail', { status: 400 });
    }

    console.log(`[ALIPAY_NOTIFY] 验证通过: orderId=${notification.orderId}`);

    // 查询订单
    const order = await prisma.order.findUnique({
      where: { id: notification.orderId },
    });

    if (!order) {
      console.error(`[ALIPAY_NOTIFY] 订单不存在: ${notification.orderId}`);
      // 返回成功，避免支付宝重复通知
      return new Response('success');
    }

    // 幂等处理：订单已支付
    if (order.status === 'PAID') {
      console.log(`[ALIPAY_NOTIFY] 订单已支付，幂等返回: ${notification.orderId}`);
      return new Response('success');
    }

    // 更新订单状态
    await prisma.$transaction(async (tx) => {
      // 更新订单
      await tx.order.update({
        where: { id: notification.orderId },
        data: {
          status: 'PAID',
          paidAt: BigInt(notification.paidAt.getTime()),
          transactionId: notification.transactionId,
        },
      });

      // 更新票的状态
      await tx.ticket.updateMany({
        where: {
          orderId: notification.orderId,
          status: 'locked',
        },
        data: {
          status: 'sold',
          userId: order.userId,
          purchasedAt: notification.paidAt,
        },
      });

      // 删除 hold
      if (order.holdId) {
        await tx.hold.delete({
          where: { id: order.holdId },
        }).catch(() => {
          // hold 可能已被删除
        });
      }
    });

    console.log(`[ALIPAY_NOTIFY] 订单支付成功: orderId=${notification.orderId}, transactionId=${notification.transactionId}`);

    // 支付宝要求返回 "success" 字符串
    return new Response('success');
  } catch (err: any) {
    console.error('[ALIPAY_NOTIFY_ERROR]', err);
    return new Response('fail', { status: 500 });
  }
}
