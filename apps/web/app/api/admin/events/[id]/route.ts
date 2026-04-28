// app/api/admin/events/[id]/route.ts
/**
 * 管理员 - 单个活动管理 API
 *
 * GET    /api/admin/events/[id] - 获取活动详情
 * PUT    /api/admin/events/[id] - 更新活动
 * DELETE /api/admin/events/[id] - 删除活动
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

const VALID_CATEGORIES = ['concert', 'festival', 'exhibition', 'musicale', 'show', 'sports', 'other'];

// ✅ 获取单个活动详情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的活动ID' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tiers: true,
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '活动不存在' },
        { status: 404 }
      );
    }

    // 获取订单统计
    const orders = await prisma.order.findMany({
      where: { eventId: String(eventId) },
      select: { status: true, qty: true },
    });

    const orderStats = {
      total: orders.length,
      paid: orders.filter(o => o.status === 'PAID').length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      refunded: orders.filter(o => o.status === 'REFUNDED').length,
      totalTicketsSold: orders
        .filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + o.qty, 0),
    };

    // 获取门票使用统计
    const ticketStats = await prisma.ticket.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true,
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...event,
        orderStats,
        ticketStats: ticketStats.map(t => ({ status: t.status, count: t._count })),
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_EVENT_DETAIL_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取活动详情失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}

// ✅ 更新活动信息
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的活动ID' },
        { status: 400 }
      );
    }

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '活动不存在' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, category, city, venue, date, time, cover, artist, desc, saleStartTime, saleEndTime } = body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的活动分类' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (city !== undefined) updateData.city = city;
    if (venue !== undefined) updateData.venue = venue;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (cover !== undefined) updateData.cover = cover;
    if (artist !== undefined) updateData.artist = artist;
    if (desc !== undefined) updateData.desc = desc;
    if (saleStartTime !== undefined) updateData.saleStartTime = new Date(saleStartTime);
    if (saleEndTime !== undefined) updateData.saleEndTime = new Date(saleEndTime);

    // 验证售票时间逻辑
    const finalStart = saleStartTime ? new Date(saleStartTime) : existing.saleStartTime;
    const finalEnd = saleEndTime ? new Date(saleEndTime) : existing.saleEndTime;
    if (finalEnd <= finalStart) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '停售时间必须晚于开售时间' },
        { status: 400 }
      );
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: { tiers: true },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: unknown) {
    console.error('[ADMIN_EVENT_UPDATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '更新活动失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}

// ✅ 删除活动
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的活动ID' },
        { status: 400 }
      );
    }

    // 检查是否有已支付订单
    const paidOrders = await prisma.order.count({
      where: {
        eventId: String(eventId),
        status: 'PAID',
      },
    });

    if (paidOrders > 0) {
      return NextResponse.json(
        { ok: false, code: 'HAS_PAID_ORDERS', message: `该活动有 ${paidOrders} 个已支付订单，无法删除` },
        { status: 400 }
      );
    }

    // 先删除相关的票和订单（非 PAID 状态）
    await prisma.$transaction(async (tx) => {
      // 删除关联的票
      await tx.ticket.deleteMany({ where: { eventId } });
      // 删除非已支付订单
      await tx.order.deleteMany({ where: { eventId: String(eventId) } });
      // 删除活动（tiers 会 cascade）
      await tx.event.delete({ where: { id: eventId } });
    });

    return NextResponse.json({ ok: true, message: '活动已删除' });
  } catch (error: unknown) {
    console.error('[ADMIN_EVENT_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '删除活动失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
