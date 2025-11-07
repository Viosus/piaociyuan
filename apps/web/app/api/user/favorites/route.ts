// app/api/user/favorites/route.ts
/**
 * 用户收藏列表 API
 * GET - 获取用户收藏的帖子列表
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '未提供认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '认证信息无效或已过期' },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // 获取URL参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    // 获取收藏列表
    const [favorites, total] = await Promise.all([
      prisma.postFavorite.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  isVerified: true,
                  verifiedType: true,
                },
              },
              event: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  venue: true,
                  date: true,
                  time: true,
                  cover: true,
                },
              },
              images: {
                select: {
                  id: true,
                  imageUrl: true,
                  width: true,
                  height: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.postFavorite.count({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        favorites: favorites.map((fav) => ({
          id: fav.id,
          createdAt: fav.createdAt,
          post: fav.post,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    console.error('[GET_FAVORITES_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '获取收藏列表失败' },
      { status: 500 }
    );
  }
}
