// app/api/nft/transfer/[code]/route.ts
/**
 * 通过转让码获取 NFT 转让详情
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供转让码' },
        { status: 400 }
      );
    }

    // 查询转让记录
    const transfer = await prisma.nFTTransfer.findUnique({
      where: { transferCode: code.toUpperCase() },
    });

    if (!transfer) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '转让码无效' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (transfer.status === 'pending' && new Date() > transfer.expiresAt) {
      await prisma.nFTTransfer.update({
        where: { id: transfer.id },
        data: { status: 'expired' },
      });
      transfer.status = 'expired';
    }

    // 获取 UserNFT 和 NFT 信息
    const userNft = await prisma.userNFT.findUnique({
      where: { id: transfer.userNftId },
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
            description: true,
            category: true,
          },
        },
      },
    });

    // 获取转让人信息
    const fromUser = await prisma.user.findUnique({
      where: { id: transfer.fromUserId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        isVerified: true,
        verifiedType: true,
      },
    });

    // 获取接收人信息（如果已接收）
    let toUser = null;
    if (transfer.toUserId) {
      toUser = await prisma.user.findUnique({
        where: { id: transfer.toUserId },
        select: {
          id: true,
          nickname: true,
          avatar: true,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: transfer.id,
        transferCode: transfer.transferCode,
        transferType: transfer.transferType,
        price: transfer.price,
        message: transfer.message,
        status: transfer.status,
        expiresAt: transfer.expiresAt,
        createdAt: transfer.createdAt,
        acceptedAt: transfer.acceptedAt,
        userNft: userNft ? {
          id: userNft.id,
          tokenId: userNft.tokenId,
          contractAddress: userNft.contractAddress,
          isOnChain: userNft.isOnChain,
          mintStatus: userNft.mintStatus,
          obtainedAt: userNft.obtainedAt,
        } : null,
        nft: userNft?.nft || null,
        fromUser,
        toUser,
      },
    });
  } catch (error: unknown) {
    console.error('[NFT_TRANSFER_DETAIL_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
