// app/api/homepage-sections/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSaleStatusInfo } from "@/lib/eventUtils";
import type { Event } from "@prisma/client";

// GET - 获取前端展示的栏目（公开API，无需认证）
export async function GET(req: NextRequest) {
  try {
    // 获取所有启用的栏目
    const sections = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        events: {
          orderBy: { order: 'asc' },
          include: {
            event: true
          }
        }
      }
    });

    // 处理自动栏目和手动栏目
    const processedSections = await Promise.all(
      sections.map(async (section) => {
        let events: Event[] = [];

        if (section.type === 'manual') {
          // 手动栏目：使用配置的活动
          events = section.events
            .map(se => se.event)
            .filter(event => {
              // 只显示可售票的活动
              const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);
              return saleInfo.saleStatus === 'not_started' || saleInfo.saleStatus === 'on_sale';
            });
        } else if (section.type === 'auto_category' && section.autoConfig) {
          // 自动按分类栏目
          try {
            const config = JSON.parse(section.autoConfig);
            const { category, limit = 6 } = config;

            const autoEvents = await prisma.event.findMany({
              where: { category },
              take: limit,
              orderBy: { createdAt: 'desc' }
            });

            events = autoEvents.filter(event => {
              const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);
              return saleInfo.saleStatus === 'not_started' || saleInfo.saleStatus === 'on_sale';
            });
          } catch (error) {
            console.error('[HOMEPAGE_SECTIONS] Auto config parse error:', error);
          }
        } else if (section.type === 'auto_status' && section.autoConfig) {
          // 自动按状态栏目（如即将开售）
          try {
            const config = JSON.parse(section.autoConfig);
            const { status, limit = 6 } = config;

            const autoEvents = await prisma.event.findMany({
              take: limit,
              orderBy: { createdAt: 'desc' }
            });

            events = autoEvents.filter(event => {
              const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);
              return saleInfo.saleStatus === status;
            });
          } catch (error) {
            console.error('[HOMEPAGE_SECTIONS] Auto config parse error:', error);
          }
        }

        return {
          id: section.id,
          title: section.title,
          subtitle: section.subtitle,
          icon: section.icon,
          bgGradient: section.bgGradient,
          moreLink: section.moreLink,
          events: events
        };
      })
    );

    // 过滤掉没有活动的栏目
    const filteredSections = processedSections.filter(section => section.events.length > 0);

    return NextResponse.json({
      ok: true,
      data: filteredSections
    });

  } catch (error) {
    console.error("[HOMEPAGE_SECTIONS_GET] Error:", error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
