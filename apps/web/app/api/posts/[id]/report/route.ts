// app/api/posts/[id]/report/route.ts
/**
 * 帖子举报 API
 *
 * POST /api/posts/[id]/report - 举报帖子
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

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '请输入举报原因',
        },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '举报原因不能超过500字',
        },
        { status: 400 }
      );
    }

    console.log('[POST_REPORT]', { userId, postId, reason: reason.substring(0, 50) });

    // 3️⃣ 检查帖子是否存在
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

    // 4️⃣ 检查是否已经举报过
    const existingReport = await (prisma as any).postReport.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });
    
    if (existingReport) {
      return NextResponse.json(
        {
          ok: false,
          code: 'ALREADY_REPORTED',
          message: '您已经举报过该帖子',
        },
        { status: 400 }
      );
    }

    // 5️⃣ 创建举报记录
    await (prisma as any).postReport.create({
      data: {
        postId,
        userId,
        reason: reason.trim(),
        status: 'pending',
      },
    });

    console.log('[POST_REPORT_SUCCESS]', { userId, postId });

    return NextResponse.json({
      ok: true,
      message: '举报成功',
    });
  } catch (error: unknown) {
    console.error('[POST_REPORT_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '举报失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
