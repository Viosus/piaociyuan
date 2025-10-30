// app/api/admin/users/[id]/role/route.ts
/**
 * 管理员API：修改用户角色
 *
 * 功能：
 * - 仅管理员可调用
 * - 修改指定用户的role
 * - 记录权限变更日志
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    // 1️⃣ 验证管理员权限
    const authHeader = req.headers.get('authorization');
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

    // 检查是否为管理员
    if (payload.role !== 'admin') {
      return NextResponse.json(
        {
          ok: false,
          code: 'PERMISSION_DENIED',
          message: '仅管理员可以修改用户角色',
        },
        { status: 403 }
      );
    }

    // 2️⃣ 获取参数
    const { id: userId } = await params;
    const body = await req.json();
    const { role } = body;

    // 验证角色值
    if (!['user', 'staff', 'admin'].includes(role)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_ROLE',
          message: '无效的角色类型，仅支持: user, staff, admin',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 查找目标用户
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          ok: false,
          code: 'USER_NOT_FOUND',
          message: '用户不存在',
        },
        { status: 404 }
      );
    }

    // 4️⃣ 更新角色
    const oldRole = targetUser.role;
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    console.log(
      `[ADMIN] 管理员 ${payload.id} 将用户 ${userId} 的角色从 ${oldRole} 改为 ${role}`
    );

    // 5️⃣ 返回结果
    return NextResponse.json({
      ok: true,
      message: `用户角色已更新：${oldRole} → ${role}`,
      data: {
        userId: targetUser.id,
        email: targetUser.email,
        phone: targetUser.phone,
        nickname: targetUser.nickname,
        oldRole,
        newRole: role,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN_UPDATE_ROLE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '修改角色失败',
      },
      { status: 500 }
    );
  }
}
