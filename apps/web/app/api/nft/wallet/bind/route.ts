import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { ethers } from "ethers";

/**
 * POST /api/nft/wallet/bind
 * 绑定钱包地址
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户身份
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

    // 2. 获取请求数据
    const body = await req.json();
    const { walletAddress, signature, message, walletType } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 3. 验证签名
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json({ error: "签名验证失败" }, { status: 400 });
      }
    } catch (error) {
      console.error('签名验证错误:', error);
      return NextResponse.json({ error: "签名验证失败" }, { status: 400 });
    }

    // 检查钱包是否已被其他用户绑定
    const existingUser = await prisma.user.findFirst({
      where: {
        walletAddress: walletAddress.toLowerCase(),
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该钱包已被其他账户绑定" },
        { status: 400 }
      );
    }

    // 绑定钱包
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: walletAddress.toLowerCase(),
        walletConnectedAt: new Date(),
        walletProvider: walletType || "metamask",
      },
    });

    return NextResponse.json({
      success: true,
      message: "钱包绑定成功",
      walletAddress: walletAddress.toLowerCase(),
    });
  } catch (error) {
    console.error("钱包绑定错误:", error);
    return NextResponse.json({ error: "绑定失败，请重试" }, { status: 500 });
  }
}
