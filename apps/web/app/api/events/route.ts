// app/api/events/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force reload - category field should be returned
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'asc',
      },
      include: {
        tiers: {
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    // Debug: log first event to check category
    if (events.length > 0) {
      console.log('[API] First event keys:', Object.keys(events[0]));
      console.log('[API] First event category:', events[0].category);
    }

    return NextResponse.json({ ok: true, events });
  } catch (error) {
    console.error('[EVENTS_API_ERROR]', error);
    return NextResponse.json(
      { ok: false, error: '获取活动列表失败' },
      { status: 500 }
    );
  }
}
