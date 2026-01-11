// app/api/admin/homepage-sections/[id]/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - 添加活动到栏目
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: sectionId } = await params;
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { ok: false, message: "活动ID不能为空" },
        { status: 400 }
      );
    }

    // 检查栏目是否存在
    const section = await prisma.homepageSection.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      return NextResponse.json(
        { ok: false, message: "栏目不存在" },
        { status: 404 }
      );
    }

    // 检查活动是否存在
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { ok: false, message: "活动不存在" },
        { status: 404 }
      );
    }

    // 检查活动是否已经在栏目中
    const existing = await prisma.homepageSectionEvent.findUnique({
      where: {
        sectionId_eventId: {
          sectionId,
          eventId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "活动已在栏目中" },
        { status: 400 }
      );
    }

    // 获取当前栏目中最大的 order 值
    const maxOrder = await prisma.homepageSectionEvent.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const newOrder = (maxOrder?.order ?? -1) + 1;

    // 添加活动到栏目
    const sectionEvent = await prisma.homepageSectionEvent.create({
      data: {
        sectionId,
        eventId,
        order: newOrder
      },
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
    });

    return NextResponse.json({
      ok: true,
      data: sectionEvent,
      message: "活动添加成功"
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTION_EVENT_POST] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}

// PUT - 批量更新活动顺序
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: sectionId } = await params;
    const body = await req.json();
    const { eventOrders } = body; // [{ eventId: 1, order: 0 }, { eventId: 2, order: 1 }]

    if (!Array.isArray(eventOrders)) {
      return NextResponse.json(
        { ok: false, message: "eventOrders 必须是数组" },
        { status: 400 }
      );
    }

    // 批量更新顺序
    await prisma.$transaction(
      eventOrders.map(({ eventId, order }) =>
        prisma.homepageSectionEvent.updateMany({
          where: {
            sectionId,
            eventId
          },
          data: { order }
        })
      )
    );

    return NextResponse.json({
      ok: true,
      message: "活动顺序更新成功"
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTION_EVENT_PUT] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
