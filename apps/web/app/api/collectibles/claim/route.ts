import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// POST /api/collectibles/claim - 领取收藏品
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { collectibleId, sourceType = "ticket_purchase", sourceId } = body;

    if (!collectibleId) {
      return NextResponse.json(
        { ok: false, error: "缺少收藏品ID" },
        { status: 400 }
      );
    }

    // 检查收藏品是否存在且可用
    const collectible = await prisma.collectible.findUnique({
      where: { id: collectibleId },
    });

    if (!collectible || !collectible.isActive) {
      return NextResponse.json(
        { ok: false, error: "收藏品不存在或已下架" },
        { status: 404 }
      );
    }

    // 检查是否已领取
    const existing = await prisma.userCollectible.findFirst({
      where: { userId, collectibleId },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "您已领取过该收藏品" },
        { status: 409 }
      );
    }

    // 检查供应量
    if (collectible.claimedCount >= collectible.totalSupply) {
      return NextResponse.json(
        { ok: false, error: "收藏品已被领完" },
        { status: 410 }
      );
    }

    // 领取收藏品
    const [userCollectible] = await prisma.$transaction([
      prisma.userCollectible.create({
        data: {
          userId,
          collectibleId,
          sourceType,
          sourceId,
        },
        include: {
          collectible: true,
        },
      }),
      prisma.collectible.update({
        where: { id: collectibleId },
        data: { claimedCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { collectibleCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: userCollectible,
    });
  } catch (error) {
    console.error("领取收藏品失败:", error);
    return NextResponse.json(
      { ok: false, error: "领取收藏品失败" },
      { status: 500 }
    );
  }
}
