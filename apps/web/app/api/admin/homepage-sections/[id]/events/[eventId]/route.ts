// app/api/admin/homepage-sections/[id]/events/[eventId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE - 从栏目移除活动
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
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

    const { id: sectionId, eventId } = await params;
    const eventIdInt = parseInt(eventId);

    // 检查关联是否存在
    const sectionEvent = await prisma.homepageSectionEvent.findUnique({
      where: {
        sectionId_eventId: {
          sectionId,
          eventId: eventIdInt
        }
      }
    });

    if (!sectionEvent) {
      return NextResponse.json(
        { ok: false, message: "活动不在栏目中" },
        { status: 404 }
      );
    }

    // 删除关联
    await prisma.homepageSectionEvent.delete({
      where: {
        sectionId_eventId: {
          sectionId,
          eventId: eventIdInt
        }
      }
    });

    return NextResponse.json({
      ok: true,
      message: "活动移除成功"
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTION_EVENT_DELETE] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
