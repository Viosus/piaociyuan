/**
 * 获取指定用户的粉丝列表
 * GET /api/user/[id]/followers
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  try {
    // 认证（可选）
    const authHeader = req.headers.get('authorization');
    let currentUserId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        currentUserId = payload.id;
      }
    }

    const { id: userId } = await params;

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 查询粉丝
    const [followers, totalCount] = await Promise.all([
      prisma.userFollow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              isVerified: true,
              verifiedType: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.userFollow.count({ where: { followingId: userId } }),
    ]);

    // 如果当前用户已登录，查询关注状态
    let followingMap: Record<string, boolean> = {};
    if (currentUserId) {
      const userIds = followers.map(f => f.follower.id);
      if (userIds.length > 0) {
        const myFollowings = await prisma.userFollow.findMany({
          where: {
            followerId: currentUserId,
            followingId: { in: userIds },
          },
          select: { followingId: true },
        });
        for (const f of myFollowings) {
          followingMap[f.followingId] = true;
        }
      }
    }

    const data = followers.map(f => ({
      id: f.follower.id,
      nickname: f.follower.nickname || '匿名用户',
      avatar: f.follower.avatar || null,
      isVerified: f.follower.isVerified,
      bio: f.follower.bio || null,
      isFollowing: currentUserId ? (followingMap[f.follower.id] || false) : undefined,
    }));

    return NextResponse.json({
      ok: true,
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: unknown) {
    console.error('[USER_FOLLOWERS_LIST_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '获取粉丝列表失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
