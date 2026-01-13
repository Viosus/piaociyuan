"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from '@/lib/api';

type NFT = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sourceType: string;
  category: string;
  eventId?: number;
  rarity: string;
  price?: number;
  totalSupply: number;
  mintedCount: number;
  has3DModel: boolean;
  hasAR: boolean;
  hasAnimation: boolean;
  isActive: boolean;
  isMintable: boolean;
  isMarketable: boolean;
  createdAt: string;
  event?: {
    id: number;
    name: string;
  };
  _count: {
    userNFTs: number;
  };
};

type NFTsResponse = {
  ok: boolean;
  data?: {
    nfts: NFT[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function NFTsManagement() {
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载NFT列表
  const loadNFTs = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/admin/nfts?category=${categoryFilter}&sourceType=${sourceTypeFilter}&search=${search}&page=${page}&pageSize=20`
      ) as NFTsResponse;
      if (res.ok && res.data) {
        setNfts(res.data.nfts);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        alert('加载失败');
      }
    } catch {
      // 静默处理加载NFT列表失败
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

    loadNFTs();
  }, [categoryFilter, sourceTypeFilter, search, page, router]);

  // 稀有度标签
  const getRarityBadge = (rarity: string) => {
    const styles: Record<string, string> = {
      common: 'bg-gray-100 text-gray-800',
      uncommon: 'bg-green-100 text-green-800',
      rare: 'bg-blue-100 text-blue-800',
      epic: 'bg-purple-100 text-purple-800',
      legendary: 'bg-yellow-100 text-yellow-800',
    };
    const labels: Record<string, string> = {
      common: '普通',
      uncommon: '罕见',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[rarity] || styles.common}`}>
        {labels[rarity] || rarity}
      </span>
    );
  };

  // 分类标签
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      badge: '徽章',
      ticket_stub: '票根',
      poster: '海报',
      certificate: '证书',
      art: '艺术品',
    };
    return labels[category] || category;
  };

  // 来源类型标签
  const getSourceTypeLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      ticket_reward: '购票奖励',
      standalone: '独立售卖',
      airdrop: '空投',
    };
    return labels[sourceType] || sourceType;
  };

  return (
    <div className="page-background">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">NFT管理</h1>
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
          <div className="flex gap-4 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded"
            >
              <option value="all">所有分类</option>
              <option value="badge">徽章</option>
              <option value="ticket_stub">票根</option>
              <option value="poster">海报</option>
              <option value="certificate">证书</option>
              <option value="art">艺术品</option>
            </select>
            <select
              value={sourceTypeFilter}
              onChange={(e) => { setSourceTypeFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded"
            >
              <option value="all">所有来源</option>
              <option value="ticket_reward">购票奖励</option>
              <option value="standalone">独立售卖</option>
              <option value="airdrop">空投</option>
            </select>
            <input
              type="text"
              placeholder="搜索NFT名称"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 px-4 py-2 border rounded"
            />
          </div>
        </div>

        {/* NFT列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        ) : nfts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无NFT</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* NFT图片 */}
                <div className="aspect-square relative">
                  <img
                    src={nft.imageUrl}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {nft.has3DModel && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">3D</span>
                    )}
                    {nft.hasAR && (
                      <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded">AR</span>
                    )}
                    {nft.hasAnimation && (
                      <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded">动画</span>
                    )}
                  </div>
                </div>

                {/* NFT信息 */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{nft.name}</h3>

                  <div className="flex gap-2 mb-2">
                    {getRarityBadge(nft.rarity)}
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {getCategoryLabel(nft.category)}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {getSourceTypeLabel(nft.sourceType)}
                    </span>
                  </div>

                  {nft.event && (
                    <p className="text-sm text-blue-600 mb-2">
                      关联活动：{nft.event.name}
                    </p>
                  )}

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {nft.description}
                  </p>

                  <div className="text-xs text-gray-600 space-y-1 mb-3">
                    <p>已铸造：{nft.mintedCount} / {nft.totalSupply}</p>
                    <p>用户持有：{nft._count.userNFTs}</p>
                    {nft.price && <p>价格：¥{nft.price}</p>}
                  </div>

                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      nft.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {nft.isActive ? '启用' : '禁用'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      nft.isMintable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {nft.isMintable ? '可铸造' : '不可铸造'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
