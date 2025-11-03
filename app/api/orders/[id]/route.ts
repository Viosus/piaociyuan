// app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeId } from '@/lib/store';
import { ApiError } from '@/lib/inventory';

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  try {
    const { id } = await params;

    console.log(`[ORDER_GET] 收到请求，订单 ID: "${id}"`);

    if (!id || id.trim() === '' || id === 'undefined' || id === 'null') {
      console.warn(`[ORDER_GET] 无效的 ID 参数: "${id}"`);
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          error: '订单 ID 不能为空',
        },
        { status: 400 }
      );
    }

    const normalizedId = normalizeId(id);
    console.log(`[ORDER_GET] 规范化后的 ID: "${normalizedId}"`);

    const order = await prisma.order.findUnique({
      where: { id: normalizedId },
      include: {
        tickets: {
          select: {
            id: true,
            ticketCode: true,
            status: true,
            price: true,
            refundedAt: true,
            usedAt: true,
          },
        },
      },
    });

    if (!order) {
      console.warn(`[ORDER_GET] ❌ 订单不存在：orderId=${normalizedId}`);
      return NextResponse.json(
        {
          ok: false,
          code: 'ORDER_NOT_FOUND',
          error: '订单不存在或已被删除',
        },
        { status: 404 }
      );
    }

    console.log(`[ORDER_GET] ✅ 找到订单:`, order);

    return NextResponse.json({
      ok: true,
      id: order.id,
      userId: order.userId,
      eventId: Number(order.eventId),
      tierId: Number(order.tierId),
      qty: order.qty,
      holdId: order.holdId,
      status: order.status,
      createdAt: Number(order.createdAt),
      paidAt: order.paidAt ? Number(order.paidAt) : null,
      tickets: order.tickets,
    });
  } catch (err: unknown) {
    console.error('[ORDER_GET_ERROR]', err);

    if (err instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          error: err.message,
        },
        { status: err.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        error: '服务繁忙，请稍后重试',
      },
      { status: 500 }
    );
  }
}
