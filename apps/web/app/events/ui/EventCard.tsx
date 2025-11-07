import Link from "next/link";
import { getSaleStatusInfo, EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, EVENT_CATEGORY_COLORS, EventCategory } from "@/lib/eventUtils";

interface EventCardProps {
  event: {
    id: number;
    name: string;
    city: string;
    date: string;
    time: string;
    venue: string;
    cover: string;
    category: string;
    saleStatus: string;
    saleStartTime: Date | string;
    saleEndTime: Date | string;
  };
  showRank?: boolean;
  rank?: number;
}

export default function EventCard({ event, showRank, rank }: EventCardProps) {
  const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);

  return (
    <Link
      href={`/events/${event.id}`}
      className="bg-white rounded-xl hover:shadow-xl transition-all block group relative overflow-hidden border border-gray-100"
    >
      {/* 推荐排名徽章 */}
      {showRank && rank !== undefined && rank <= 3 && (
        <div className="absolute top-3 left-3 z-10">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg ${
              rank === 1
                ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                : rank === 2
                ? "bg-gradient-to-br from-gray-300 to-gray-400"
                : "bg-gradient-to-br from-orange-400 to-orange-600"
            }`}
          >
            {rank}
          </div>
        </div>
      )}

      {/* 售票状态标签 */}
      {saleInfo.saleStatus !== "on_sale" && (
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${saleInfo.color}`}>
            {saleInfo.label}
          </span>
        </div>
      )}

      {/* 封面图片 */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.cover}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* 活动信息 */}
      <div className="p-4">
        {/* 活动类型标签 */}
        <div className="mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
              EVENT_CATEGORY_COLORS[event.category as EventCategory]
            }`}
          >
            <span>{EVENT_CATEGORY_ICONS[event.category as EventCategory]}</span>
            <span>{EVENT_CATEGORY_LABELS[event.category as EventCategory]}</span>
          </span>
        </div>

        {/* 活动名称 */}
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {event.name}
        </h3>

        {/* 活动详情 */}
        <div className="space-y-1 text-sm text-gray-600">
          <p className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.city}</span>
          </p>
          <p className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{event.date} {event.time}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
