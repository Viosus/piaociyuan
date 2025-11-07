// app/api/admin/homepage-sections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - 更新栏目
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { ok: false, message: "未授权" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { ok: false, message: "Token 无效" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "权限不足" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { title, subtitle, icon, bgGradient, moreLink, type, autoConfig, isActive, order } = body;

    // 检查栏目是否存在
    const existingSection = await prisma.homepageSection.findUnique({
      where: { id }
    });

    if (!existingSection) {
      return NextResponse.json(
        { ok: false, message: "栏目不存在" },
        { status: 404 }
      );
    }

    // 更新栏目
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle || null;
    if (icon !== undefined) updateData.icon = icon || null;
    if (bgGradient !== undefined) updateData.bgGradient = bgGradient;
    if (moreLink !== undefined) updateData.moreLink = moreLink || null;
    if (type !== undefined) updateData.type = type;
    if (autoConfig !== undefined) updateData.autoConfig = autoConfig ? JSON.stringify(autoConfig) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const section = await prisma.homepageSection.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      ok: true,
      data: section,
      message: "栏目更新成功"
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTION_PUT] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}

// DELETE - 删除栏目
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { ok: false, message: "未授权" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { ok: false, message: "Token 无效" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "权限不足" },
        { status: 403 }
      );
    }

    const { id } = params;

    // 检查栏目是否存在
    const existingSection = await prisma.homepageSection.findUnique({
      where: { id }
    });

    if (!existingSection) {
      return NextResponse.json(
        { ok: false, message: "栏目不存在" },
        { status: 404 }
      );
    }

    // 删除栏目（级联删除关联的活动）
    await prisma.homepageSection.delete({
      where: { id }
    });

    return NextResponse.json({
      ok: true,
      message: "栏目删除成功"
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTION_DELETE] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
