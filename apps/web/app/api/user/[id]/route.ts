// app/api/user/[id]/route.ts
/**
 * 获取用户资料 API
 *
 * GET /api/user/[id] - 获取指定用户的公开资料
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '无效的用户 ID',
        },
        { status: 400 }
      );
    }

    // 获取当前登录用户（可选，用于判断关注状态）
    let currentUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        currentUserId = payload.id;
      }
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        bio: true,
        coverImage: true,
        website: true,
        location: true,
        isVerified: true,
        verifiedType: true,
        nftCount: true,
        followerCount: true,
        followingCount: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '用户不存在',
        },
        { status: 404 }
      );
    }

    // 检查当前用户是否关注了该用户
    let isFollowing = false;
    let isFollowedBy = false;

    if (currentUserId && currentUserId !== userId) {
      const [followStatus, followedByStatus] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: userId,
            },
          },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: currentUserId,
            },
          },
        }),
      ]);

      isFollowing = !!followStatus;
      isFollowedBy = !!followedByStatus;
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        coverImage: user.coverImage,
        website: user.website,
        location: user.location,
        isVerified: user.isVerified,
        verifiedType: user.verifiedType,
        createdAt: user.createdAt,
        isFollowing,
        isFollowedBy,
        stats: {
          postCount: user._count.posts,
          nftCount: user.nftCount,
          followerCount: user.followerCount,
          followingCount: user.followingCount,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[USER_PROFILE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取用户资料失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
