// app/api/admin/events/[id]/sale-status/route.ts
/**
 * 管理员 - 售票状态控制 API
 *
 * PATCH /api/admin/events/[id]/sale-status - 修改售票状态
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

const VALID_SALE_STATUSES = ['not_started', 'on_sale', 'paused', 'sold_out', 'ended'];

export async function PATCH(
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

    const body = await req.json();
    const { saleStatus } = body;

    if (!saleStatus || !VALID_SALE_STATUSES.includes(saleStatus)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的售票状态' },
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

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { saleStatus },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        saleStatus: updated.saleStatus,
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_SALE_STATUS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '修改售票状态失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
