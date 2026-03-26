import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getAdminUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role?: string };
    if (decoded.role !== "admin") return null;
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET /api/admin/collectibles - 管理后台收藏品列表
export async function GET(request: NextRequest) {
  try {
    if (!getAdminUserId(request)) {
      return NextResponse.json({ ok: false, error: "需要管理员权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [collectibles, total] = await Promise.all([
      prisma.collectible.findMany({
        where,
        include: {
          event: { select: { id: true, name: true } },
          _count: { select: { userCollectibles: true } },
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
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("获取收藏品列表失败:", error);
    return NextResponse.json({ ok: false, error: "获取收藏品列表失败" }, { status: 500 });
  }
}

// POST /api/admin/collectibles - 创建收藏品
export async function POST(request: NextRequest) {
  try {
    if (!getAdminUserId(request)) {
      return NextResponse.json({ ok: false, error: "需要管理员权限" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, imageUrl, category, eventId, tierId, totalSupply, has3DModel, model3DUrl, modelFormat, hasAnimation, animationUrl, modelConfig } = body;

    if (!name || !description || !imageUrl || !category || !totalSupply) {
      return NextResponse.json({ ok: false, error: "缺少必填字段" }, { status: 400 });
    }

    const collectible = await prisma.collectible.create({
      data: {
        name,
        description,
        imageUrl,
        category,
        eventId: eventId ? parseInt(eventId) : null,
        tierId: tierId ? parseInt(tierId) : null,
        totalSupply: parseInt(totalSupply),
        has3DModel: has3DModel || false,
        model3DUrl,
        modelFormat,
        hasAnimation: hasAnimation || false,
        animationUrl,
        modelConfig,
      },
    });

    return NextResponse.json({ ok: true, data: collectible }, { status: 201 });
  } catch (error) {
    console.error("创建收藏品失败:", error);
    return NextResponse.json({ ok: false, error: "创建收藏品失败" }, { status: 500 });
  }
}
