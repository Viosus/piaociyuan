"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";

type Collectible = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  has3DModel: boolean;
  totalSupply: number;
  claimedCount: number;
  event?: { id: number; name: string; cover: string } | null;
};

type UserCollectible = {
  id: string;
  obtainedAt: string;
  sourceType: string;
  collectible: Collectible;
};

export default function CollectiblesClient() {
  const [items, setItems] = useState<UserCollectible[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/api/collectibles/my")
      .then((data) => {
        if (data.ok) {
          setItems(data.data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#46467A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#46467A] mb-6">我的收藏品</h1>

      {/* 说明卡片 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-8 border border-purple-100">
        <h3 className="text-lg font-semibold text-[#46467A] mb-2">收藏品展示</h3>
        <p className="text-sm text-gray-600">
          购票后可领取活动专属收藏品，支持 3D 模型预览和 2D 图片展示。
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-gray-500 text-lg">还没有收藏品</p>
          <p className="text-gray-400 text-sm mt-2">购票参加活动后即可获得专属收藏品</p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5a5a9a] transition-colors"
          >
            去看看活动
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/account/collectibles/${item.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100"
            >
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                <img
                  src={item.collectible.imageUrl}
                  alt={item.collectible.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.collectible.has3DModel && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                    3D
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {item.collectible.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.obtainedAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
