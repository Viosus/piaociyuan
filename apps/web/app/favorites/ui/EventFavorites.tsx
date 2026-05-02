"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiGet, apiDelete } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface Tier {
  id: number;
  name: string;
  price: number;
  capacity: number;
}

interface Event {
  id: number;
  name: string;
  artist: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  cover: string;
  status: "upcoming" | "onsale" | "ended";
  saleStartTime: string | null;
  totalCapacity: number;
  availableCapacity: number;
  soldTickets: number;
  soldPercentage: number;
  lowestPrice: number;
  tiers: Tier[];
}

interface FollowedEvent {
  followId: string;
  followedAt: string;
  event: Event;
}

interface Stats {
  total: number;
  upcoming: number;
  onsale: number;
  ended: number;
}

export default function EventFavorites() {
  const toast = useToast();
  const [followedEvents, setFollowedEvents] = useState<FollowedEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "onsale" | "ended">("all");

  // 加载关注的活动
  useEffect(() => {
    const loadFollowedEvents = async () => {
      setLoading(true);

      try {
        const url = filter === "all" ? "/api/user/follows" : `/api/user/follows?status=${filter}`;

        const result = await apiGet(url);

        if (result.ok) {
          setFollowedEvents(result.data);
          setStats(result.stats);
        }
      } catch {
        // 静默处理加载关注活动失败
      } finally {
        setLoading(false);
      }
    };

    loadFollowedEvents();
  }, [filter]);

  // 取消关注活动
  const handleUnfollow = async (eventId: number, eventName: string) => {
    if (!confirm(`确定要取消关注「${eventName}」吗？`)) {
      return;
    }

    try {
      const result = await apiDelete(`/api/events/${eventId}/follow`);

      if (result.ok) {
        // 从列表中移除
        setFollowedEvents((prev) => prev.filter((item) => item.event.id !== eventId));
        toast.success("已取消关注");
      } else {
        toast.error(result.message || "取消关注失败");
      }
    } catch {
      toast.error("网络错误，请稍后重试");
    }
  };

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming":
        return { text: "即将开售", color: "bg-blue-100 text-blue-600" };
      case "onsale":
        return { text: "热卖中", color: "bg-green-100 text-green-600" };
      case "ended":
        return { text: "已结束", color: "bg-gray-100 text-gray-600" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-600" };
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {/* 统计信息 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
            <div className="text-2xl font-bold text-purple-500">{stats.total}</div>
            <div className="text-sm text-gray-600">全部关注</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
            <div className="text-2xl font-bold text-blue-500">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">即将开售</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
            <div className="text-2xl font-bold text-green-500">{stats.onsale}</div>
            <div className="text-sm text-gray-600">热卖中</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
            <div className="text-2xl font-bold text-gray-500">{stats.ended}</div>
            <div className="text-sm text-gray-600">已结束</div>
          </div>
        </div>
      )}

      {/* 筛选按钮 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
            filter === "all"
              ? "bg-purple-500 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:border-purple-500"
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
            filter === "upcoming"
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:border-blue-500"
          }`}
        >
          即将开售
        </button>
        <button
          onClick={() => setFilter("onsale")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
            filter === "onsale"
              ? "bg-green-500 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:border-green-500"
          }`}
        >
          热卖中
        </button>
        <button
          onClick={() => setFilter("ended")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
            filter === "ended"
              ? "bg-gray-700 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:border-gray-700"
          }`}
        >
          已结束
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      )}

      {/* 活动列表 */}
      {!loading && followedEvents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-[#FFEBF5]">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600 mb-4">
            {filter === "all"
              ? "你还没有关注任何活动"
              : `没有找到${getStatusLabel(filter).text}的活动`}
          </p>
          <Link
            href="/events"
            className="inline-block px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition"
          >
            去看看活动
          </Link>
        </div>
      )}

      {!loading && followedEvents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {followedEvents.map((item) => {
            const statusLabel = getStatusLabel(item.event.status);
            return (
              <div
                key={item.followId}
                className="bg-white rounded-lg border border-[#FFEBF5] overflow-hidden hover:border-[#FFE3F0] hover:shadow-lg transition"
              >
                {/* 活动封面 */}
                <Link href={`/events/${item.event.id}`}>
                  <div className="relative w-full h-48">
                    <Image
                      src={item.event.cover}
                      alt={item.event.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabel.color}`}>
                        {statusLabel.text}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 活动信息 */}
                <div className="p-4">
                  <Link href={`/events/${item.event.id}`}>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 hover:opacity-80 transition">
                      {item.event.name}
                    </h3>
                  </Link>

                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div>📍 {item.event.city} · {item.event.venue}</div>
                    <div>📅 {formatDate(item.event.date)} {item.event.time}</div>
                    <div>💰 ¥{item.event.lowestPrice} 起</div>
                    <div>
                      🎫 已售 {item.event.soldPercentage}% ({item.event.soldTickets}/{item.event.totalCapacity})
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {item.event.status === "onsale" && (
                      <Link
                        href={`/events/${item.event.id}`}
                        className="flex-1 text-center px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition"
                      >
                        立即购票
                      </Link>
                    )}
                    {item.event.status === "upcoming" && (
                      <div className="flex-1 text-center px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm">
                        {item.event.saleStartTime
                          ? `${new Date(item.event.saleStartTime).toLocaleString("zh-CN")} 开售`
                          : "即将开售"}
                      </div>
                    )}
                    {item.event.status === "ended" && (
                      <div className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
                        活动已结束
                      </div>
                    )}
                    <button
                      onClick={() => handleUnfollow(item.event.id, item.event.name)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:border-red-500 hover:text-red-500 transition"
                    >
                      取消关注
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    关注时间：{formatDate(item.followedAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
