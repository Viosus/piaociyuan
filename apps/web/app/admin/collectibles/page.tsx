"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Collectible = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  has3DModel: boolean;
  hasAnimation: boolean;
  totalSupply: number;
  claimedCount: number;
  isActive: boolean;
  createdAt: string;
  event?: { id: number; name: string } | null;
  _count: { userCollectibles: number };
};

export default function AdminCollectiblesPage() {
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (category) params.set("category", category);
    if (search) params.set("search", search);

    apiGet(`/api/admin/collectibles?${params}`)
      .then((data) => {
        if (data.ok) {
          setCollectibles(data.data.collectibles);
          setTotalPages(data.data.pagination.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, category, search]);

  const categoryLabels: Record<string, string> = {
    badge: "徽章",
    ticket_stub: "票根",
    poster: "海报",
    certificate: "证书",
    art: "艺术品",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#46467A] mb-6">收藏品管理</h1>

      {/* 筛选 */}
      <div className="flex gap-3 mb-6">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">全部分类</option>
          <option value="badge">徽章</option>
          <option value="ticket_stub">票根</option>
          <option value="poster">海报</option>
          <option value="certificate">证书</option>
          <option value="art">艺术品</option>
        </select>
        <input
          type="text"
          placeholder="搜索收藏品..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-1 max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#46467A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">分类</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">功能</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">领取</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {collectibles.map((c) => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{c.name}</div>
                        {c.event && (
                          <div className="text-xs text-gray-400">{c.event.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">
                      {categoryLabels[c.category] || c.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.has3DModel && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">3D</span>
                      )}
                      {c.hasAnimation && (
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded">动画</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c._count.userCollectibles} / {c.totalSupply}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${c.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                      {c.isActive ? "启用" : "停用"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
