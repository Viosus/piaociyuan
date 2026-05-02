// app/signals/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getSaleStatusInfo, EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, EVENT_CATEGORY_COLORS, EventCategory, SALE_STATUS_LABELS, SALE_STATUS_COLORS, SaleStatus } from "@/lib/eventUtils";
import EmptyState from "@/components/EmptyState";

type Event = {
  id: number;
  name: string;
  category: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  saleStatus: string;
  saleStartTime: string;
  saleEndTime: string;
  coverImage: string;
  artist: string;
  status: string;
};

export default function SignalsPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();
        if (data.ok) {
          setAllEvents(data.data || []);
        }
      } catch {
        // 静默处理加载活动列表失败
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // 只显示未结束的活动
  const activeEvents = (allEvents || []).filter((event) => {
    return event.status !== 'ended';
  });

  // 根据选中的分类筛选活动
  const filteredEvents = selectedCategory === "all"
    ? activeEvents
    : activeEvents.filter((event) => event.category === selectedCategory);

  // 分类选项
  const categories: { value: string; label: string; icon: string }[] = [
    { value: "all", label: "全部", icon: "🎯" },
    { value: "concert", label: "演唱会", icon: "🎤" },
    { value: "festival", label: "音乐节", icon: "🎪" },
    { value: "exhibition", label: "展览", icon: "🎨" },
    { value: "musicale", label: "音乐会", icon: "🎻" },
    { value: "show", label: "演出", icon: "🎭" },
    { value: "sports", label: "体育赛事", icon: "⚽" },
    { value: "other", label: "其他", icon: "📅" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 pb-8">
      <div className="max-w-6xl mx-auto mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#46467A] via-[#E0DFFD] to-blue-400 bg-clip-text text-transparent mb-2">
            宇宙信号 📡
          </h1>
          <p className="text-gray-500 text-sm">探索所有进行中的精彩活动</p>
        </div>

        {/* 分类筛选器 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => {
            const count = category.value === 'all' ? activeEvents.length : activeEvents.filter(e => e.category === category.value).length;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.value
                    ? "bg-[#46467A] text-white shadow-md"
                    : "bg-white border border-[#FFEBF5] text-gray-700 hover:border-[#FFE3F0] hover:shadow"
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
                {category.value === "all" ? (
                  <span className="ml-2 text-xs opacity-75">({activeEvents.length})</span>
                ) : (
                  count > 0 && <span className="ml-2 text-xs opacity-75">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 当前筛选信息 */}
        <div className="text-sm text-gray-600 mb-4">
          {selectedCategory === "all" ? (
            <span>显示全部 {filteredEvents.length} 个活动</span>
          ) : (
            <span>
              显示 {EVENT_CATEGORY_LABELS[selectedCategory as EventCategory]} 分类的 {filteredEvents.length} 个活动
            </span>
          )}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="max-w-6xl mx-auto">
          <EmptyState
            icon="🎫"
            title={
              selectedCategory === "all"
                ? "暂无进行中的活动"
                : `暂无${EVENT_CATEGORY_LABELS[selectedCategory as EventCategory]}类活动`
            }
            description={
              selectedCategory === "all"
                ? "活动正在筹备中，刷新看看后续上线"
                : "试试切换其他分类看看"
            }
            action={
              selectedCategory !== "all"
                ? {
                    label: "查看全部活动",
                    onClick: () => setSelectedCategory("all"),
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredEvents.map((event, eventIndex) => {
            // 格式化日期时间
            const startDate = event.startTime ? new Date(event.startTime) : null;
            const dateStr = startDate ? startDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) : '';
            const timeStr = startDate ? startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <Link
                key={event.id}
                href={`/events/${encodeURIComponent(String(event.id))}`}
                className="bg-white border border-[#FFEBF5] rounded-xl hover:border-[#FFE3F0] hover:shadow-lg transition p-3 block group relative"
              >
                {/* 活动状态标签 */}
                {event.status && event.status !== 'on_sale' && (
                  <div className="absolute top-5 right-5 z-10">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      event.status === 'sold_out' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {event.status === 'upcoming' ? '即将开售' :
                       event.status === 'sold_out' ? '已售罄' :
                       event.status}
                    </span>
                  </div>
                )}

                <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={event.coverImage}
                    alt={event.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={eventIndex < 3}
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* 活动类型标签 */}
                <div className="mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${EVENT_CATEGORY_COLORS[event.category as EventCategory] || 'bg-gray-100 text-gray-700'}`}>
                    <span>{EVENT_CATEGORY_ICONS[event.category as EventCategory] || '📅'}</span>
                    <span>{EVENT_CATEGORY_LABELS[event.category as EventCategory] || event.category}</span>
                  </span>
                </div>

                <h2 className="text-lg font-bold item-name">{event.name}</h2>
                <p className="text-[#1a1a1f]">
                  {event.city || ''} {dateStr} {timeStr}
                </p>
                <p className="mt-2 text-sm text-[#1a1a1f] opacity-80">{event.venue}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
