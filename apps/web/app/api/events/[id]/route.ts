// app/api/events/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Props = { params: Promise<{ id: string }> };

type TierData = {
  id: number;
  eventId: number;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
};

export async function GET(_req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tiers: {
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { ok: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // 字段映射：统一前端字段名
    const mappedEvent = {
      id: event.id,
      name: event.name,
      description: event.desc,
      venue: event.venue,
      startTime: `${event.date}T${event.time}`,
      endTime: `${event.date}T${event.time}`, // 如果没有单独的结束时间，使用相同的时间
      coverImage: event.cover,
      category: event.category,
      status: event.saleStatus, // on_sale -> ongoing 等映射
      createdAt: event.createdAt,
      tiers: event.tiers.map((tier: TierData) => ({
        id: tier.id,
        eventId: tier.eventId,
        name: tier.name,
        price: tier.price,
        capacity: tier.capacity,
        available: tier.remaining, // remaining -> available
        description: '', // 如果 tier 没有 description 字段，设置为空字符串
      })),
    };

    return NextResponse.json({ ok: true, data: mappedEvent });
  } catch (err: unknown) {
    console.error('[EVENT_GET_ERROR]', err);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
