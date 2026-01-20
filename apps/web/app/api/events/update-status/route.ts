// app/api/events/update-status/route.ts
import { NextResponse } from 'next/server';
import { updateEventStatuses } from '@/lib/cron';

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
    const result = await updateEventStatuses();

    return NextResponse.json({
      ok: true,
      message: `成功更新 ${result.updatedCount} 个活动状态`,
      data: result,
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
