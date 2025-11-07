// app/api/admin/banners/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET /api/admin/banners - 获取所有 banner
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ ok: false, message: "需要管理员权限" }, { status: 403 });
    }

    const banners = await prisma.heroBanner.findMany({
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ ok: true, data: banners });
  } catch (error) {
    console.error("[GET /api/admin/banners] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - 创建新 banner
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ ok: false, message: "需要管理员权限" }, { status: 403 });
    }

    const body = await req.json();
    const { title, subtitle, image, link, color } = body;

    if (!title || !subtitle || !image || !link) {
      return NextResponse.json(
        { ok: false, message: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    // 获取当前最大 order
    const maxOrderBanner = await prisma.heroBanner.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const nextOrder = (maxOrderBanner?.order ?? -1) + 1;

    // 创建 banner
    const banner = await prisma.heroBanner.create({
      data: {
        title,
        subtitle,
        image,
        link,
        color: color || "from-purple-600/80 to-pink-600/80",
        order: nextOrder,
        isActive: true
      }
    });

    return NextResponse.json({ ok: true, data: banner });
  } catch (error) {
    console.error("[POST /api/admin/banners] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
