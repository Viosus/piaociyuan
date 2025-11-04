// app/api/events/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    return NextResponse.json(events);
  } catch (error) {
    console.error('[EVENTS_API_ERROR]', error);
    return NextResponse.json(
      { error: '获取活动列表失败' },
      { status: 500 }
    );
  }
}
