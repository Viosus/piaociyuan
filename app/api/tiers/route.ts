// app/api/tiers/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId parameter' },
        { status: 400 }
      );
    }

    const tiers = await prisma.tier.findMany({
      where: {
        eventId: Number(eventId),
      },
      orderBy: {
        price: 'asc',
      },
    });

    return NextResponse.json(tiers);
  } catch (err: any) {
    console.error('[TIERS_GET_ERROR]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
