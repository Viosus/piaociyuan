"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiDelete, apiPatch } from '@/lib/api';
import { getEventStatus, EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, EVENT_CATEGORY_COLORS, EventCategory, SALE_STATUS_LABELS, SaleStatus } from '@/lib/eventUtils';
import CreateEventDialog from './ui/CreateEventDialog';
import EditEventDialog from './ui/EditEventDialog';

type Tier = {
  id: number;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
  sold: number;
};

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
  saleStatus: string;
  saleStartTime: string;
  saleEndTime: string;
  createdAt: string;
  tiers: Tier[];
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

const SALE_STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'not_started', label: '未开售', color: 'bg-gray-500' },
  { value: 'on_sale', label: '售票中', color: 'bg-green-500' },
  { value: 'paused', label: '暂停售票', color: 'bg-yellow-500' },
  { value: 'sold_out', label: '已售罄', color: 'bg-red-500' },
  { value: 'ended', label: '已结束', color: 'bg-gray-700' },
];

export default function EventsManagement() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const [saleStatusMenuId, setSaleStatusMenuId] = useState<number | null>(null);

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

  const handleDelete = async (eventId: number, eventName: string) => {
    if (!confirm(`确定删除活动「${eventName}」？此操作不可撤销。`)) return;
    setProcessing(eventId);
    try {
      const res = await apiDelete(`/api/admin/events/${eventId}`);
      if (res.ok) {
        alert('活动已删除');
        loadEvents();
      } else {
        alert(`删除失败: ${res.message}`);
      }
    } catch {
      alert('删除失败');
    } finally {
      setProcessing(null);
    }
  };

  const handleSaleStatusChange = async (eventId: number, newStatus: string) => {
    setSaleStatusMenuId(null);
    setProcessing(eventId);
    try {
      const res = await apiPatch(`/api/admin/events/${eventId}/sale-status`, {
        saleStatus: newStatus,
      });
      if (res.ok) {
        setEvents(events.map(e =>
          e.id === eventId ? { ...e, saleStatus: newStatus } : e
        ));
      } else {
        alert(`操作失败: ${res.message}`);
      }
    } catch {
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  const getSaleStatusBadge = (status: string) => {
    const opt = SALE_STATUS_OPTIONS.find(o => o.value === status);
    return opt || { value: status, label: status, color: 'bg-gray-400' };
  };

  return (
    <div className="page-background">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">活动管理</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                + 新建活动
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                返回管理后台
              </button>
            </div>
          </div>
        </div>
      </header>

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
            <p className="text-gray-500 mb-4">暂无活动</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
            >
              创建第一个活动
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const statusInfo = getEventStatus(event.date, event.time);
              const saleBadge = getSaleStatusBadge(event.saleStatus);

              return (
                <div key={event.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex gap-6">
                    {/* 封面 */}
                    <div className="relative">
                      <img
                        src={event.cover}
                        alt={event.name}
                        className={`w-32 h-32 object-cover rounded ${
                          statusInfo.status === 'ended' ? 'grayscale opacity-70' : ''
                        }`}
                      />
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

                    {/* 信息 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${EVENT_CATEGORY_COLORS[event.category as EventCategory]}`}>
                              <span>{EVENT_CATEGORY_ICONS[event.category as EventCategory]}</span>
                              <span>{EVENT_CATEGORY_LABELS[event.category as EventCategory]}</span>
                            </span>
                            {/* 售票状态 */}
                            <div className="relative">
                              <button
                                onClick={() => setSaleStatusMenuId(saleStatusMenuId === event.id ? null : event.id)}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full text-white ${saleBadge.color} cursor-pointer hover:opacity-80`}
                                disabled={processing === event.id}
                              >
                                {saleBadge.label}
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {saleStatusMenuId === event.id && (
                                <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                                  {SALE_STATUS_OPTIONS.map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => handleSaleStatusChange(event.id, opt.value)}
                                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                                        event.saleStatus === opt.value ? 'font-bold text-purple-600' : 'text-gray-700'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p>艺人：{event.artist}</p>
                        <p>地点：{event.city} - {event.venue}</p>
                        <p>时间：{event.date} {event.time}</p>
                      </div>

                      {/* 票档 */}
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">票档信息：</p>
                        <div className="flex gap-2 flex-wrap">
                          {event.tiers.map((tier) => (
                            <div key={tier.id} className="px-3 py-1 bg-gray-100 rounded text-xs">
                              {tier.name} - ¥{tier.price} ({tier.remaining}/{tier.capacity})
                            </div>
                          ))}
                          {event.tiers.length === 0 && (
                            <span className="text-xs text-gray-400">暂无票档</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        <span>{event._count.posts} 帖子</span>
                        <span>{event._count.followers} 关注</span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          查看页面
                        </button>
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(event.id, event.name)}
                          disabled={processing === event.id}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
                        >
                          删除
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

      {/* 弹窗 */}
      {showCreateDialog && (
        <CreateEventDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadEvents();
          }}
        />
      )}

      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}
