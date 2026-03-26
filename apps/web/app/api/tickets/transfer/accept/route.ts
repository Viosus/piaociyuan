// app/api/tickets/transfer/accept/route.ts
/**
 * 接收/拒绝门票转让 API
 *
 * POST: 通过转让码接收门票
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

/**
 * POST - 接收门票转让
 */
export async function POST(req: Request) {
  try {
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
    const body = await req.json();
    const { transferCode, action = 'accept' } = body; // action: accept | reject

    if (!transferCode) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供转让码' },
        { status: 400 }
      );
    }

    // 查询转让记录
    const transfer = await prisma.ticketTransfer.findUnique({
      where: { transferCode: transferCode.toUpperCase() },
    });

    if (!transfer) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '转让码无效' },
        { status: 404 }
      );
    }

    // 检查是否是自己的转让
    if (transfer.fromUserId === userId) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_OPERATION', message: '不能接收自己发起的转让' },
        { status: 400 }
      );
    }

    // 检查转让状态
    if (transfer.status !== 'pending') {
      const statusMessages: Record<string, string> = {
        accepted: '该转让已被接收',
        rejected: '该转让已被拒绝',
        expired: '该转让已过期',
        cancelled: '该转让已被取消',
      };
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: statusMessages[transfer.status] || '转让状态异常' },
        { status: 400 }
      );
    }

    // 检查是否过期
    if (new Date() > transfer.expiresAt) {
      await prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { ok: false, code: 'EXPIRED', message: '转让已过期' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // 拒绝转让
      await prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'rejected',
          toUserId: userId,
          rejectedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        message: '已拒绝转让',
      });
    }

    // 接收转让 - 使用事务
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 更新转让记录
      const updatedTransfer = await tx.ticketTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'accepted',
          toUserId: userId,
          acceptedAt: new Date(),
        },
      });

      // 2. 更新门票所有权
      const updatedTicket = await tx.ticket.update({
        where: { id: transfer.ticketId },
        data: {
          userId: userId,
        },
      });

      return { transfer: updatedTransfer, ticket: updatedTicket };
    });

    // 获取活动信息
    const ticket = await prisma.ticket.findUnique({
      where: { id: result.ticket.id },
    });

    let event = null;
    if (ticket) {
      event = await prisma.event.findUnique({
        where: { id: ticket.eventId },
        select: { id: true, name: true, date: true, venue: true, cover: true },
      });
    }

    // TODO: 发送通知给转让人

    return NextResponse.json({
      ok: true,
      data: {
        transferId: result.transfer.id,
        ticket: {
          id: result.ticket.id,
          ticketCode: result.ticket.ticketCode,
          price: result.ticket.price,
        },
        event,
      },
      message: '门票接收成功',
    });
  } catch (error: unknown) {
    console.error('[TICKET_TRANSFER_ACCEPT_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
