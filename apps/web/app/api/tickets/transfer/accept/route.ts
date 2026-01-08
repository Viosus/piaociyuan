// app/api/tickets/transfer/accept/route.ts
/**
 * 接收/拒绝门票转让 API
 *
 * POST: 通过转让码接收门票
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * POST - 接收门票转让
 */
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
    const { transferCode, action = 'accept' } = body; // action: accept | reject

    if (!transferCode) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供转让码' },
        { status: 400 }
      );
    }

    // 查询转让记录
    const transfer = await prisma.ticketTransfer.findUnique({
      where: { transferCode: transferCode.toUpperCase() },
    });

    if (!transfer) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '转让码无效' },
        { status: 404 }
      );
    }

    // 检查是否是自己的转让
    if (transfer.fromUserId === userId) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_OPERATION', message: '不能接收自己发起的转让' },
        { status: 400 }
      );
    }

    // 检查转让状态
    if (transfer.status !== 'pending') {
      const statusMessages: Record<string, string> = {
        accepted: '该转让已被接收',
        rejected: '该转让已被拒绝',
        expired: '该转让已过期',
        cancelled: '该转让已被取消',
      };
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: statusMessages[transfer.status] || '转让状态异常' },
        { status: 400 }
      );
    }

    // 检查是否过期
    if (new Date() > transfer.expiresAt) {
      await prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { ok: false, code: 'EXPIRED', message: '转让已过期' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // 拒绝转让
      await prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'rejected',
          toUserId: userId,
          rejectedAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        message: '已拒绝转让',
      });
    }

    // 获取接收人信息（用于 NFT 转移）
    const toUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletAddress: true },
    });

    // 接收转让 - 使用事务
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新转让记录
      const updatedTransfer = await tx.ticketTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'accepted',
          toUserId: userId,
          acceptedAt: new Date(),
        },
      });

      // 2. 获取门票信息（包含 NFT 关联）
      const ticketWithNFT = await tx.ticket.findUnique({
        where: { id: transfer.ticketId },
      });

      // 3. 更新门票所有权
      const updatedTicket = await tx.ticket.update({
        where: { id: transfer.ticketId },
        data: {
          userId: userId,
        },
      });

      // 4. 如果门票关联了 NFT，同时转移 NFT 所有权
      let updatedUserNFT = null;
      if (ticketWithNFT?.nftUserNftId) {
        updatedUserNFT = await tx.userNFT.update({
          where: { id: ticketWithNFT.nftUserNftId },
          data: {
            userId: userId,
            // 更新链上所有者地址（如果接收人已绑定钱包）
            ownerWalletAddress: toUser?.walletAddress || '',
            // 标记为转移状态
            isTransferred: true,
            transferredTo: userId,
            transferredAt: new Date(),
            // 更新获得方式
            sourceType: 'transfer',
            sourceId: updatedTransfer.id,
          },
        });

        // 5. 更新用户 NFT 计数
        // 减少原所有者的 NFT 数量
        await tx.user.update({
          where: { id: transfer.fromUserId },
          data: { nftCount: { decrement: 1 } },
        });
        // 增加新所有者的 NFT 数量
        await tx.user.update({
          where: { id: userId },
          data: { nftCount: { increment: 1 } },
        });
      }

      return { transfer: updatedTransfer, ticket: updatedTicket, userNFT: updatedUserNFT };
    });

    // 获取活动信息
    const ticket = await prisma.ticket.findUnique({
      where: { id: result.ticket.id },
    });

    let event = null;
    if (ticket) {
      event = await prisma.event.findUnique({
        where: { id: ticket.eventId },
        select: { id: true, name: true, date: true, venue: true, cover: true },
      });
    }

    // 获取 NFT 信息（如果有）
    let nftInfo = null;
    if (result.userNFT) {
      const nft = await prisma.nFT.findUnique({
        where: { id: result.userNFT.nftId },
        select: { id: true, name: true, imageUrl: true, rarity: true },
      });
      nftInfo = {
        userNftId: result.userNFT.id,
        nft,
        // 提示：如果 NFT 已上链，需要在链上完成转移
        needsOnChainTransfer: result.userNFT.isOnChain && result.userNFT.mintStatus === 'minted',
      };
    }

    // TODO: 发送通知给转让人
    // TODO: 如果 NFT 已上链，触发链上转移流程

    return NextResponse.json({
      ok: true,
      data: {
        transferId: result.transfer.id,
        ticket: {
          id: result.ticket.id,
          ticketCode: result.ticket.ticketCode,
          price: result.ticket.price,
        },
        event,
        nft: nftInfo,
      },
      message: result.userNFT ? '门票和 NFT 接收成功' : '门票接收成功',
    });
  } catch (error: unknown) {
    console.error('[TICKET_TRANSFER_ACCEPT_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
