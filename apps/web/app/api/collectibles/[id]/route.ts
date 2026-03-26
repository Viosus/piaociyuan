import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/collectibles/[id] - 收藏品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const collectible = await prisma.collectible.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, name: true, cover: true, date: true, venue: true } },
        _count: { select: { userCollectibles: true } },
      },
    });

    if (!collectible) {
      return NextResponse.json(
        { ok: false, error: "收藏品不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...collectible,
        claimedCount: collectible._count.userCollectibles,
      },
    });
  } catch (error) {
    console.error("获取收藏品详情失败:", error);
    return NextResponse.json(
      { ok: false, error: "获取收藏品详情失败" },
      { status: 500 }
    );
  }
}
