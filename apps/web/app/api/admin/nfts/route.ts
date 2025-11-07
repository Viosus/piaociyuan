// app/api/admin/nfts/route.ts
/**
 * 管理员 - NFT管理 API
 *
 * GET /api/admin/nfts - 获取NFT列表
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
    const category = searchParams.get('category') || 'all';
    const sourceType = searchParams.get('sourceType') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 3️⃣ 构建查询条件
    const where: any = {};

    if (category !== 'all') {
      where.category = category;
    }

    if (sourceType !== 'all') {
      where.sourceType = sourceType;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // 4️⃣ 获取NFT列表
    const [nfts, total] = await Promise.all([
      prisma.nFT.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              userNFTs: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.nFT.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        nfts,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_NFTS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取NFT列表失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
