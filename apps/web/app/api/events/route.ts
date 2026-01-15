// app/api/events/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Force reload - category field should be returned
export async function GET(req: Request) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 新增筛选参数
    const dateFrom = searchParams.get('dateFrom'); // 日期范围开始
    const dateTo = searchParams.get('dateTo');     // 日期范围结束
    const minPrice = searchParams.get('minPrice'); // 最低价格
    const maxPrice = searchParams.get('maxPrice'); // 最高价格
    const hasNft = searchParams.get('hasNft');     // 是否有NFT纪念品
    const sortBy = searchParams.get('sortBy') || 'date'; // 排序字段: date, price
    const sortOrder = searchParams.get('sortOrder') || 'asc'; // 排序顺序: asc, desc

    // 构建 where 条件
    const where: Prisma.EventWhereInput = {};

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

    // 日期范围筛选
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = dateFrom;
      }
      if (dateTo) {
        where.date.lte = dateTo;
      }
    }

    // 价格范围筛选（通过票档价格）
    if (minPrice || maxPrice) {
      where.tiers = {
        some: {
          price: {
            ...(minPrice ? { gte: parseInt(minPrice) } : {}),
            ...(maxPrice ? { lte: parseInt(maxPrice) } : {}),
          },
        },
      };
    }

    // 是否有NFT纪念品
    if (hasNft === 'true') {
      where.nfts = {
        some: {},
      };
    } else if (hasNft === 'false') {
      where.nfts = {
        none: {},
      };
    }

    // 构建排序
    let orderBy: Prisma.EventOrderByWithRelationInput = { date: 'asc' };
    if (sortBy === 'date') {
      orderBy = { date: sortOrder === 'desc' ? 'desc' : 'asc' };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder === 'desc' ? 'desc' : 'asc' };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy,
      include: {
        tiers: {
          orderBy: {
            price: 'asc',
          },
        },
        _count: {
          select: { nfts: true },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 转换为前端期望的格式
    const formattedEvents = events.map((event) => ({
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
      // 最低价格（方便前端显示）
      minPrice: event.tiers.length > 0 ? Math.min(...event.tiers.map(t => t.price)) : null,
      maxPrice: event.tiers.length > 0 ? Math.max(...event.tiers.map(t => t.price)) : null,
      // NFT纪念品数量
      hasNft: event._count.nfts > 0,
      nftCount: event._count.nfts,
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
