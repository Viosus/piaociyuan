// app/api/admin/posts/[id]/route.ts
/**
 * 管理员 - 帖子操作 API
 *
 * PATCH /api/admin/posts/[id] - 隐藏/显示帖子
 * DELETE /api/admin/posts/[id] - 删除帖子
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
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

    const { id: postId } = await params;

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '无效的参数',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
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

    // 4️⃣ 更新帖子可见性
    await prisma.post.update({
      where: { id: postId },
      data: { isVisible },
    });

    console.log('[ADMIN_POST_UPDATED]', { postId, isVisible });

    return NextResponse.json({
      ok: true,
      message: isVisible ? '帖子已显示' : '帖子已隐藏',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_POST_UPDATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '更新帖子失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
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

    const { id: postId } = await params;

    // 2️⃣ 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
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

    // 3️⃣ 删除帖子（会级联删除相关数据）
    await prisma.post.delete({
      where: { id: postId },
    });

    console.log('[ADMIN_POST_DELETED]', { postId });

    return NextResponse.json({
      ok: true,
      message: '帖子已删除',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_POST_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '删除帖子失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
