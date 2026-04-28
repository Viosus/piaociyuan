"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from '@/lib/api';

type User = {
  id: string;
  nickname?: string;
  role: string;
};

type Stats = {
  overview: {
    totalUsers: number;
    totalEvents: number;
    totalOrders: number;
    totalRevenue: number;
    activeEvents: number;
  };
  ordersByStatus: Record<string, number>;
  topEvents: Array<{
    eventId: number;
    eventName: string;
    totalOrders: number;
    totalRevenue: number;
    ticketsSold: number;
  }>;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    apiGet('/api/user/me')
      .then((res) => {
        if (res.ok && res.data) {
          if (res.data.role !== 'admin') {
            alert('需要管理员权限');
            router.push('/');
            return;
          }
          setUser(res.data);
        } else {
          router.push("/auth/login");
        }
      })
      .catch(() => {
        router.push("/auth/login");
      })
      .finally(() => {
        setLoading(false);
      });

    // 加载统计数据
    apiGet('/api/admin/stats')
      .then((res) => {
        if (res.ok && res.data) {
          setStats(res.data);
        }
      })
      .catch(() => {
        // 静默处理
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="page-background">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                欢迎，{user.nickname || '管理员'}
              </span>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 数据统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm text-gray-500">总用户数</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{stats.overview.totalUsers}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm text-gray-500">总活动数</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {stats.overview.totalEvents}
                <span className="text-sm font-normal text-green-600 ml-2">
                  {stats.overview.activeEvents} 售票中
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm text-gray-500">总订单数</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{stats.overview.totalOrders}</div>
              <div className="text-xs text-gray-400 mt-1">
                已支付 {stats.ordersByStatus.PAID || 0} | 待支付 {stats.ordersByStatus.PENDING || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-sm text-gray-500">总收入</div>
              <div className="text-3xl font-bold text-purple-600 mt-1">
                ¥{stats.overview.totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* 热门活动 */}
        {stats && stats.topEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">热门活动 TOP 5</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500 border-b">
                  <tr>
                    <th className="text-left pb-2 font-medium">活动名称</th>
                    <th className="text-right pb-2 font-medium">订单数</th>
                    <th className="text-right pb-2 font-medium">售出票数</th>
                    <th className="text-right pb-2 font-medium">收入</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.topEvents.map((event, index) => (
                    <tr key={event.eventId} className="hover:bg-gray-50">
                      <td className="py-2">
                        <span className="text-gray-400 mr-2">{index + 1}.</span>
                        {event.eventName}
                      </td>
                      <td className="py-2 text-right">{event.totalOrders}</td>
                      <td className="py-2 text-right">{event.ticketsSold}</td>
                      <td className="py-2 text-right font-medium text-purple-600">¥{event.totalRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 功能模块卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 活动管理 */}
          <div
            onClick={() => router.push('/admin/events')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">活动管理</h3>
                <p className="text-sm text-gray-600">创建、编辑、上架演出活动</p>
              </div>
            </div>
          </div>

          {/* 订单管理 */}
          <div
            onClick={() => router.push('/admin/orders')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">订单管理</h3>
                <p className="text-sm text-gray-600">查看订单、处理退款</p>
              </div>
            </div>
          </div>

          {/* 用户管理 */}
          <div
            onClick={() => router.push('/admin/users')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">用户管理</h3>
                <p className="text-sm text-gray-600">管理用户账户、封禁</p>
              </div>
            </div>
          </div>

          {/* 举报管理 */}
          <div
            onClick={() => router.push('/admin/reports')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">举报管理</h3>
                <p className="text-sm text-gray-600">查看和处理用户举报</p>
              </div>
            </div>
          </div>

          {/* 认证审核 */}
          <div
            onClick={() => router.push('/admin/verifications')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">认证审核</h3>
                <p className="text-sm text-gray-600">审核用户身份认证申请</p>
              </div>
            </div>
          </div>

          {/* 帖子管理 */}
          <div
            onClick={() => router.push('/admin/posts')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">帖子管理</h3>
                <p className="text-sm text-gray-600">管理社区帖子</p>
              </div>
            </div>
          </div>

          {/* 首页栏目管理 */}
          <div
            onClick={() => router.push('/admin/homepage-sections')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">首页栏目管理</h3>
                <p className="text-sm text-gray-600">管理首页展示栏目</p>
              </div>
            </div>
          </div>

          {/* 轮播广告栏管理 */}
          <div
            onClick={() => router.push('/admin/banners')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">轮播广告栏管理</h3>
                <p className="text-sm text-gray-600">管理首页轮播广告</p>
              </div>
            </div>
          </div>

          {/* 收藏品管理 */}
          <div
            onClick={() => router.push('/admin/collectibles')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">收藏品管理</h3>
                <p className="text-sm text-gray-600">管理数字收藏品</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
