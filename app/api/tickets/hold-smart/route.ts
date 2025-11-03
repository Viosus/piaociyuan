// app/api/tickets/hold-smart/route.ts
/**
 * 智能购票 API（参考大麦网机制）
 *
 * 自动判断使用"自动分配"还是"手动选座"
 */

import { NextRequest, NextResponse } from 'next/server';
import { holdTickets, getSeatStatus } from '@/lib/ticket-strategy';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/tickets/hold-smart
 *
 * 请求体：
 * {
 *   eventId: string,
 *   tierId: string,
 *   qty?: number,              // 自动分配时需要
 *   specificSeatIds?: string[] // 手动选座时需要（可选）
 * }
 *
 * 响应：
 * {
 *   ok: true,
 *   mode: 'AUTO' | 'MANUAL',  // 实际使用的模式
 *   data: {
 *     holdId: string,
 *     expireAt: number,
 *     ticketIds: string[]
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: '未登录' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: '登录已过期' },
        { status: 401 }
      );
    }

    // 2. 解析请求参数
    const body = await req.json();
    const { eventId, tierId, qty, specificSeatIds } = body;

    if (!eventId || !tierId) {
      return NextResponse.json(
        { ok: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 3. 调用智能购票逻辑
    const result = await holdTickets({
      eventId,
      tierId,
      qty,
      specificSeatIds,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          mode: result.mode,
          error: result.error || '购票失败',
        },
        { status: 400 }
      );
    }

    // 4. 返回成功结果
    return NextResponse.json({
      ok: true,
      mode: result.mode,
      message:
        result.mode === 'AUTO'
          ? '系统已为您自动分配座位'
          : '已成功锁定您选择的座位',
      data: {
        holdId: result.holdId,
        expireAt: result.expireAt,
        ticketIds: result.ticketIds,
      },
    });
  } catch (error: unknown) {
    console.error('[HOLD_SMART_ERROR]', error);
    return NextResponse.json(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets/hold-smart?eventId=xxx&tierId=xxx
 *
 * 获取座位实时状态（用于前端显示座位图）
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const tierId = searchParams.get('tierId');

    if (!eventId || !tierId) {
      return NextResponse.json(
        { ok: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取座位状态
    const seats = await getSeatStatus(eventId, tierId);

    return NextResponse.json({
      ok: true,
      data: seats,
    });
  } catch (error: unknown) {
    console.error('[GET_SEAT_STATUS_ERROR]', error);
    return NextResponse.json(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
