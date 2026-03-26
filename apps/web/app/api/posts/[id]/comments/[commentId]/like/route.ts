/**
 * 评论点赞/取消点赞 API
 * POST /api/posts/[id]/comments/[commentId]/like - 点赞评论
 * DELETE /api/posts/[id]/comments/[commentId]/like - 取消点赞评论
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

type Props = { params: Promise<{ id: string; commentId: string }> };

// 点赞评论
export async function POST(req: NextRequest, { params }: Props) {
  try {
    // 认证
    const authHeader = req.headers.get('authorization');
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

    const { id: postId, commentId } = await params;

    // 检查评论是否存在且属于该帖子
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, likeCount: true },
    });

    if (!comment || comment.postId !== postId) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '评论不存在' },
        { status: 404 }
      );
    }

    // 增加点赞数
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });

    return NextResponse.json({
      ok: true,
      data: { isLiked: true, likeCount: updated.likeCount },
      message: '点赞成功',
    });
  } catch (error: unknown) {
    console.error('[COMMENT_LIKE_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '点赞失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// 取消点赞评论
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    // 认证
    const authHeader = req.headers.get('authorization');
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

    const { id: postId, commentId } = await params;

    // 检查评论是否存在且属于该帖子
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, likeCount: true },
    });

    if (!comment || comment.postId !== postId) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '评论不存在' },
        { status: 404 }
      );
    }

    // 减少点赞数（不低于 0）
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: Math.max(0, comment.likeCount - 1) },
      select: { likeCount: true },
    });

    return NextResponse.json({
      ok: true,
      data: { isLiked: false, likeCount: updated.likeCount },
      message: '取消点赞',
    });
  } catch (error: unknown) {
    console.error('[COMMENT_UNLIKE_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '取消点赞失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
