// app/api/tickets/transfer/route.ts
/**
 * 门票转让/赠送 API
 *
 * POST: 发起转让
 * GET: 获取我的转让记录
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { nanoid } from 'nanoid';

// 生成转让码
function generateTransferCode(): string {
  return nanoid(8).toUpperCase();
}

/**
 * POST - 发起门票转让/赠送
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
    const { ticketId, transferType = 'gift', price, message, toUserPhone, toUserEmail, expiresInHours = 48 } = body;

    if (!ticketId) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供门票ID' },
        { status: 400 }
      );
    }

    // 查询门票
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        order: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '门票不存在' },
        { status: 404 }
      );
    }

    // 验证门票所有权
    if (ticket.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '只能转让自己的门票' },
        { status: 403 }
      );
    }

    // 检查门票状态
    if (ticket.status === 'used') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: '门票已使用，无法转让' },
        { status: 400 }
      );
    }

    if (ticket.status === 'refunded') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: '门票已退票，无法转让' },
        { status: 400 }
      );
    }

    // 检查是否有未完成的转让
    const existingTransfer = await prisma.ticketTransfer.findFirst({
      where: {
        ticketId,
        status: 'pending',
      },
    });

    if (existingTransfer) {
      return NextResponse.json(
        { ok: false, code: 'TRANSFER_EXISTS', message: '该门票已有待处理的转让，请先取消' },
        { status: 400 }
      );
    }

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // 创建转让记录
    const transfer = await prisma.ticketTransfer.create({
      data: {
        ticketId,
        fromUserId: userId,
        transferCode: generateTransferCode(),
        transferType,
        price: transferType === 'sale' ? price : null,
        message,
        toUserPhone,
        toUserEmail,
        expiresAt,
        status: 'pending',
      },
    });

    // TODO: 发送通知给接收人（短信/邮件）

    return NextResponse.json({
      ok: true,
      data: {
        id: transfer.id,
        transferCode: transfer.transferCode,
        transferType: transfer.transferType,
        price: transfer.price,
        message: transfer.message,
        expiresAt: transfer.expiresAt,
        status: transfer.status,
      },
      message: '转让发起成功',
    });
  } catch (error: unknown) {
    console.error('[TICKET_TRANSFER_CREATE_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * GET - 获取我的转让记录
 */
export async function GET(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'sent'; // sent(发出的) / received(收到的)
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (type === 'sent') {
      where.fromUserId = userId;
    } else {
      where.toUserId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [transfers, total] = await Promise.all([
      prisma.ticketTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticketTransfer.count({ where }),
    ]);

    // 获取关联的门票信息
    const ticketIds = transfers.map(t => t.ticketId);
    const tickets = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
    });

    // 获取活动信息
    const eventIds = [...new Set(tickets.map(t => t.eventId))];
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, name: true, date: true, venue: true, cover: true },
    });

    const ticketMap = new Map(tickets.map(t => [t.id, t]));
    const eventMap = new Map(events.map(e => [e.id, e]));

    // 获取用户信息
    const userIds = [...new Set([
      ...transfers.map(t => t.fromUserId),
      ...transfers.filter(t => t.toUserId).map(t => t.toUserId!),
    ])];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatar: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const result = transfers.map(transfer => {
      const ticket = ticketMap.get(transfer.ticketId);
      const event = ticket ? eventMap.get(ticket.eventId) : null;
      const fromUser = userMap.get(transfer.fromUserId);
      const toUser = transfer.toUserId ? userMap.get(transfer.toUserId) : null;

      return {
        id: transfer.id,
        transferCode: transfer.transferCode,
        transferType: transfer.transferType,
        price: transfer.price,
        message: transfer.message,
        status: transfer.status,
        expiresAt: transfer.expiresAt,
        createdAt: transfer.createdAt,
        acceptedAt: transfer.acceptedAt,
        ticket: ticket ? {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          price: ticket.price,
        } : null,
        event,
        fromUser,
        toUser,
      };
    });

    return NextResponse.json({
      ok: true,
      data: result,
      total,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error('[TICKET_TRANSFER_LIST_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
