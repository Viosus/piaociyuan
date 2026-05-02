"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";

type Post = {
  id: string;
  content: string;
  location?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
    isVerified: boolean;
    verifiedType?: string;
  };
  event?: {
    id: number;
    name: string;
    city: string;
    venue: string;
    date: string;
    time: string;
    cover: string;
  };
  images: {
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
  }[];
};

type Favorite = {
  id: string;
  createdAt: string;
  post: Post;
};

export default function PostFavorites() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadFavorites();
  }, [page]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("请先登录");
        return;
      }

      const res = await fetch(`/api/user/favorites?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "加载失败");
      }

      setFavorites(data.data.favorites);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-gray-500">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-[#FFEBF5]">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => loadFavorites()}
          className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <>
      {favorites.length === 0 ? (
        <EmptyState
          icon="📌"
          title="还没有收藏任何帖子"
          description="收藏喜欢的演出动态，方便回头再看"
          action={{ label: "去安可区看看", href: "/encore" }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((favorite) => (
              <Link
                key={favorite.id}
                href={`/encore/${favorite.post.id}`}
                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition group border border-[#FFEBF5]"
              >
                {/* 图片 */}
                {favorite.post.images.length > 0 ? (
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Image
                      src={favorite.post.images[0].imageUrl}
                      alt={favorite.post.content.substring(0, 50)}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {favorite.post.images.length > 1 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs">
                        {favorite.post.images.length} 张
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* 内容 */}
                <div className="p-4">
                  {/* 用户信息 */}
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/u/${favorite.post.user.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/u/${favorite.post.user.id}`);
                      }
                    }}
                    className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition"
                  >
                    {favorite.post.user.avatar ? (
                      <Image
                        src={favorite.post.user.avatar}
                        alt={favorite.post.user.nickname}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {favorite.post.user.nickname[0]}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[100px] hover:text-[#46467A]">
                        {favorite.post.user.nickname}
                      </span>
                      {favorite.post.user.isVerified && (
                        <svg
                          className="w-3 h-3 text-blue-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* 帖子内容 */}
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {favorite.post.content}
                  </p>

                  {/* 关联活动 */}
                  {favorite.post.event && (
                    <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600 truncate">
                      <span className="font-medium">{favorite.post.event.name}</span>
                    </div>
                  )}

                  {/* 互动数据 */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{favorite.post.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>{favorite.post.commentCount}</span>
                    </div>
                    <div className="ml-auto text-gray-400">{formatDate(favorite.createdAt)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                上一页
              </button>
              <span className="text-gray-600">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
