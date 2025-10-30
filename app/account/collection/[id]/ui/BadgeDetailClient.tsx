// app/account/collection/[id]/ui/BadgeDetailClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Badge = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  type: string;
  has3DModel: boolean;
  model3DUrl?: string;
  modelFormat?: string;
  hasAR: boolean;
  arUrl?: string;
  hasAnimation: boolean;
  animationUrl?: string;
  modelConfig?: any;
  event: {
    id: number;
    name: string;
    city: string;
    venue: string;
    date: Date;
    time: string;
    cover: string;
    artist: string;
    desc: string;
  };
};

type Ticket = {
  id: string;
  ticketCode: string;
  status: string;
  price: number;
  purchasedAt?: string;
};

type Order = {
  id: string;
  status: string;
  createdAt: number;
  paidAt?: number;
};

type BadgeDetail = {
  id: string;
  badge: Badge;
  ticket?: Ticket;
  order?: Order;
  obtainedAt: string;
  metadata?: any;
};

const RARITY_CONFIG: Record<
  string,
  {
    name: string;
    emoji: string;
    color: string;
    bg: string;
    border: string;
    shadow: string;
  }
> = {
  legendary: {
    name: "传说",
    emoji: "🟡",
    color: "from-yellow-400 to-orange-500",
    bg: "bg-gradient-to-br from-yellow-50 to-orange-50",
    border: "border-yellow-400",
    shadow: "shadow-yellow-200",
  },
  epic: {
    name: "史诗",
    emoji: "🟣",
    color: "from-purple-400 to-pink-500",
    bg: "bg-gradient-to-br from-purple-50 to-pink-50",
    border: "border-purple-400",
    shadow: "shadow-purple-200",
  },
  rare: {
    name: "稀有",
    emoji: "🔵",
    color: "from-blue-400 to-cyan-500",
    bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
    border: "border-blue-400",
    shadow: "shadow-blue-200",
  },
  common: {
    name: "普通",
    emoji: "⚪",
    color: "from-gray-400 to-gray-500",
    bg: "bg-gradient-to-br from-gray-50 to-gray-100",
    border: "border-gray-300",
    shadow: "shadow-gray-200",
  },
};

const TYPE_CONFIG: Record<string, { name: string; emoji: string }> = {
  badge: { name: "徽章", emoji: "🏅" },
  ticket_stub: { name: "票根", emoji: "🎫" },
  poster: { name: "海报", emoji: "🖼️" },
  certificate: { name: "证书", emoji: "📜" },
};

