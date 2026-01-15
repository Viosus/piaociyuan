// app/api/nft/transfer/cancel/route.ts
/**
 * 取消 NFT 转让 API
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
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

    const userId = payload.id;
    const body = await req.json();
    const { transferId } = body;

    if (!transferId) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供转让ID' },
        { status: 400 }
      );
    }

    // 查询转让记录
    const transfer = await prisma.nFTTransfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '转让记录不存在' },
        { status: 404 }
      );
    }

    // 验证是转让发起人
    if (transfer.fromUserId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '只能取消自己发起的转让' },
        { status: 403 }
      );
    }

    // 检查转让状态
    if (transfer.status !== 'pending') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: '只能取消待处理的转让' },
        { status: 400 }
      );
    }

    // 更新转让状态
    await prisma.nFTTransfer.update({
      where: { id: transferId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: '转让已取消',
    });
  } catch (error: unknown) {
    console.error('[NFT_TRANSFER_CANCEL_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
