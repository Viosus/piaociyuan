// app/api/admin/verifications/[id]/route.ts
/**
 * 管理员 - 审核认证申请 API
 *
 * PATCH /api/admin/verifications/[id] - 审核认证申请（批准/拒绝）
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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

    const adminId = authResult.user.id;
    const { id: requestId } = await params;

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { action, rejectReason, verificationBadge } = body; // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '无效的操作类型',
        },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectReason) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '拒绝时必须提供原因',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 查找认证申请
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '认证申请不存在',
        },
        { status: 404 }
      );
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        {
          ok: false,
          code: 'ALREADY_PROCESSED',
          message: '该申请已被处理',
        },
        { status: 400 }
      );
    }

    // 4️⃣ 更新认证申请状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 更新申请状态
      await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectReason: action === 'reject' ? rejectReason : null,
        },
      });

      // 如果批准，更新用户认证状态
      if (action === 'approve') {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            isVerified: true,
            verifiedType: request.verifiedType,
            verifiedAt: new Date(),
            verificationBadge: verificationBadge || null,
          },
        });
      }
    });

    console.log('[ADMIN_VERIFICATION_PROCESSED]', {
      requestId,
      action,
      userId: request.userId,
    });

    return NextResponse.json({
      ok: true,
      message: action === 'approve' ? '已批准认证申请' : '已拒绝认证申请',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_VERIFICATION_PROCESS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '处理认证申请失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
