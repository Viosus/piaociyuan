// app/api/admin/users/[id]/route.ts
/**
 * 管理员 - 用户操作 API
 *
 * PATCH /api/admin/users/[id] - 更新用户角色
 * DELETE /api/admin/users/[id] - 删除用户（软删除，实际是标记为禁用）
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

    const { id: userId } = await params;

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { role } = body;

    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '无效的角色类型',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
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

    // 4️⃣ 更新用户角色
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    console.log('[ADMIN_USER_UPDATED]', { userId, newRole: role });

    return NextResponse.json({
      ok: true,
      message: '用户角色已更新',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_USER_UPDATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '更新用户失败',
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

    const { id: userId } = await params;

    // 2️⃣ 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
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

    // 防止删除管理员自己
    if (user.id === authResult.user.id) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FORBIDDEN',
          message: '不能删除自己',
        },
        { status: 403 }
      );
    }

    // 3️⃣ 删除用户（实际删除，小心使用）
    // 注意：这会触发级联删除，删除用户的所有关联数据
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log('[ADMIN_USER_DELETED]', { userId });

    return NextResponse.json({
      ok: true,
      message: '用户已删除',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_USER_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '删除用户失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
