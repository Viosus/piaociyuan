// app/api/admin/posts/route.ts
/**
 * 管理员 - 帖子管理 API
 *
 * GET /api/admin/posts - 获取帖子列表
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
    const visibility = searchParams.get('visibility') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 3️⃣ 构建查询条件
    const where: any = {};

    if (visibility === 'visible') {
      where.isVisible = true;
    } else if (visibility === 'hidden') {
      where.isVisible = false;
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    // 4️⃣ 获取帖子列表
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              phone: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
            },
            take: 1,
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              reports: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        posts,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_POSTS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取帖子列表失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
