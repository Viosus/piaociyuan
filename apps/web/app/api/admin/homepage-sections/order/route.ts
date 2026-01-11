// app/api/admin/homepage-sections/order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - 批量更新栏目顺序
export async function PUT(req: NextRequest) {
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
    const { sectionOrders } = body; // [{ id: "uuid1", order: 0 }, { id: "uuid2", order: 1 }]

    if (!Array.isArray(sectionOrders)) {
      return NextResponse.json(
        { ok: false, message: "sectionOrders 必须是数组" },
        { status: 400 }
      );
    }

    // 批量更新顺序
    await prisma.$transaction(
      sectionOrders.map(({ id, order }) =>
        prisma.homepageSection.update({
          where: { id },
          data: { order }
        })
      )
    );

    return NextResponse.json({
      ok: true,
      message: "栏目顺序更新成功"
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTIONS_ORDER_PUT] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
