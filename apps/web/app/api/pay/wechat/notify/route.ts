/**
 * 微信支付回调通知处理
 * POST /api/pay/wechat/notify
 *
 * 微信支付成功后会调用此接口通知服务器
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { parseWechatNotification, getPaymentConfig } from '@/lib/payment';

// 微信支付平台证书（需要从微信商户平台下载并配置）
// 这里使用环境变量或从证书存储中读取
const getWechatPlatformCert = (): string => {
  return process.env.WECHAT_PLATFORM_CERT || '';
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const config = getPaymentConfig();

    // 获取请求头中的签名信息
    const timestamp = req.headers.get('Wechatpay-Timestamp') || '';
    const nonce = req.headers.get('Wechatpay-Nonce') || '';
    const signature = req.headers.get('Wechatpay-Signature') || '';
    const serial = req.headers.get('Wechatpay-Serial') || '';

    const platformCert = getWechatPlatformCert();

    // 解析并验证回调数据
    const notification = parseWechatNotification(
      body,
      { timestamp, nonce, signature, serial },
      config,
      platformCert
    );

    if (!notification) {
      console.error('[WECHAT_NOTIFY] 签名验证失败');
      return NextResponse.json(
        { code: 'FAIL', message: '签名验证失败' },
        { status: 400 }
      );
    }

    console.log(`[WECHAT_NOTIFY] 收到支付通知: orderId=${notification.orderId}`);

    // 查询订单
    const order = await prisma.order.findUnique({
      where: { id: notification.orderId },
    });

    if (!order) {
      console.error(`[WECHAT_NOTIFY] 订单不存在: ${notification.orderId}`);
      // 返回成功，避免微信重复通知
      return NextResponse.json({ code: 'SUCCESS', message: 'OK' });
    }

    // 幂等处理：订单已支付
    if (order.status === 'PAID') {
      console.log(`[WECHAT_NOTIFY] 订单已支付，幂等返回: ${notification.orderId}`);
      return NextResponse.json({ code: 'SUCCESS', message: 'OK' });
    }

    // 更新订单状态
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

    console.log(`[WECHAT_NOTIFY] 订单支付成功: orderId=${notification.orderId}, transactionId=${notification.transactionId}`);

    // 返回成功响应
    return NextResponse.json({ code: 'SUCCESS', message: 'OK' });
  } catch (err: any) {
    console.error('[WECHAT_NOTIFY_ERROR]', err);
    return NextResponse.json(
      { code: 'FAIL', message: err.message || '处理失败' },
      { status: 500 }
    );
  }
}
