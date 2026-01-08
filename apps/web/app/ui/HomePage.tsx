// app/ui/HomePage.tsx
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getSaleStatusInfo } from '@/lib/eventUtils';
import EventCard from '@/app/events/ui/EventCard';
import { HeroBanners } from './HeroBanners';

export default async function HomePage() {
  // 获取所有启用的栏目
  const sections = await prisma.homepageSection.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      events: {
        orderBy: { order: 'asc' },
        include: {
          event: {
            include: {
              tiers: true,
            },
          },
        },
      },
    },
  });

  // 处理自动栏目和手动栏目
  const processedSections = await Promise.all(
    sections.map(async (section) => {
      let events = [];

      if (section.type === 'manual') {
        // 手动栏目：使用配置的活动
        events = section.events
          .map((se) => se.event)
          .filter((event) => {
            // 只显示可售票的活动
            const saleInfo = getSaleStatusInfo(
              event.saleStatus,
              event.saleStartTime,
              event.saleEndTime
            );
            return (
              saleInfo.saleStatus === 'not_started' ||
              saleInfo.saleStatus === 'on_sale'
            );
          });
      } else if (section.type === 'auto_category' && section.autoConfig) {
        // 自动按分类栏目
        try {
          const config = JSON.parse(section.autoConfig);
          const { category, limit = 6 } = config;

          const autoEvents = await prisma.event.findMany({
            where: { category },
            take: limit,
            orderBy: { date: 'asc' },
            include: {
              tiers: true,
            },
          });

          events = autoEvents.filter((event) => {
            const saleInfo = getSaleStatusInfo(
              event.saleStatus,
              event.saleStartTime,
              event.saleEndTime
            );
            return (
              saleInfo.saleStatus === 'not_started' ||
              saleInfo.saleStatus === 'on_sale'
            );
          });
        } catch (error) {
          console.error('[HOMEPAGE] Auto config parse error:', error);
        }
      } else if (section.type === 'auto_status' && section.autoConfig) {
        // 自动按状态栏目（如即将开售）
        try {
          const config = JSON.parse(section.autoConfig);
          const { limit = 6 } = config;

          const autoEvents = await prisma.event.findMany({
            take: limit,
            orderBy: { date: 'asc' },
            include: {
              tiers: true,
            },
          });

          events = autoEvents.filter((event) => {
            const saleInfo = getSaleStatusInfo(
              event.saleStatus,
              event.saleStartTime,
              event.saleEndTime
            );
            return (
              saleInfo.saleStatus === 'not_started' ||
              saleInfo.saleStatus === 'on_sale'
            );
          });
        } catch (error) {
          console.error('[HOMEPAGE] Auto config parse error:', error);
        }
      }

      return {
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        icon: section.icon,
        bgGradient: section.bgGradient,
        moreLink: section.moreLink,
        events: events,
      };
    })
  );

  // 过滤掉没有活动的栏目
  const filteredSections = processedSections.filter(
    (section) => section.events.length > 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banners */}
      <HeroBanners />

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 首页栏目 */}
        {filteredSections.map((section) => (
          <section key={section.id} className="mb-12">
            {/* 栏目标题 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {section.icon && <span className="text-3xl">{section.icon}</span>}
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-gray-600 mt-1">{section.subtitle}</p>
                )}
              </div>
              {section.moreLink && (
                <Link
                  href={section.moreLink}
                  className="text-sm font-medium text-[#EAF353] hover:text-[#d4db4a] flex items-center gap-1"
                >
                  查看更多
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>

            {/* 活动卡片网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.events.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ))}

        {/* 空状态 */}
        {filteredSections.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无推荐内容
            </h3>
            <p className="text-gray-600 mb-6">敬请期待精彩活动</p>
            <Link
              href="/events"
              className="inline-block px-6 py-3 bg-[#EAF353] text-gray-900 font-medium rounded-lg hover:bg-[#d4db4a] transition-colors"
            >
              浏览所有活动
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
