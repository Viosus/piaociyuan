// app/events/page.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSaleStatusInfo } from "@/lib/eventUtils";
import type { Event } from "@prisma/client";
import HeroBanner from "./ui/HeroBanner";
import SectionContainer from "./ui/SectionContainer";
import EventCard from "./ui/EventCard";

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic';

// 获取首页栏目数据
async function getHomepageSections() {
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
          .map((se: { event: Event }) => se.event)
          .filter((event: Event) => {
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

          events = autoEvents.filter((event: Event) => {
            const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);
            return saleInfo.saleStatus === 'not_started' || saleInfo.saleStatus === 'on_sale';
          });
        } catch {
          // 静默处理自动配置解析失败
        }
      } else if (section.type === 'auto_status' && section.autoConfig) {
        // 自动按状态栏目
        try {
          const config = JSON.parse(section.autoConfig);
          const { status, limit = 6 } = config;

          const autoEvents = await prisma.event.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' }
          });

          events = autoEvents.filter((event: Event) => {
            const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);
            return saleInfo.saleStatus === status;
          });
        } catch {
          // 静默处理自动配置解析失败
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
  return processedSections.filter(section => section.events.length > 0);
}

// 兜底：admin 没配 homepage_sections 时，直接拉所有 on_sale / not_started 活动
async function getFallbackEvents(): Promise<Event[]> {
  const all = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    take: 24,
  });
  return all.filter((event) => {
    const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);
    return saleInfo.saleStatus === 'not_started' || saleInfo.saleStatus === 'on_sale';
  });
}

export default async function EventsPage() {
  const sections = await getHomepageSections();
  // 没 sections 时拉 fallback
  const fallbackEvents = sections.length === 0 ? await getFallbackEvents() : [];

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-8">
        {/* Hero Banner */}
        <div className="mb-8">
          <HeroBanner />
        </div>

        {/* 动态渲染栏目 */}
        {sections.length > 0 ? (
          sections.map((section, sectionIndex) => (
            <SectionContainer
              key={section.id}
              title={section.title}
              subtitle={section.subtitle || undefined}
              icon={section.icon || undefined}
              moreLink={section.moreLink || undefined}
              bgGradient={section.bgGradient}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {section.events.map((event: Event, index: number) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    showRank={sectionIndex === 0 && index < 3}
                    rank={index + 1}
                    priority={sectionIndex === 0 && index < 3}
                  />
                ))}
              </div>
            </SectionContainer>
          ))
        ) : fallbackEvents.length > 0 ? (
          /* 没配 sections 但有可售活动：fallback 显示全部 */
          <SectionContainer
            title="全部可售活动"
            subtitle="管理员尚未配置首页栏目，先看看这些"
            icon="🎫"
            bgGradient="from-purple-50 to-pink-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {fallbackEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  priority={index < 3}
                />
              ))}
            </div>
          </SectionContainer>
        ) : (
          /* 真完全空 */
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🎫</div>
            <h2 className="text-2xl font-bold text-[#46467A] mb-4">暂无可售活动</h2>
            <p className="text-gray-500 mb-8">敬请期待更多精彩活动</p>
            <Link
              href="/signals"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              <span>浏览所有活动</span>
              <span>📡</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
