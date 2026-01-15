// app/api/nft/transfer/accept/route.ts
/**
 * 接收/拒绝 NFT 转让 API
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
    const { transferCode, action = 'accept' } = body;

    if (!transferCode) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供转让码' },
        { status: 400 }
      );
    }

    // 查询转让记录
    const transfer = await prisma.nFTTransfer.findUnique({
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
      await prisma.nFTTransfer.update({
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
      await prisma.nFTTransfer.update({
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

    // 获取接收人信息
    const toUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletAddress: true },
    });

    // 接收转让 - 使用事务
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 更新转让记录
      const updatedTransfer = await tx.nFTTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'accepted',
          toUserId: userId,
          acceptedAt: new Date(),
        },
      });

      // 2. 获取当前 UserNFT 信息
      const currentUserNft = await tx.userNFT.findUnique({
        where: { id: transfer.userNftId },
      });

      if (!currentUserNft) {
        throw new Error('NFT 不存在');
      }

      // 3. 更新 NFT 所有权
      const updatedUserNft = await tx.userNFT.update({
        where: { id: transfer.userNftId },
        data: {
          userId: userId,
          ownerWalletAddress: toUser?.walletAddress || '',
          isTransferred: true,
          transferredTo: userId,
          transferredAt: new Date(),
          sourceType: 'transfer',
          sourceId: updatedTransfer.id,
        },
      });

      // 4. 更新用户 NFT 计数
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

      return { transfer: updatedTransfer, userNft: updatedUserNft };
    });

    // 获取完整的 NFT 信息
    const nft = await prisma.nFT.findUnique({
      where: { id: result.userNft.nftId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        rarity: true,
        description: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        transferId: result.transfer.id,
        userNft: {
          id: result.userNft.id,
          tokenId: result.userNft.tokenId,
          contractAddress: result.userNft.contractAddress,
          isOnChain: result.userNft.isOnChain,
        },
        nft,
        // 提示：如果 NFT 已上链，需要在链上完成转移
        needsOnChainTransfer: result.userNft.isOnChain && result.userNft.mintStatus === 'minted',
      },
      message: 'NFT 接收成功',
    });
  } catch (error: unknown) {
    console.error('[NFT_TRANSFER_ACCEPT_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
