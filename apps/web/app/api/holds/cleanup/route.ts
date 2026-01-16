// app/api/holds/cleanup/route.ts
/**
 * 清理过期的座位锁定 API
 *
 * GET /api/holds/cleanup - 清理所有过期的座位锁定记录
 *
 * 该接口被定时任务调用，每 5 分钟执行一次
 */

import { NextResponse } from 'next/server';
import { purgeExpiredHolds } from '@/lib/inventory';

export async function GET() {
  try {
    const now = Date.now();
    const purgedCount = await purgeExpiredHolds(now);

    return NextResponse.json({
      ok: true,
      message: `清理了 ${purgedCount} 个过期锁票`,
      data: {
        purgedCount,
        timestamp: new Date(now).toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('[HOLDS_CLEANUP_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '清理过期锁票失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
