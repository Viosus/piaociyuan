/**
 * 取消订单 API
 * POST /api/orders/[id]/cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { normalizeId } from '@/lib/store';
import { getErrorMessage } from '@/lib/error-utils';

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

    // 只有待支付的订单可以取消
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: '只有待支付的订单才能取消' },
        { status: 400 }
      );
    }

    // 更新订单状态
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    // 释放库存（恢复 hold 的票）
    await prisma.ticket.updateMany({
      where: { orderId },
      data: { status: 'available', userId: null, orderId: null },
    });

    console.log(`[ORDER_CANCEL] 订单已取消: orderId=${orderId}, userId=${userId}`);

    return NextResponse.json({
      ok: true,
      data: { success: true },
      message: '订单已取消',
    });
  } catch (error: unknown) {
    console.error('[ORDER_CANCEL_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '取消订单失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
