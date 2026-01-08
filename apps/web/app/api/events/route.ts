// app/api/events/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force reload - category field should be returned
export async function GET(req: Request) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 构建 where 条件
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (status) {
      // 映射移动端的 status 到后端的 saleStatus
      const statusMap: Record<string, string | string[]> = {
        'upcoming': 'on_sale', // 即将开始的活动 -> 正在售票中
        'ongoing': 'on_sale',  // 进行中的活动 -> 正在售票中
        'ended': 'ended',      // 已结束的活动
      };

      const mappedStatus = statusMap[status] || status;
      if (Array.isArray(mappedStatus)) {
        where.saleStatus = { in: mappedStatus };
      } else {
        where.saleStatus = mappedStatus;
      }
    }

    const events = await prisma.event.findMany({
      where,
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 转换为前端期望的格式
    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      description: event.desc,
      city: event.city,
      venue: event.venue,
      date: event.date,
      time: event.time,
      startTime: `${event.date}T${event.time}`,
      endTime: `${event.date}T${event.time}`,
      coverImage: event.cover,
      cover: event.cover,  // 兼容旧字段名
      category: event.category,
      status: event.saleStatus,
      saleStatus: event.saleStatus,
      saleStartTime: event.saleStartTime?.toISOString(),
      saleEndTime: event.saleEndTime?.toISOString(),
      artist: event.artist,
      createdAt: event.createdAt.toISOString(),
      tiers: event.tiers,
    }));

    return NextResponse.json({ ok: true, data: formattedEvents });
  } catch (error) {
    console.error('[EVENTS_API_ERROR]', error);
    return NextResponse.json(
      { ok: false, error: '获取活动列表失败' },
      { status: 500 }
    );
  }
}
