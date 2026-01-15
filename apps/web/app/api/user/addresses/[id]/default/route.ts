// app/api/user/addresses/[id]/default/route.ts
/**
 * 设置默认地址 API
 *
 * POST /api/user/addresses/:id/default - 设为默认地址
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 认证
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

    // 2. 获取地址
    const address = await prisma.userAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '地址不存在' },
        { status: 404 }
      );
    }

    // 3. 验证所有权
    if (address.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权操作此地址' },
        { status: 403 }
      );
    }

    // 4. 事务：取消其他默认，设置当前为默认
    await prisma.$transaction([
      // 取消所有默认
      prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      // 设置当前为默认
      prisma.userAddress.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    // 5. 返回更新后的地址
    const updated = await prisma.userAddress.findUnique({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: '已设为默认地址',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('[ADDRESS_DEFAULT_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '设置默认地址失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
