// app/api/admin/events/route.ts
/**
 * 管理员 - 活动管理 API
 *
 * GET  /api/admin/events - 获取活动列表
 * POST /api/admin/events - 创建活动（含票档）
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

const VALID_CATEGORIES = ['concert', 'festival', 'exhibition', 'musicale', 'show', 'sports', 'other'];
const VALID_SALE_STATUSES = ['not_started', 'on_sale', 'paused', 'sold_out', 'ended'];

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
          error: getErrorMessage(error),
        }),
      },
      { status: 500 }
    );
  }
}

// ✅ 创建活动（含票档）
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const body = await req.json();
    const { name, category, city, venue, date, time, cover, artist, desc, saleStatus, saleStartTime, saleEndTime, tiers } = body;

    // 验证必填字段
    if (!name || !category || !city || !venue || !date || !time || !cover || !artist || !desc || !saleStartTime || !saleEndTime) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的活动分类' },
        { status: 400 }
      );
    }

    if (saleStatus && !VALID_SALE_STATUSES.includes(saleStatus)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的售票状态' },
        { status: 400 }
      );
    }

    const parsedSaleStart = new Date(saleStartTime);
    const parsedSaleEnd = new Date(saleEndTime);

    if (isNaN(parsedSaleStart.getTime()) || isNaN(parsedSaleEnd.getTime())) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的售票时间格式' },
        { status: 400 }
      );
    }

    if (parsedSaleEnd <= parsedSaleStart) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '停售时间必须晚于开售时间' },
        { status: 400 }
      );
    }

    // 验证票档
    if (tiers && Array.isArray(tiers)) {
      for (const tier of tiers) {
        if (!tier.name || typeof tier.price !== 'number' || typeof tier.capacity !== 'number') {
          return NextResponse.json(
            { ok: false, code: 'INVALID_INPUT', message: '票档信息不完整，需要 name、price、capacity' },
            { status: 400 }
          );
        }
        if (tier.price < 0 || tier.capacity <= 0) {
          return NextResponse.json(
            { ok: false, code: 'INVALID_INPUT', message: '票档价格不能为负数，容量必须大于0' },
            { status: 400 }
          );
        }
      }
    }

    // 使用事务创建活动和票档
    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          name,
          category,
          city,
          venue,
          date,
          time,
          cover,
          artist,
          desc,
          saleStatus: saleStatus || 'not_started',
          saleStartTime: parsedSaleStart,
          saleEndTime: parsedSaleEnd,
        },
      });

      if (tiers && Array.isArray(tiers) && tiers.length > 0) {
        await tx.tier.createMany({
          data: tiers.map((tier: { name: string; price: number; capacity: number }) => ({
            eventId: newEvent.id,
            name: tier.name,
            price: tier.price,
            capacity: tier.capacity,
            remaining: tier.capacity,
            sold: 0,
          })),
        });
      }

      return tx.event.findUnique({
        where: { id: newEvent.id },
        include: { tiers: true },
      });
    });

    return NextResponse.json({ ok: true, data: event }, { status: 201 });
  } catch (error: unknown) {
    console.error('[ADMIN_EVENT_CREATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '创建活动失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: getErrorMessage(error),
        }),
      },
      { status: 500 }
    );
  }
}
