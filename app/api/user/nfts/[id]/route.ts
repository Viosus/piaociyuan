// app/api/user/nfts/[id]/route.ts
/**
 * 单个NFT详情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
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

    const userId = payload.id;
    const { id } = await params;

    console.log('[NFT_DETAIL] 查询:', { userId, userNftId: id });

    // 2️⃣ 查询NFT详情
    const userNFT = await prisma.userNFT.findFirst({
      where: {
        id,
        userId, // 确保是用户自己的NFT
      },
      include: {
        nft: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!userNFT) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: 'NFT不存在',
        },
        { status: 404 }
      );
    }

    // 3️⃣ 格式化数据
    const data = {
      id: userNFT.id,
      nft: {
        id: userNFT.nft.id,
        name: userNFT.nft.name,
        description: userNFT.nft.description,
        imageUrl: userNFT.nft.imageUrl,
        rarity: userNFT.nft.rarity,
        category: userNFT.nft.category,
        sourceType: userNFT.nft.sourceType,
        // 3D/AR 功能
        has3DModel: userNFT.nft.has3DModel,
        model3DUrl: userNFT.nft.model3DUrl || null,
        modelFormat: userNFT.nft.modelFormat || null,
        hasAR: userNFT.nft.hasAR,
        arUrl: userNFT.nft.arUrl || null,
        hasAnimation: userNFT.nft.hasAnimation,
        animationUrl: userNFT.nft.animationUrl || null,
        modelConfig: userNFT.nft.modelConfig
          ? JSON.parse(userNFT.nft.modelConfig)
          : null,
        // 供应信息
        totalSupply: userNFT.nft.totalSupply,
        mintedCount: userNFT.nft.mintedCount,
        // 经济模型
        price: userNFT.nft.price || null,
        isMarketable: userNFT.nft.isMarketable,
        // 区块链信息
        contractAddress: userNFT.nft.contractAddress || null,
        tokenIdStart: userNFT.nft.tokenIdStart || null,
        metadataUriTemplate: userNFT.nft.metadataUriTemplate || null,
        // 关联信息
        eventId: userNFT.nft.eventId || null,
        tierId: userNFT.nft.tierId || null,
      },
      // 所有权信息
      owner: {
        id: userNFT.user.id,
        nickname: userNFT.user.nickname,
        avatar: userNFT.user.avatar,
        walletAddress: userNFT.user.walletAddress,
      },
      ownerWalletAddress: userNFT.ownerWalletAddress,
      contractAddress: userNFT.contractAddress,
      tokenId: userNFT.tokenId,
      metadataUri: userNFT.metadataUri || null,
      // 铸造信息
      mintStatus: userNFT.mintStatus,
      isOnChain: userNFT.isOnChain,
      mintTransactionHash: userNFT.mintTransactionHash || null,
      mintedAt: userNFT.mintedAt?.toISOString() || null,
      mintError: userNFT.mintError || null,
      // 转移信息
      isTransferred: userNFT.isTransferred,
      transferredTo: userNFT.transferredTo || null,
      transferredAt: userNFT.transferredAt?.toISOString() || null,
      // 获得方式
      sourceType: userNFT.sourceType,
      sourceId: userNFT.sourceId || null,
      obtainedAt: userNFT.obtainedAt.toISOString(),
      lastSyncedAt: userNFT.lastSyncedAt?.toISOString() || null,
      // 元数据
      metadata: userNFT.metadata ? JSON.parse(userNFT.metadata) : null,
    };

    console.log('[NFT_DETAIL] 查询成功');

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error: unknown) {
    console.error('[NFT_DETAIL_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询失败',
        error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : '未知错误',
      },
      { status: 500 }
    );
  }
}
