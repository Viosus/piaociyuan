// app/api/user/nfts/route.ts
/**
 * 用户NFT收藏 API
 *
 * 功能：
 * - 获取用户的所有NFT数字藏品
 * - 支持按稀有度、类别、来源筛选
 * - 支持分页
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
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

    // 2️⃣ 获取查询参数
    const { searchParams } = new URL(req.url);
    const rarity = searchParams.get('rarity'); // common, rare, epic, legendary
    const category = searchParams.get('category'); // badge, ticket_stub, poster, certificate, art
    const sourceType = searchParams.get('sourceType'); // ticket_purchase, direct_purchase, airdrop, transfer
    const mintStatus = searchParams.get('mintStatus'); // pending, minting, minted, failed
    const isOnChain = searchParams.get('isOnChain'); // true, false

    console.log('[USER_NFTS] 查询参数:', {
      userId,
      rarity,
      category,
      sourceType,
      mintStatus,
      isOnChain
    });

    // 3️⃣ 构建查询条件
    const where: Prisma.UserNFTWhereInput = {
      userId,
    };

    // 添加NFT筛选条件
    if (rarity || category) {
      where.nft = {};
      if (rarity) where.nft.rarity = rarity;
      if (category) where.nft.category = category;
    }

    if (sourceType) {
      where.sourceType = sourceType;
    }

    if (mintStatus) {
      where.mintStatus = mintStatus;
    }

    if (isOnChain !== null) {
      where.isOnChain = isOnChain === 'true';
    }

    // 4️⃣ 查询用户的NFT
    const userNFTs = await prisma.userNFT.findMany({
      where,
      include: {
        nft: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { obtainedAt: 'desc' }, // 最新获得的在前
      ],
    });

    // 5️⃣ 格式化数据
    const collection = userNFTs.map((un) => ({
      id: un.id,
      nft: {
        id: un.nft.id,
        name: un.nft.name,
        description: un.nft.description,
        imageUrl: un.nft.imageUrl,
        rarity: un.nft.rarity,
        category: un.nft.category,
        sourceType: un.nft.sourceType,
        // 3D/AR 相关
        has3DModel: un.nft.has3DModel,
        model3DUrl: un.nft.model3DUrl || null,
        modelFormat: un.nft.modelFormat || null,
        hasAR: un.nft.hasAR,
        arUrl: un.nft.arUrl || null,
        hasAnimation: un.nft.hasAnimation,
        animationUrl: un.nft.animationUrl || null,
        modelConfig: un.nft.modelConfig
          ? JSON.parse(un.nft.modelConfig)
          : null,
        // 供应信息
        totalSupply: un.nft.totalSupply,
        mintedCount: un.nft.mintedCount,
      },
      // 所有权信息
      ownerWalletAddress: un.ownerWalletAddress,
      contractAddress: un.contractAddress,
      tokenId: un.tokenId,
      // 铸造信息
      mintStatus: un.mintStatus,
      isOnChain: un.isOnChain,
      mintedAt: un.mintedAt?.toISOString() || null,
      mintTransactionHash: un.mintTransactionHash || null,
      // 获得方式
      sourceType: un.sourceType,
      sourceId: un.sourceId || null,
      obtainedAt: un.obtainedAt.toISOString(),
      // 元数据
      metadata: un.metadata ? JSON.parse(un.metadata) : null,
      metadataUri: un.metadataUri || null,
    }));

    // 6️⃣ 统计信息
    const stats = {
      total: collection.length,
      byRarity: {
        legendary: collection.filter((c) => c.nft.rarity === 'legendary').length,
        epic: collection.filter((c) => c.nft.rarity === 'epic').length,
        rare: collection.filter((c) => c.nft.rarity === 'rare').length,
        common: collection.filter((c) => c.nft.rarity === 'common').length,
      },
      byCategory: {
        badge: collection.filter((c) => c.nft.category === 'badge').length,
        ticket_stub: collection.filter((c) => c.nft.category === 'ticket_stub').length,
        poster: collection.filter((c) => c.nft.category === 'poster').length,
        certificate: collection.filter((c) => c.nft.category === 'certificate').length,
        art: collection.filter((c) => c.nft.category === 'art').length,
      },
      byMintStatus: {
        pending: collection.filter((c) => c.mintStatus === 'pending').length,
        minting: collection.filter((c) => c.mintStatus === 'minting').length,
        minted: collection.filter((c) => c.mintStatus === 'minted').length,
        failed: collection.filter((c) => c.mintStatus === 'failed').length,
      },
      has3D: collection.filter((c) => c.nft.has3DModel).length,
      hasAR: collection.filter((c) => c.nft.hasAR).length,
      onChain: collection.filter((c) => c.isOnChain).length,
    };

    console.log('[USER_NFTS] 查询成功:', stats);

    return NextResponse.json({
      ok: true,
      data: collection,
      stats,
    });
  } catch (error: unknown) {
    console.error('[USER_NFTS_ERROR]', error);
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
