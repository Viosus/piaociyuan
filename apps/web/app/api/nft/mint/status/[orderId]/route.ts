import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/nft/mint/status/[ticketId]
 * 查询票的NFT铸造状态
 *
 * 注意：虽然路径参数名为 orderId，但实际应该传入 ticketId
 * 这是为了保持API兼容性
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // 验证用户身份
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 });
    }

    const userId = payload.id as string;
    const { orderId: ticketId } = await params;

    // 查询票的信息
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId: userId,
      },
      select: {
        nftMintStatus: true,
        nftUserNftId: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "票不存在" }, { status: 404 });
    }

    // 如果有UserNFT记录，查询详细信息
    let userNFT = null;
    if (ticket.nftUserNftId) {
      userNFT = await prisma.userNFT.findUnique({
        where: { id: ticket.nftUserNftId },
        select: {
          tokenId: true,
          mintStatus: true,
          mintTransactionHash: true,
          mintedAt: true,
          mintError: true,
        },
      });
    }

    // 查询队列状态
    const queueItem = await prisma.nFTMintQueue.findFirst({
      where: {
        userNftId: ticket.nftUserNftId || "",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        status: true,
        errorMessage: true,
        retryCount: true,
      },
    });

    return NextResponse.json({
      ticketStatus: ticket.nftMintStatus,
      mintStatus: userNFT?.mintStatus || null,
      tokenId: userNFT?.tokenId || null,
      transactionHash: userNFT?.mintTransactionHash || null,
      mintedAt: userNFT?.mintedAt?.toISOString() || null,
      queueStatus: queueItem?.status || null,
      error: queueItem?.errorMessage || userNFT?.mintError || null,
      retryCount: queueItem?.retryCount || 0,
    });
  } catch (error) {
    console.error("查询铸造状态错误:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
