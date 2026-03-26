/**
 * 单票退款 API
 * POST /api/tickets/[id]/refund
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
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
    const { id: ticketId } = await params;

    // 查询门票
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '门票不存在' },
        { status: 404 }
      );
    }

    // 验证所有权
    if (ticket.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权操作此门票' },
        { status: 403 }
      );
    }

    // 检查状态：只有 sold 状态的票可以退
    if (ticket.status !== 'sold') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: '该门票当前状态无法退票' },
        { status: 400 }
      );
    }

    // 检查是否已使用
    if (ticket.usedAt) {
      return NextResponse.json(
        { ok: false, code: 'TICKET_USED', message: '已使用的门票无法退票' },
        { status: 400 }
      );
    }

    // 更新门票状态
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
        userId: null,
      },
    });

    // 恢复库存
    await prisma.tier.update({
      where: { id: ticket.tierId },
      data: { sold: { decrement: 1 } },
    });

    console.log(`[TICKET_REFUND] 门票已退: ticketId=${ticketId}, userId=${userId}`);

    return NextResponse.json({
      ok: true,
      data: { success: true },
      message: '退票成功',
    });
  } catch (error: unknown) {
    console.error('[TICKET_REFUND_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '退票失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
