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
import { getErrorMessage } from '@/lib/error-utils';

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

    if (!role || !['user', 'staff', 'admin'].includes(role)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '无效的角色类型',
        },
        { status: 400 }
      );
    }

    // 只有超级管理员才能授予 admin 权限
    if (role === 'admin') {
      const superAdminId = process.env.SUPER_ADMIN_ID;
      if (superAdminId && authResult.user.id !== superAdminId) {
        return NextResponse.json(
          {
            ok: false,
            code: 'FORBIDDEN',
            message: '仅超级管理员可以授予管理员权限',
          },
          { status: 403 }
        );
      }
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
          error: getErrorMessage(error),
        }),
      },
      { status: 500 }
    );
  }
}

// ✅ 封禁/解封用户
export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id: userId } = await params;
    const body = await req.json();
    const { action, reason } = body;

    if (!action || !['ban', 'unban'].includes(action)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的操作，仅支持 ban/unban' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, nickname: true, isBanned: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '用户不存在' },
        { status: 404 }
      );
    }

    if (user.id === authResult.user.id) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '不能封禁自己' },
        { status: 403 }
      );
    }

    if (user.role === 'admin') {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '不能封禁管理员账户' },
        { status: 403 }
      );
    }

    if (action === 'ban') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: reason || '违反社区规定',
        },
      });
      console.log('[ADMIN_USER_BANNED]', { userId, reason });
      return NextResponse.json({ ok: true, message: '用户已封禁' });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          bannedAt: null,
          bannedReason: null,
        },
      });
      console.log('[ADMIN_USER_UNBANNED]', { userId });
      return NextResponse.json({ ok: true, message: '用户已解封' });
    }
  } catch (error: unknown) {
    console.error('[ADMIN_USER_BAN_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '操作失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '用户不存在' },
        { status: 404 }
      );
    }

    if (user.id === authResult.user.id) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '不能删除自己' },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    console.log('[ADMIN_USER_DELETED]', { userId });

    return NextResponse.json({ ok: true, message: '用户已删除' });
  } catch (error: unknown) {
    console.error('[ADMIN_USER_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '删除用户失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