export default function BadgeDetailClient({ badgeId }: { badgeId: string }) {
  const router = useRouter();
  const [badgeDetail, setBadgeDetail] = useState<BadgeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchBadgeDetail();
  }, [badgeId]);

  const fetchBadgeDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch(`/api/user/collection/${badgeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.message || "加载失败");
        return;
      }

      setBadgeDetail(data.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 分享功能
  const handleShare = async (type: string) => {
    if (!badgeDetail) return;

    const shareUrl = `${window.location.origin}/account/collection/${badgeId}`;
    const shareText = `我获得了${badgeDetail.badge.event.name}的${badgeDetail.badge.name}！`;

    switch (type) {
      case "copy":
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
          alert("复制失败，请手动复制链接");
        }
        break;

      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
        break;

      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
        break;

      case "weibo":
        window.open(
          `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
          "_blank"
        );
        break;

      case "download":
        // 简单的下载图片实现
        const link = document.createElement("a");
        link.href = badgeDetail.badge.imageUrl;
        link.download = `${badgeDetail.badge.name}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;

      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !badgeDetail) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "未找到收藏品"}</p>
        <Link
          href="/account/collection"
          className="text-indigo-600 hover:text-indigo-700 underline"
        >
          返回收藏列表
        </Link>
      </div>
    );
  }

  const rarityConfig = RARITY_CONFIG[badgeDetail.badge.rarity] || RARITY_CONFIG.common;
  const typeConfig = TYPE_CONFIG[badgeDetail.badge.type] || TYPE_CONFIG.badge;

  return (
    <div>
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link
          href="/account/collection"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回收藏列表
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：收藏品展示 */}
        <div className={`${rarityConfig.bg} ${rarityConfig.border} border-2 rounded-2xl p-6 shadow-xl ${rarityConfig.shadow}`}>
          {/* 稀有度和类型标签 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${rarityConfig.color}`}>
                {rarityConfig.emoji} {rarityConfig.name}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-200">
                {typeConfig.emoji} {typeConfig.name}
              </span>
            </div>

            {/* 3D/AR标记 */}
            <div className="flex gap-2">
              {badgeDetail.badge.has3DModel && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  🎮 3D
                </span>
              )}
              {badgeDetail.badge.hasAR && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  📱 AR
                </span>
              )}
              {badgeDetail.badge.hasAnimation && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  ✨ 动画
                </span>
              )}
            </div>
          </div>

          {/* 收藏品图片 */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-4 shadow-lg">
            <img
              src={badgeDetail.badge.imageUrl}
              alt={badgeDetail.badge.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 3D/AR 按钮 */}
          {(badgeDetail.badge.has3DModel || badgeDetail.badge.hasAR) && (
            <div className="flex gap-3 mb-4">
              {badgeDetail.badge.has3DModel && (
                <button
                  onClick={() => alert("3D查看器功能即将上线！")}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition"
                >
                  🎮 查看3D模型
                </button>
              )}
              {badgeDetail.badge.hasAR && (
                <button
                  onClick={() => alert("AR功能即将上线！")}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition"
                >
                  📱 AR体验
                </button>
              )}
            </div>
          )}

          {/* 收藏品名称和描述 */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {badgeDetail.badge.name}
          </h1>
          <p className="text-gray-600 leading-relaxed">
            {badgeDetail.badge.description}
          </p>
        </div>

        {/* 右侧：详细信息和分享 */}
        <div className="space-y-6">
          {/* 分享功能 */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📤</span> 分享收藏品
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare("copy")}
                className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span>{copySuccess ? "✅" : "🔗"}</span>
                <span className="font-medium">
                  {copySuccess ? "已复制" : "复制链接"}
                </span>
              </button>
              <button
                onClick={() => handleShare("download")}
                className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span>💾</span>
                <span className="font-medium">下载图片</span>
              </button>
              <button
                onClick={() => handleShare("weibo")}
                className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition"
              >
                <span>🔴</span>
                <span className="font-medium">分享到微博</span>
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <span>🐦</span>
                <span className="font-medium">分享到Twitter</span>
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={() => alert("社交平台功能即将上线，敬请期待！")}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition"
              >
                ✨ 分享到社交平台（即将上线）
              </button>
            </div>
          </div>

          {/* 活动信息 */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🎪</span> 活动信息
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">活动名称</p>
                <p className="text-gray-800 font-medium">
                  {badgeDetail.badge.event.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">艺人</p>
                <p className="text-gray-800 font-medium">
                  {badgeDetail.badge.event.artist}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">城市</p>
                  <p className="text-gray-800 font-medium">
                    {badgeDetail.badge.event.city}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">场馆</p>
                  <p className="text-gray-800 font-medium">
                    {badgeDetail.badge.event.venue}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">日期</p>
                  <p className="text-gray-800 font-medium">
                    {new Date(badgeDetail.badge.event.date).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">时间</p>
                  <p className="text-gray-800 font-medium">
                    {badgeDetail.badge.event.time}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 票务信息 */}
          {badgeDetail.ticket && (
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🎫</span> 票务信息
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">票号</p>
                  <p className="text-gray-800 font-mono text-sm">
                    {badgeDetail.ticket.ticketCode}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">票价</p>
                    <p className="text-gray-800 font-medium">
                      ¥{badgeDetail.ticket.price}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">状态</p>
                    <p className="text-gray-800 font-medium">
                      {badgeDetail.ticket.status === "sold" && "已售出"}
                      {badgeDetail.ticket.status === "used" && "已使用"}
                    </p>
                  </div>
                </div>
                {badgeDetail.ticket.purchasedAt && (
                  <div>
                    <p className="text-sm text-gray-500">购买时间</p>
                    <p className="text-gray-800 text-sm">
                      {new Date(badgeDetail.ticket.purchasedAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
