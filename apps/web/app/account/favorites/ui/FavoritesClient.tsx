'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete } from '@/lib/api';

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
  status: 'upcoming' | 'onsale' | 'ended';
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

export default function FavoritesClient() {
  const router = useRouter();
  const [followedEvents, setFollowedEvents] = useState<FollowedEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'onsale' | 'ended'>('all');

  // 加载关注的活动
  useEffect(() => {
    const loadFollowedEvents = async () => {
      setLoading(true);

      try {
        const url = filter === 'all'
          ? '/api/user/follows'
          : `/api/user/follows?status=${filter}`;

        const result = await apiGet(url);

        if (result.ok) {
          setFollowedEvents(result.data);
          setStats(result.stats);
        } else {
          console.error('[LOAD_FOLLOWS_ERROR]', result.message);
        }
      } catch (error) {
        console.error('[LOAD_FOLLOWS_ERROR]', error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowedEvents();
  }, [filter, router]);

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
        alert('✅ 已取消关注');
      } else {
        alert(`❌ ${result.message || '取消关注失败'}`);
      }
    } catch (error) {
      console.error('[UNFOLLOW_ERROR]', error);
      alert('❌ 网络错误，请稍后重试');
    }
  };

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { text: '即将开售', color: 'bg-blue-100 text-blue-600' };
      case 'onsale':
        return { text: '热卖中', color: 'bg-green-100 text-green-600' };
      case 'ended':
        return { text: '已结束', color: 'bg-gray-100 text-[#282828]' };
      default:
        return { text: status, color: 'bg-gray-100 text-[#282828]' };
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#C72471] p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent">
            ⭐ 我关注的活动
          </h1>
          <p className="text-white/60">
            随时关注你喜欢的活动，第一时间获得开售通知
          </p>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
              <div className="text-2xl font-bold text-[#EAF353]">{stats.total}</div>
              <div className="text-sm text-[#282828]">全部关注</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
              <div className="text-2xl font-bold text-blue-500">{stats.upcoming}</div>
              <div className="text-sm text-[#282828]">即将开售</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
              <div className="text-2xl font-bold text-green-500">{stats.onsale}</div>
              <div className="text-sm text-[#282828]">热卖中</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#FFEBF5]">
              <div className="text-2xl font-bold text-[#282828]">{stats.ended}</div>
              <div className="text-sm text-[#282828]">已结束</div>
            </div>
          </div>
        )}

        {/* 筛选按钮 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              filter === 'all'
                ? 'bg-[#EAF353] text-white shadow-md'
                : 'bg-white border border-gray-200 text-[#282828] hover:border-[#EAF353]'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              filter === 'upcoming'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white border border-gray-200 text-[#282828] hover:border-blue-500'
            }`}
          >
            即将开售
          </button>
          <button
            onClick={() => setFilter('onsale')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              filter === 'onsale'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-white border border-gray-200 text-[#282828] hover:border-green-500'
            }`}
          >
            热卖中
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              filter === 'ended'
                ? 'bg-gray-700 text-white shadow-md'
                : 'bg-white border border-gray-200 text-[#282828] hover:border-gray-700'
            }`}
          >
            已结束
          </button>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EAF353]"></div>
            <p className="mt-4 text-white/60">加载中...</p>
          </div>
        )}

        {/* 活动列表 */}
        {!loading && followedEvents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-[#FFEBF5]">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-[#282828] mb-4">
              {filter === 'all'
                ? '你还没有关注任何活动'
                : `没有找到${getStatusLabel(filter).text}的活动`}
            </p>
            <Link
              href="/events"
              className="inline-block px-6 py-2 bg-[#EAF353] text-white rounded-full hover:bg-[#FFC9E0] transition"
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
                    <div className="relative">
                      <img
                        src={item.event.cover}
                        alt={item.event.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabel.color}`}
                        >
                          {statusLabel.text}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* 活动信息 */}
                  <div className="p-4">
                    <Link href={`/events/${item.event.id}`}>
                      <h3 className="text-lg font-bold mb-2 item-name hover:opacity-80 transition">
                        {item.event.name}
                      </h3>
                    </Link>

                    <div className="space-y-1 text-sm text-[#282828] mb-3">
                      <div>📍 {item.event.city} · {item.event.venue}</div>
                      <div>📅 {formatDate(item.event.date)} {item.event.time}</div>
                      <div>💰 ¥{item.event.lowestPrice} 起</div>
                      <div>
                        🎫 已售 {item.event.soldPercentage}% ({item.event.soldTickets}/{item.event.totalCapacity})
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      {item.event.status === 'onsale' && (
                        <Link
                          href={`/events/${item.event.id}`}
                          className="flex-1 text-center px-4 py-2 bg-[#EAF353] text-white rounded-full hover:bg-[#FFC9E0] transition"
                        >
                          立即购票
                        </Link>
                      )}
                      {item.event.status === 'upcoming' && (
                        <div className="flex-1 text-center px-4 py-2 bg-blue-100 text-blue-600 rounded-full">
                          {item.event.saleStartTime
                            ? `${new Date(item.event.saleStartTime).toLocaleString('zh-CN')} 开售`
                            : '即将开售'}
                        </div>
                      )}
                      {item.event.status === 'ended' && (
                        <div className="flex-1 text-center px-4 py-2 bg-gray-100 text-[#282828] rounded-full">
                          活动已结束
                        </div>
                      )}
                      <button
                        onClick={() => handleUnfollow(item.event.id, item.event.name)}
                        className="px-4 py-2 border border-gray-300 text-[#282828] rounded-full hover:border-red-500 hover:text-red-500 transition"
                      >
                        取消关注
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-[#282828] opacity-60">
                      关注时间：{formatDate(item.followedAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
