// app/api/admin/banners/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// PUT /api/admin/banners/:id - 更新 banner
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ ok: false, message: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, subtitle, image, link, color, isActive } = body;

    // 检查 banner 是否存在
    const existingBanner = await prisma.heroBanner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return NextResponse.json(
        { ok: false, message: "Banner 不存在" },
        { status: 404 }
      );
    }

    // 更新 banner
    const updatedBanner = await prisma.heroBanner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(image !== undefined && { image }),
        ...(link !== undefined && { link }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ ok: true, data: updatedBanner });
  } catch (error) {
    console.error("[PUT /api/admin/banners/:id] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/:id - 删除 banner
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ ok: false, message: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await params;

    // 检查 banner 是否存在
    const existingBanner = await prisma.heroBanner.findUnique({
      where: { id }
    });

    if (!existingBanner) {
      return NextResponse.json(
        { ok: false, message: "Banner 不存在" },
        { status: 404 }
      );
    }

    // 删除 banner
    await prisma.heroBanner.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true, message: "删除成功" });
  } catch (error) {
    console.error("[DELETE /api/admin/banners/:id] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
