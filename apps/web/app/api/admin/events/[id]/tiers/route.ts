// app/api/admin/events/[id]/tiers/route.ts
/**
 * 管理员 - 活动票档管理 API
 *
 * POST /api/admin/events/[id]/tiers - 添加票档
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function POST(
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

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '活动不存在' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, price, capacity } = body;

    if (!name || typeof price !== 'number' || typeof capacity !== 'number') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '请填写票档名称、价格和容量' },
        { status: 400 }
      );
    }

    if (price < 0 || capacity <= 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '价格不能为负数，容量必须大于0' },
        { status: 400 }
      );
    }

    const tier = await prisma.tier.create({
      data: {
        eventId,
        name,
        price,
        capacity,
        remaining: capacity,
        sold: 0,
      },
    });

    return NextResponse.json({ ok: true, data: tier }, { status: 201 });
  } catch (error: unknown) {
    console.error('[ADMIN_TIER_CREATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '添加票档失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
