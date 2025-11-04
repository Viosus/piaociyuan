// app/api/tickets/use/route.ts
/**
 * 检票（使用票）API
 *
 * ⚠️ 注意：此API仅供测试使用
 *
 * 生产环境流程：
 * 1. 用户购票后获得票的二维码
 * 2. 演出当天，工作人员扫描二维码
 * 3. 工作人员系统调用验票API（需要工作人员权限）
 * 4. 验票成功后自动发放纪念品
 * 5. 用户在"我的次元"中查看纪念品
 *
 * 当前测试功能：
 * - 用户可自行点击检票按钮（生产环境应移除）
 * - 不检查演出日期限制（生产环境应启用）
 * - 不验证工作人员权限（生产环境应添加）
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // 2️⃣ 获取参数
    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '请提供票 ID',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 验证票是否属于该用户
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId,
        status: 'sold', // 只能使用已售出的票
      },
      include: {
        order: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          ok: false,
          code: 'TICKET_NOT_FOUND',
          message: '票不存在、不属于您或已使用',
        },
        { status: 404 }
      );
    }

    // 4️⃣ 检查订单是否已支付
    if (ticket.order?.status !== 'PAID') {
      return NextResponse.json(
        {
          ok: false,
          code: 'ORDER_NOT_PAID',
          message: '订单未支付，无法使用票',
        },
        { status: 400 }
      );
    }

    // 5️⃣ 检查演出日期（必须是演出当天或之后）
    const event = await prisma.event.findUnique({
      where: { id: ticket.eventId },
    });

    if (!event) {
      return NextResponse.json(
        {
          ok: false,
          code: 'EVENT_NOT_FOUND',
          message: '活动不存在',
        },
        { status: 404 }
      );
    }

    // 检查是否到演出日期
    // 注意：为了测试方便，暂时允许提前检票
    // 生产环境应该严格检查演出日期
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    // TODO: 生产环境取消注释以下代码
    // if (today < eventDate) {
    //   return NextResponse.json(
    //     {
    //       ok: false,
    //       code: 'EVENT_NOT_STARTED',
    //       message: `活动尚未开始，演出日期: ${event.date}`,
    //     },
    //     { status: 400 }
    //   );
    // }

    // 6️⃣ 执行检票（标记票为已使用）
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'used',
        usedAt: new Date(),
      },
    });

    console.log(`[USE_TICKET_SUCCESS] ticketId=${ticketId}, userId=${userId}`);

    return NextResponse.json({
      ok: true,
      message: '检票成功',
      data: {
        ticketId,
        ticketCode: ticket.ticketCode,
        usedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('[USE_TICKET_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '检票失败',
      },
      { status: 500 }
    );
  }
}
