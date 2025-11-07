// app/api/banners/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/banners - 获取启用的 banner（公开接口）
export async function GET() {
  try {
    const banners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ ok: true, data: banners });
  } catch (error) {
    console.error("[GET /api/banners] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
