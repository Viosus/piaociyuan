// app/api/events/update-status/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 自动更新活动状态的 API
 *
 * 规则：
 * 1. 如果当前时间 < 售票开始时间 -> not_started (未开售)
 * 2. 如果当前时间 >= 售票开始时间 && < 售票结束时间 -> on_sale (售票中)
 * 3. 如果当前时间 >= 售票结束时间 || 活动日期已过 -> ended (已结束)
 */
export async function POST(_req: Request) {
  try {
    const now = new Date();

    // 获取所有需要更新状态的活动
    const events = await prisma.event.findMany({
      select: {
        id: true,
        date: true,
        time: true,
        saleStartTime: true,
        saleEndTime: true,
        saleStatus: true,
      },
    });

    const updates: Array<{ id: number; newStatus: string; reason: string }> = [];

    for (const event of events) {
      // 跳过已暂停的活动（手动控制）
      if (event.saleStatus === 'paused') {
        continue;
      }

      let newStatus = event.saleStatus;
      let reason = '';

      // 解析活动日期时间
      const eventDateTime = new Date(`${event.date}T${event.time}`);

      // 规则 1: 活动已结束（活动日期已过）
      if (eventDateTime < now) {
        newStatus = 'ended';
        reason = '活动日期已过';
      }
      // 规则 2: 售票已结束（售票结束时间已过）
      else if (event.saleEndTime && event.saleEndTime < now) {
        newStatus = 'ended';
        reason = '售票时间已过';
      }
      // 规则 3: 售票中（在售票时间范围内）
      else if (
        event.saleStartTime &&
        event.saleStartTime <= now &&
        event.saleEndTime &&
        event.saleEndTime > now
      ) {
        newStatus = 'on_sale';
        reason = '在售票时间内';
      }
      // 规则 4: 未开售（售票开始时间未到）
      else if (event.saleStartTime && event.saleStartTime > now) {
        newStatus = 'not_started';
        reason = '售票未开始';
      }

      // 如果状态需要更新
      if (newStatus !== event.saleStatus) {
        await prisma.event.update({
          where: { id: event.id },
          data: { saleStatus: newStatus },
        });

        updates.push({
          id: event.id,
          newStatus,
          reason,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `成功更新 ${updates.length} 个活动状态`,
      data: {
        updatedCount: updates.length,
        updates,
      },
    });
  } catch (error) {
    console.error('[UPDATE_EVENT_STATUS_ERROR]', error);
    return NextResponse.json(
      { ok: false, error: '更新活动状态失败' },
      { status: 500 }
    );
  }
}

/**
 * GET 请求也支持（方便测试和手动触发）
 */
export async function GET(req: Request) {
  return POST(req);
}
