// app/api/posts/[id]/favorite/route.ts
/**
 * 帖子收藏 API
 * POST - 收藏帖子
 * DELETE - 取消收藏
 * GET - 检查是否已收藏
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: postId } = await params;

    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '帖子不存在' },
        { status: 404 }
      );
    }

    // 检查是否已收藏
    const existingFavorite = await prisma.postFavorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { ok: false, code: 'ALREADY_FAVORITED', message: '已经收藏过此帖子' },
        { status: 400 }
      );
    }

    // 创建收藏
    await prisma.postFavorite.create({
      data: {
        postId,
        userId,
      },
    });

    console.log('[POST_FAVORITE_SUCCESS]', { postId, userId });

    return NextResponse.json({
      ok: true,
      message: '收藏成功',
    });
  } catch (error: unknown) {
    console.error('[POST_FAVORITE_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '收藏失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: postId } = await params;

    // 检查是否已收藏
    const existingFavorite = await prisma.postFavorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FAVORITED', message: '未收藏此帖子' },
        { status: 400 }
      );
    }

    // 删除收藏
    await prisma.postFavorite.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    console.log('[POST_UNFAVORITE_SUCCESS]', { postId, userId });

    return NextResponse.json({
      ok: true,
      message: '已取消收藏',
    });
  } catch (error: unknown) {
    console.error('[POST_UNFAVORITE_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '取消收藏失败' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: postId } = await params;

    // 检查是否已收藏
    const favorite = await prisma.postFavorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      isFavorited: !!favorite,
    });
  } catch (error: unknown) {
    console.error('[POST_FAVORITE_CHECK_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '检查收藏状态失败' },
      { status: 500 }
    );
  }
}
