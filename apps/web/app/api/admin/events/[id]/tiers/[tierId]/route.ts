// app/api/admin/events/[id]/tiers/[tierId]/route.ts
/**
 * 管理员 - 单个票档管理 API
 *
 * PUT    /api/admin/events/[id]/tiers/[tierId] - 修改票档
 * DELETE /api/admin/events/[id]/tiers/[tierId] - 删除票档
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

// ✅ 修改票档
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tierId: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id, tierId } = await params;
    const eventId = parseInt(id);
    const tierIdNum = parseInt(tierId);

    if (isNaN(eventId) || isNaN(tierIdNum)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的ID' },
        { status: 400 }
      );
    }

    const tier = await prisma.tier.findFirst({
      where: { id: tierIdNum, eventId },
    });

    if (!tier) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '票档不存在' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, price, capacity } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_INPUT', message: '价格不能为负数' },
          { status: 400 }
        );
      }
      updateData.price = price;
    }
    if (capacity !== undefined) {
      if (typeof capacity !== 'number' || capacity <= 0) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_INPUT', message: '容量必须大于0' },
          { status: 400 }
        );
      }
      if (capacity < tier.sold) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_INPUT', message: `容量不能小于已售数量(${tier.sold})` },
          { status: 400 }
        );
      }
      updateData.capacity = capacity;
      updateData.remaining = capacity - tier.sold;
    }

    const updated = await prisma.tier.update({
      where: { id: tierIdNum },
      data: updateData,
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: unknown) {
    console.error('[ADMIN_TIER_UPDATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '修改票档失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}

// ✅ 删除票档
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tierId: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id, tierId } = await params;
    const eventId = parseInt(id);
    const tierIdNum = parseInt(tierId);

    if (isNaN(eventId) || isNaN(tierIdNum)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的ID' },
        { status: 400 }
      );
    }

    const tier = await prisma.tier.findFirst({
      where: { id: tierIdNum, eventId },
    });

    if (!tier) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '票档不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联的票
    const ticketCount = await prisma.ticket.count({
      where: { tierId: tierIdNum },
    });

    if (ticketCount > 0) {
      return NextResponse.json(
        { ok: false, code: 'HAS_TICKETS', message: `该票档已有 ${ticketCount} 张票，无法删除` },
        { status: 400 }
      );
    }

    await prisma.tier.delete({ where: { id: tierIdNum } });

    return NextResponse.json({ ok: true, message: '票档已删除' });
  } catch (error: unknown) {
    console.error('[ADMIN_TIER_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '删除票档失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
