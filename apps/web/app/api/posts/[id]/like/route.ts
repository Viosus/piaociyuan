// app/api/posts/[id]/like/route.ts
/**
 * 帖子点赞/取消点赞 API
 *
 * POST /api/posts/[id]/like - 切换点赞状态
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> };

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

    const userId = payload.id;
    const { id: postId } = await params;

    console.log('[LIKE_TOGGLE]', { userId, postId });

    // 2️⃣ 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, isVisible: true },
    });

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '帖子不存在',
        },
        { status: 404 }
      );
    }

    if (!post.isVisible) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '帖子已被删除',
        },
        { status: 404 }
      );
    }

    // 3️⃣ 检查用户是否已点赞
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let isLiked: boolean;
    let likeCount: number;

    // 4️⃣ 使用事务切换点赞状态
    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.postLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.post.update({
          where: { id: postId },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      isLiked = false;
      console.log('[LIKE_REMOVED]', { userId, postId });
    } else {
      // 添加点赞
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            postId,
            userId,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        }),
      ]);

      isLiked = true;
      console.log('[LIKE_ADDED]', { userId, postId });
    }

    // 5️⃣ 获取更新后的点赞数
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true },
    });

    likeCount = updatedPost?.likeCount || 0;

    return NextResponse.json({
      ok: true,
      data: {
        isLiked,
        likeCount,
      },
      message: isLiked ? '点赞成功' : '取消点赞',
    });
  } catch (error: unknown) {
    console.error('[LIKE_TOGGLE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '操作失败',
        error: (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

// GET 获取点赞状态（可选，用于前端查询用户是否已点赞某个帖子）
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

    const userId = payload.id;
    const { id: postId } = await params;

    // 2️⃣ 查询点赞状态
    const like = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        isLiked: !!like,
        likeCount: post?.likeCount || 0,
      },
    });
  } catch (error: unknown) {
    console.error('[LIKE_STATUS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询失败',
        error: (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
