// app/api/admin/verifications/route.ts
/**
 * 管理员 - 认证审核 API
 *
 * GET /api/admin/verifications - 获取认证申请列表
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    // 2️⃣ 解析查询参数
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const verifiedType = searchParams.get('verifiedType') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 3️⃣ 构建查询条件
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (verifiedType !== 'all') {
      where.verifiedType = verifiedType;
    }

    // 4️⃣ 获取认证申请列表
    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        requests,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_VERIFICATIONS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取认证申请列表失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
