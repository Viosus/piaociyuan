// app/api/events/search/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // 搜索活动：匹配名称、城市、场馆
    const events = await prisma.event.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            city: {
              contains: query,
            },
          },
          {
            venue: {
              contains: query,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        date: true,
        time: true,
        venue: true,
        cover: true,
        category: true,
        saleStatus: true,
        saleStartTime: true,
        saleEndTime: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // 最多返回10个结果
    });

    return NextResponse.json({
      ok: true,
      data: events,
    });
  } catch (error) {
    console.error("[SEARCH_EVENTS_ERROR]", error);
    return NextResponse.json(
      {
        ok: false,
        error: "搜索失败",
      },
      { status: 500 }
    );
  }
}
