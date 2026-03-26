import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/collectibles - 公开收藏品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;

    const [collectibles, total] = await Promise.all([
      prisma.collectible.findMany({
        where,
        include: {
          event: { select: { id: true, name: true, cover: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.collectible.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        collectibles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("获取收藏品列表失败:", error);
    return NextResponse.json(
      { ok: false, error: "获取收藏品列表失败" },
      { status: 500 }
    );
  }
}
