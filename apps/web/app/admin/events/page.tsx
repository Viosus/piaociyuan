"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from '@/lib/api';
import { getEventStatus, EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, EVENT_CATEGORY_COLORS, EventCategory } from '@/lib/eventUtils';

type Event = {
  id: number;
  name: string;
  category: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  cover: string;
  artist: string;
  desc: string;
  createdAt: string;
  tiers: Array<{
    id: number;
    name: string;
    price: number;
    capacity: number;
    remaining: number;
  }>;
  _count: {
    posts: number;
    followers: number;
  };
};

type EventsResponse = {
  ok: boolean;
  data?: {
    events: Event[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function EventsManagement() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载活动列表
  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/admin/events?search=${search}&city=${cityFilter}&page=${page}&pageSize=20`
      ) as EventsResponse;
      if (res.ok && res.data) {
        setEvents(res.data.events);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        alert('加载失败');
      }
    } catch {
      // 静默处理加载活动列表失败
      alert('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    loadEvents();
  }, [search, cityFilter, page, router]);

  return (
    <div className="page-background">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">活动管理</h1>
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              返回管理后台
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="搜索活动（名称、艺人、场馆）"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 px-4 py-2 border rounded"
            />
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded"
            >
              <option value="all">所有城市</option>
              <option value="北京">北京</option>
              <option value="上海">上海</option>
              <option value="广州">广州</option>
              <option value="深圳">深圳</option>
              <option value="杭州">杭州</option>
              <option value="成都">成都</option>
            </select>
          </div>
        </div>

        {/* 活动列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无活动</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const statusInfo = getEventStatus(event.date, event.time);

              return (
                <div key={event.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex gap-6">
                    {/* 活动封面 */}
                    <div className="relative">
                      <img
                        src={event.cover}
                        alt={event.name}
                        className={`w-32 h-32 object-cover rounded ${
                          statusInfo.status === 'ended' ? 'grayscale opacity-70' : ''
                        }`}
                      />
                      {/* 状态标签 */}
                      <div className="absolute top-1 right-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            statusInfo.status === 'ended'
                              ? 'bg-gray-500 text-white'
                              : statusInfo.status === 'ongoing'
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* 活动信息 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">
                            {event.name}
                          </h3>
                          {/* 活动类型标签 */}
                          <div className="mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${EVENT_CATEGORY_COLORS[event.category as EventCategory]}`}>
                              <span>{EVENT_CATEGORY_ICONS[event.category as EventCategory]}</span>
                              <span>{EVENT_CATEGORY_LABELS[event.category as EventCategory]}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p>🎤 艺人：{event.artist}</p>
                        <p>📍 地点：{event.city} - {event.venue}</p>
                        <p>📅 时间：{event.date} {event.time}</p>
                        {statusInfo.status === 'ended' && (
                          <p className="text-red-600 font-medium">⚠️ 此活动已结束，无法购票</p>
                        )}
                        {statusInfo.status === 'ongoing' && (
                          <p className="text-green-600 font-medium">🎭 活动进行中</p>
                        )}
                      </div>

                      {/* 票档信息 */}
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">票档信息：</p>
                        <div className="flex gap-2 flex-wrap">
                          {event.tiers.map((tier) => (
                            <div
                              key={tier.id}
                              className="px-3 py-1 bg-gray-100 rounded text-xs"
                            >
                              {tier.name} - ¥{tier.price} ({tier.remaining}/{tier.capacity})
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 统计信息 */}
                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        <span>📝 {event._count.posts} 帖子</span>
                        <span>❤️ {event._count.followers} 关注</span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          查看活动页面
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 bg-white rounded shadow">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
