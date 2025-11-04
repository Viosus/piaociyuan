import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/nft/assets/my
 * 获取用户所有NFT资产
 */
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

    // 2️⃣ 查询用户的NFT资产
    const userNFTs = await prisma.userNFT.findMany({
      where: {
        userId: userId,
        mintStatus: 'minted', // 只显示已铸造的NFT
      },
      orderBy: {
        mintedAt: "desc",
      },
      include: {
        nft: true,
      },
    });

    // 3️⃣ 丰富数据
    const enrichedAssets = await Promise.all(
      userNFTs.map(async (userNFT: typeof userNFTs[number]) => {
        // 获取活动信息（如果有关联）
        let event = null;
        if (userNFT.nft.eventId) {
          event = await prisma.event.findUnique({
            where: { id: userNFT.nft.eventId },
            select: {
              name: true,
              cover: true,
              artist: true,
              date: true,
            },
          });
        }

        return {
          id: userNFT.id,
          tokenId: userNFT.tokenId,
          contractAddress: userNFT.contractAddress,
          name: userNFT.nft.name,
          imageUrl: userNFT.nft.imageUrl,
          description: userNFT.nft.description,
          orderNumber: userNFT.sourceId || "",
          metadataUri: userNFT.metadataUri || "",
          mintedAt: userNFT.mintedAt?.toISOString() || "",
          isTransferred: userNFT.isTransferred,
          // OpenSea 链接（使用Polygon Mumbai测试网）
          openseaUrl: `https://testnets.opensea.io/assets/mumbai/${userNFT.contractAddress}/${userNFT.tokenId}`,
          // 区块浏览器链接
          explorerUrl: `https://mumbai.polygonscan.com/token/${userNFT.contractAddress}?a=${userNFT.tokenId}`,
          // NFT 额外信息
          rarity: userNFT.nft.rarity,
          category: userNFT.nft.category,
          has3DModel: userNFT.nft.has3DModel,
          hasAR: userNFT.nft.hasAR,
        };
      })
    );

    return NextResponse.json({
      total: enrichedAssets.length,
      assets: enrichedAssets,
    });
  } catch (error) {
    console.error("查询NFT资产错误:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
