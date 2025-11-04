import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/nft/wallet/status
 * 查询用户钱包绑定状态
 */
export async function GET(req: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
        walletProvider: true,
        walletConnectedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      connected: !!user.walletAddress,
      walletAddress: user.walletAddress,
      walletType: user.walletProvider,
      connectedAt: user.walletConnectedAt,
    });
  } catch (error) {
    console.error("查询钱包状态错误:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
