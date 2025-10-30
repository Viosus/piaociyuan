"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Badge = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  type: "badge" | "ticket_stub" | "poster" | "certificate";
  has3DModel: boolean;
  model3DUrl: string | null;
  modelFormat: string | null;
  hasAR: boolean;
  arUrl: string | null;
  hasAnimation: boolean;
  animationUrl: string | null;
  modelConfig: any;
  event: {
    id: number;
    name: string;
    city: string;
    venue: string;
    date: string;
    time: string;
    cover: string;
  };
};

type CollectionItem = {
  id: string;
  badge: Badge;
  ticket: {
    id: string;
    ticketCode: string;
    status: string;
  } | null;
  order: {
    id: string;
    status: string;
    createdAt: number;
  } | null;
  obtainedAt: string;
  metadata: any;
};

type Stats = {
  total: number;
  byRarity: {
    legendary: number;
    epic: number;
    rare: number;
    common: number;
  };
  byType: {
    badge: number;
    ticket_stub: number;
    poster: number;
    certificate: number;
  };
  has3D: number;
  hasAR: number;
};

const RARITY_CONFIG = {
  legendary: {
    name: "传说",
    emoji: "🟡",
    color: "from-yellow-400 to-orange-500",
    bg: "bg-gradient-to-br from-yellow-50 to-orange-50",
    border: "border-yellow-400",
    text: "text-yellow-700",
  },
  epic: {
    name: "史诗",
    emoji: "🟣",
    color: "from-purple-400 to-pink-500",
    bg: "bg-gradient-to-br from-purple-50 to-pink-50",
    border: "border-purple-400",
    text: "text-purple-700",
  },
  rare: {
    name: "稀有",
    emoji: "🔵",
    color: "from-blue-400 to-cyan-500",
    bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
    border: "border-blue-400",
    text: "text-blue-700",
  },
  common: {
    name: "普通",
    emoji: "⚪",
    color: "from-gray-400 to-gray-500",
    bg: "bg-gradient-to-br from-gray-50 to-gray-100",
    border: "border-gray-400",
    text: "text-gray-700",
  },
};

const TYPE_NAMES = {
  badge: "徽章",
  ticket_stub: "票根",
  poster: "海报",
  certificate: "证书",
};

export default function CollectionClient() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId"); // 从URL获取orderId参数
  const ticketIdParam = searchParams.get("ticketId"); // 从URL获取ticketId参数

  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterRarity, setFilterRarity] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  useEffect(() => {
    fetchCollection();
  }, [filterRarity, filterType, orderIdParam, ticketIdParam]);

  async function fetchCollection() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("请先登录");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filterRarity) params.append("rarity", filterRarity);
      if (filterType) params.append("type", filterType);
      if (orderIdParam) params.append("orderId", orderIdParam); // 添加订单ID筛选
      if (ticketIdParam) params.append("ticketId", ticketIdParam); // 添加票ID筛选

      const res = await fetch(`/api/user/collection?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "加载失败");
      }

      setCollection(data.data || []);
      setStats(data.stats);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse text-center text-gray-500">
            加载中...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/auth/login" className="mt-4 inline-block text-indigo-600 underline">
            前往登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            🎨 我的收藏
          </h1>
          <p className="text-white/60">珍藏你的数字纪念品</p>

          {/* 筛选提示 */}
          {(orderIdParam || ticketIdParam) && (
            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">🎫</span>
                <span className="text-white text-sm">
                  {ticketIdParam ? (
                    <>
                      正在查看票 <span className="font-mono font-semibold text-xs">{ticketIdParam}</span> 的纪念品
                    </>
                  ) : (
                    <>
                      正在查看订单 <span className="font-mono font-semibold">{orderIdParam}</span> 的纪念品
                    </>
                  )}
                </span>
              </div>
              <Link
                href="/account/collection"
                className="text-emerald-400 hover:text-emerald-300 text-sm underline"
              >
                查看全部
              </Link>
            </div>
          )}
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-500">总收藏</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-yellow-600">
                🟡 {stats.byRarity.legendary}
              </div>
              <div className="text-sm text-gray-500">传说级</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-blue-600">
                🔵 {stats.byRarity.rare}
              </div>
              <div className="text-sm text-gray-500">稀有级</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-emerald-600">
                {stats.has3D} / {stats.hasAR}
              </div>
              <div className="text-sm text-gray-500">3D / AR</div>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                稀有度
              </label>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">全部</option>
                <option value="legendary">🟡 传说</option>
                <option value="epic">🟣 史诗</option>
                <option value="rare">🔵 稀有</option>
                <option value="common">⚪ 普通</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">类型</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">全部</option>
                <option value="badge">徽章</option>
                <option value="ticket_stub">票根</option>
                <option value="poster">海报</option>
                <option value="certificate">证书</option>
              </select>
            </div>
          </div>
        </div>

        {/* 收藏品网格 */}
        {collection.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 mb-4">还没有收藏品</p>
            <Link
              href="/events"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              去购票获取纪念品
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.map((item) => {
              const rarityConfig = RARITY_CONFIG[item.badge.rarity];
              return (
                <div
                  key={item.id}
                  className={`${rarityConfig.bg} ${rarityConfig.border} border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105`}
                >
                  {/* 图片 */}
                  <div className="aspect-square bg-gradient-to-br from-white/50 to-transparent p-6 flex items-center justify-center">
                    <div className="text-9xl">
                      {item.badge.type === "badge"
                        ? "🏅"
                        : item.badge.type === "ticket_stub"
                        ? "🎫"
                        : item.badge.type === "poster"
                        ? "🖼️"
                        : "📜"}
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="p-4 bg-white">
                    {/* 稀有度标签 */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${rarityConfig.text} bg-gradient-to-r ${rarityConfig.color} bg-opacity-10`}
                      >
                        {rarityConfig.emoji} {rarityConfig.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {TYPE_NAMES[item.badge.type]}
                      </span>
                    </div>

                    {/* 名称 */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {item.badge.name}
                    </h3>

                    {/* 描述 */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.badge.description}
                    </p>

                    {/* 活动信息 */}
                    <div className="text-xs text-gray-500 mb-3">
                      <div>📍 {item.badge.event.name}</div>
                      <div>
                        📅 {item.badge.event.date} {item.badge.event.time}
                      </div>
                    </div>

                    {/* 3D/AR 标记 */}
                    <div className="flex gap-2 mb-3">
                      {item.badge.has3DModel && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          🎮 3D
                        </span>
                      )}
                      {item.badge.hasAR && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          📱 AR
                        </span>
                      )}
                      {item.badge.hasAnimation && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          ✨ 动画
                        </span>
                      )}
                    </div>

                    {/* 票信息 */}
                    {item.ticket && (
                      <div className="text-xs text-gray-400 mb-3 font-mono">
                        票号: {item.ticket.ticketCode}
                      </div>
                    )}

                    {/* 获得时间 */}
                    <div className="text-xs text-gray-400">
                      获得于{" "}
                      {new Date(item.obtainedAt).toLocaleDateString("zh-CN")}
                    </div>

                    {/* 查看详情按钮 */}
                    <Link
                      href={`/account/collection/${item.id}`}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                    >
                      <span>👁️</span>
                      <span>查看详情</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <Link
            href="/account/orders"
            className="inline-block text-indigo-600 hover:text-indigo-700 underline"
          >
            ← 返回订单列表
          </Link>
        </div>
      </div>
    </main>
  );
}
