// app/api/admin/reports/[id]/route.ts
/**
 * 管理员 - 处理举报 API
 *
 * PATCH /api/admin/reports/[id] - 更新举报状态（批准/拒绝）
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

    const { id: reportId } = await params;

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { action, hidePost } = body; // action: 'approve' | 'reject'

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

    // 3️⃣ 查找举报记录
    const report = await prisma.postReport.findUnique({
      where: { id: reportId },
      include: { post: true },
    });

    if (!report) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '举报记录不存在',
        },
        { status: 404 }
      );
    }

    if (report.status !== 'pending') {
      return NextResponse.json(
        {
          ok: false,
          code: 'ALREADY_PROCESSED',
          message: '该举报已被处理',
        },
        { status: 400 }
      );
    }

    // 4️⃣ 更新举报状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await prisma.$transaction(async (tx) => {
      // 更新举报状态
      await tx.postReport.update({
        where: { id: reportId },
        data: { status: newStatus },
      });

      // 如果批准举报并且要隐藏帖子
      if (action === 'approve' && hidePost) {
        await tx.post.update({
          where: { id: report.postId },
          data: { isVisible: false },
        });
      }
    });

    console.log('[ADMIN_REPORT_PROCESSED]', {
      reportId,
      action,
      hidePost,
      postId: report.postId,
    });

    return NextResponse.json({
      ok: true,
      message: action === 'approve' ? '已批准举报' : '已拒绝举报',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_REPORT_PROCESS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '处理举报失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
