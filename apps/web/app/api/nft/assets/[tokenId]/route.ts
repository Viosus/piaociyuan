import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/nft/assets/[tokenId]
 * 获取单个NFT资产详情
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    // 验证用户身份
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "无效的令牌" }, { status: 401 });
    }

    const userId = payload.id as string;
    const { tokenId } = await params;

    // 查询NFT资产
    const asset = await prisma.userNFT.findFirst({
      where: {
        tokenId: parseInt(tokenId),
        userId: userId,
      },
      include: {
        nft: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "NFT不存在" }, { status: 404 });
    }

    // 获取活动和票档信息（如果有关联）
    let event = null;
    let tier = null;

    if (asset.nft.eventId) {
      event = await prisma.event.findUnique({
        where: { id: asset.nft.eventId },
        select: {
          id: true,
          name: true,
          venue: true,
          date: true,
          time: true,
        },
      });
    }

    if (asset.nft.tierId) {
      tier = await prisma.tier.findUnique({
        where: { id: asset.nft.tierId },
        select: {
          id: true,
          name: true,
          price: true,
        },
      });
    }

    return NextResponse.json({
      asset: {
        id: asset.id,
        tokenId: asset.tokenId,
        contractAddress: asset.contractAddress,
        metadataUri: asset.metadataUri,
        currentOwnerAddress: asset.ownerWalletAddress,
        mintedAt: asset.mintedAt?.toISOString() || '',
        // 3D 模型相关字段
        has3DModel: asset.nft.has3DModel,
        model3DUrl: asset.nft.model3DUrl,
        modelFormat: asset.nft.modelFormat,
        // 其他信息
        order: {
          id: asset.sourceId || '',
          eventId: asset.nft.eventId || 0,
          tierId: asset.nft.tierId || 0,
        },
        event,
        tier,
      },
    });
  } catch (error) {
    console.error("获取NFT详情错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
