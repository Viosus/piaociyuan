// app/api/admin/homepage-sections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - 获取所有栏目
export async function GET(req: NextRequest) {
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

    if (!payload || !payload.id) {
      return NextResponse.json(
        { ok: false, message: "Token 无效" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "权限不足" },
        { status: 403 }
      );
    }

    // 获取所有栏目（包括关联的活动）
    const sections = await prisma.homepageSection.findMany({
      orderBy: { order: 'asc' },
      include: {
        events: {
          orderBy: { order: 'asc' },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                cover: true,
                city: true,
                date: true,
                category: true,
                saleStatus: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      data: sections
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTIONS_GET] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}

// POST - 创建新栏目
export async function POST(req: NextRequest) {
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

    if (!payload || !payload.id) {
      return NextResponse.json(
        { ok: false, message: "Token 无效" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, message: "权限不足" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, subtitle, icon, bgGradient, moreLink, type, autoConfig, isActive } = body;

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "标题不能为空" },
        { status: 400 }
      );
    }

    // 获取当前最大的 order 值
    const maxOrder = await prisma.homepageSection.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const newOrder = (maxOrder?.order ?? -1) + 1;

    // 创建栏目
    const section = await prisma.homepageSection.create({
      data: {
        title,
        subtitle: subtitle || null,
        icon: icon || null,
        bgGradient: bgGradient || "from-purple-50 to-pink-50",
        moreLink: moreLink || null,
        order: newOrder,
        type: type || "manual",
        autoConfig: autoConfig ? JSON.stringify(autoConfig) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      ok: true,
      data: section,
      message: "栏目创建成功"
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTIONS_POST] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
