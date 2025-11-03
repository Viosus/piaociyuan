import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * POST /api/nft/mint/request
 * 请求将票转为NFT
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "票ID不能为空" }, { status: 400 });
    }

    // 1. 验证票
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId: userId,
      },
      include: {
        user: {
          select: {
            walletAddress: true,
          },
        },
        nft: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "票不存在" }, { status: 404 });
    }

    // 2. 检查票状态 - 必须已验票才能铸造NFT（防止买票→铸造→退票的漏洞）
    if (ticket.status !== 'used') {
      return NextResponse.json({ error: "请先验票后才能铸造NFT纪念品" }, { status: 400 });
    }

    // 3. 检查是否已绑定NFT
    if (!ticket.nftId) {
      return NextResponse.json({ error: "该票不支持NFT功能" }, { status: 400 });
    }

    if (ticket.nftMintStatus === "minted") {
      return NextResponse.json({ error: "NFT已经铸造" }, { status: 400 });
    }

    // 4. 检查用户是否绑定钱包
    const walletAddress = ticket.user?.walletAddress;
    if (!walletAddress) {
      return NextResponse.json({ error: "请先绑定钱包地址" }, { status: 400 });
    }

    // 5. 创建UserNFT记录
    const userNFT = await prisma.userNFT.create({
      data: {
        userId: userId,
        nftId: ticket.nftId,
        sourceType: 'ticket_purchase',
        sourceId: ticketId,
        contractAddress: ticket.nft!.contractAddress || "0x0000000000000000000000000000000000000000",
        tokenId: ticket.nft!.tokenIdStart || 0 + Math.floor(Math.random() * 10000),
        ownerWalletAddress: walletAddress,
        mintStatus: 'pending',
        metadataUri: ticket.nft!.metadataUriTemplate || `ipfs://placeholder/${ticketId}`,
      },
    });

    // 6. 添加到铸造队列
    const queueItem = await prisma.nFTMintQueue.create({
      data: {
        userNftId: userNFT.id,
        userId: userId,
        walletAddress: walletAddress,
        status: "pending",
      },
    });

    // 7. 更新票的NFT状态
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        nftMintStatus: "pending",
        nftUserNftId: userNFT.id,
      },
    });

    // 🚧 占位符：模拟异步铸造过程
    // 实际项目中，这里应该调用区块链智能合约进行铸造
    // 为了演示，我们在 5 秒后自动完成"铸造"
    setTimeout(async () => {
      try {
        const mockTxHash = `0x${Math.random().toString(16).slice(2).padEnd(64, "0")}`;

        // 更新UserNFT状态为已铸造
        await prisma.userNFT.update({
          where: { id: userNFT.id },
          data: {
            mintStatus: "minted",
            isOnChain: true,
            mintTransactionHash: mockTxHash,
            mintedAt: new Date(),
          },
        });

        // 更新票的NFT状态
        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            nftMintStatus: "minted",
          },
        });

        // 更新队列状态
        await prisma.nFTMintQueue.update({
          where: { id: queueItem.id },
          data: {
            status: "completed",
            processedAt: new Date(),
          },
        });

        // 更新NFT的mintedCount
        await prisma.nFT.update({
          where: { id: ticket.nftId! },
          data: {
            mintedCount: { increment: 1 },
          },
        });

        console.log(`✅ NFT 铸造完成（模拟）: Ticket ${ticketId}, UserNFT ${userNFT.id}`);
      } catch (error) {
        console.error("模拟NFT铸造失败:", error);

        // 更新为失败状态
        await prisma.userNFT.update({
          where: { id: userNFT.id },
          data: {
            mintStatus: "failed",
            mintError: String(error),
          },
        });

        await prisma.ticket.update({
          where: { id: ticketId },
          data: {
            nftMintStatus: "failed",
          },
        });
      }
    }, 5000); // 5秒后完成

    return NextResponse.json({
      success: true,
      message: "NFT铸造请求已提交，预计5秒完成（模拟）",
      userNftId: userNFT.id,
      queueId: queueItem.id,
      estimatedTime: "5秒（占位符）",
    });
  } catch (error) {
    console.error("NFT铸造请求错误:", error);
    return NextResponse.json(
      { error: "请求失败，请重试" },
      { status: 500 }
    );
  }
}
