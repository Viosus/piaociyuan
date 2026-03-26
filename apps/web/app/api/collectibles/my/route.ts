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

// GET /api/collectibles/my - 用户已领取的收藏品
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { userId };
    if (category) {
      where.collectible = { category };
    }

    const [items, total] = await Promise.all([
      prisma.userCollectible.findMany({
        where,
        include: {
          collectible: {
            include: {
              event: { select: { id: true, name: true, cover: true } },
            },
          },
        },
        orderBy: { obtainedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userCollectible.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("获取我的收藏品失败:", error);
    return NextResponse.json(
      { ok: false, error: "获取我的收藏品失败" },
      { status: 500 }
    );
  }
}
