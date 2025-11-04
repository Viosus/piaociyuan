// app/api/users/[id]/follow/route.ts
/**
 * 用户关注/取消关注 API
 *
 * GET /api/users/[id]/follow - 查询关注状态
 * POST /api/users/[id]/follow - 关注用户
 * DELETE /api/users/[id]/follow - 取消关注
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> };

// GET - 查询关注状态
export async function GET(req: NextRequest, { params }: Props) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const currentUserId = payload.id;
    const { id: targetUserId } = await params;

    // 2️⃣ 检查是否关注
    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    // 3️⃣ 获取目标用户信息
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        followerCount: true,
        followingCount: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '用户不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        isFollowing: !!follow,
        followerCount: targetUser.followerCount,
      },
    });
  } catch (error: unknown) {
    console.error('[FOLLOW_STATUS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST - 关注用户
export async function POST(req: NextRequest, { params }: Props) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const followerId = payload.id;
    const { id: followingId } = await params;

    console.log('[FOLLOW_USER]', { followerId, followingId });

    // 2️⃣ 不能关注自己
    if (followerId === followingId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '不能关注自己',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '用户不存在',
        },
        { status: 404 }
      );
    }

    // 4️⃣ 检查是否已关注
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        {
          ok: false,
          code: 'ALREADY_FOLLOWING',
          message: '已关注该用户',
        },
        { status: 400 }
      );
    }

    // 5️⃣ 创建关注关系（事务）
    await prisma.$transaction([
      // 创建关注记录
      prisma.userFollow.create({
        data: {
          followerId,
          followingId,
        },
      }),
      // 更新关注者的关注数
      prisma.user.update({
        where: { id: followerId },
        data: {
          followingCount: {
            increment: 1,
          },
        },
      }),
      // 更新被关注者的粉丝数
      prisma.user.update({
        where: { id: followingId },
        data: {
          followerCount: {
            increment: 1,
          },
        },
      }),
    ]);

    // 6️⃣ 获取更新后的粉丝数
    const updatedUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { followerCount: true },
    });

    console.log('[FOLLOW_SUCCESS]', { followerId, followingId });

    return NextResponse.json({
      ok: true,
      data: {
        isFollowing: true,
        followerCount: updatedUser?.followerCount || 0,
      },
      message: '关注成功',
    });
  } catch (error: unknown) {
    console.error('[FOLLOW_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '关注失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - 取消关注
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const followerId = payload.id;
    const { id: followingId } = await params;

    console.log('[UNFOLLOW_USER]', { followerId, followingId });

    // 2️⃣ 检查关注关系是否存在
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOLLOWING',
          message: '未关注该用户',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 删除关注关系（事务）
    await prisma.$transaction([
      // 删除关注记录
      prisma.userFollow.delete({
        where: { id: existingFollow.id },
      }),
      // 更新关注者的关注数
      prisma.user.update({
        where: { id: followerId },
        data: {
          followingCount: {
            decrement: 1,
          },
        },
      }),
      // 更新被关注者的粉丝数
      prisma.user.update({
        where: { id: followingId },
        data: {
          followerCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    // 4️⃣ 获取更新后的粉丝数
    const updatedUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { followerCount: true },
    });

    console.log('[UNFOLLOW_SUCCESS]', { followerId, followingId });

    return NextResponse.json({
      ok: true,
      data: {
        isFollowing: false,
        followerCount: updatedUser?.followerCount || 0,
      },
      message: '取消关注',
    });
  } catch (error: unknown) {
    console.error('[UNFOLLOW_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '取消关注失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
