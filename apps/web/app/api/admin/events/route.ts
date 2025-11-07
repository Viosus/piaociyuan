// app/api/admin/events/route.ts
/**
 * 管理员 - 活动管理 API
 *
 * GET /api/admin/events - 获取活动列表
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ 验证管理员权限
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        {
          ok: false,
          code: authResult.error,
          message: authResult.message,
        },
        { status: authResult.status }
      );
    }

    // 2️⃣ 解析查询参数
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 3️⃣ 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city !== 'all') {
      where.city = city;
    }

    // 4️⃣ 获取活动列表
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          tiers: {
            select: {
              id: true,
              name: true,
              price: true,
              capacity: true,
              remaining: true,
            },
          },
          _count: {
            select: {
              posts: true,
              followers: true,
              nfts: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        events,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_EVENTS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取活动列表失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
