// app/api/admin/banners/order/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// PUT /api/admin/banners/order - 更新 banner 排序
export async function PUT(req: NextRequest) {
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
    const { bannerOrders } = body; // [{ id: "xxx", order: 0 }, ...]

    if (!Array.isArray(bannerOrders)) {
      return NextResponse.json(
        { ok: false, message: "参数格式错误" },
        { status: 400 }
      );
    }

    // 批量更新排序
    await Promise.all(
      bannerOrders.map(({ id, order }) =>
        prisma.heroBanner.update({
          where: { id },
          data: { order }
        })
      )
    );

    return NextResponse.json({ ok: true, message: "排序更新成功" });
  } catch (error) {
    console.error("[PUT /api/admin/banners/order] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
