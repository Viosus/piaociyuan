"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import MediaDisplay from "@/components/MediaDisplay";

type Collectible = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  has3DModel: boolean;
  model3DUrl: string | null;
  modelFormat: string | null;
  hasAnimation: boolean;
  animationUrl: string | null;
  totalSupply: number;
  claimedCount: number;
  event?: { id: number; name: string; cover: string; date: string; venue: string } | null;
};

type UserCollectible = {
  id: string;
  obtainedAt: string;
  sourceType: string;
  collectible: Collectible;
};

export default function CollectibleDetailClient() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<UserCollectible | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    apiGet(`/api/collectibles/my`)
      .then((data) => {
        if (data.ok) {
          const found = data.data.items.find(
            (i: UserCollectible) => i.id === params.id
          );
          setItem(found || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#46467A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 text-lg">收藏品不存在</p>
        <button
          onClick={() => router.push("/account/collectibles")}
          className="mt-4 px-4 py-2 bg-[#46467A] text-white rounded-xl"
        >
          返回收藏品列表
        </button>
      </div>
    );
  }

  const { collectible } = item;
  const categoryLabels: Record<string, string> = {
    badge: "徽章",
    ticket_stub: "票根",
    poster: "海报",
    certificate: "证书",
    art: "艺术品",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => router.push("/account/collectibles")}
        className="flex items-center gap-2 text-[#46467A] hover:text-[#5a5a9a] mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回收藏品列表
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 左侧：媒体展示 */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50">
          <MediaDisplay
            has3DModel={collectible.has3DModel}
            model3DUrl={collectible.model3DUrl}
            imageUrl={collectible.imageUrl}
            name={collectible.name}
            className="w-full h-full"
          />
        </div>

        {/* 右侧：详情信息 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
              {categoryLabels[collectible.category] || collectible.category}
            </span>
            {collectible.has3DModel && (
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                3D
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {collectible.name}
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {collectible.description}
          </p>

          {/* 信息卡片 */}
          <div className="space-y-3">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">领取时间</span>
              <span className="text-gray-900">
                {new Date(item.obtainedAt).toLocaleString("zh-CN")}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">来源</span>
              <span className="text-gray-900">
                {item.sourceType === "ticket_purchase"
                  ? "购票获得"
                  : item.sourceType === "gift"
                  ? "赠送获得"
                  : item.sourceType === "achievement"
                  ? "成就获得"
                  : item.sourceType}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">发行量</span>
              <span className="text-gray-900">
                {collectible.claimedCount} / {collectible.totalSupply}
              </span>
            </div>
            {collectible.event && (
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">关联活动</span>
                <span className="text-gray-900">{collectible.event.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
