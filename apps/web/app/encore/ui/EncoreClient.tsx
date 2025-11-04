// app/encore/ui/EncoreClient.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

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
  };
  event?: {
    id: number;
    name: string;
    city: string;
    date: string;
  };
  images: {
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
  }[];
};

export default function EncoreClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 加载帖子
  const loadPosts = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts?page=${pageNum}&pageSize=20`);
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.message || "加载失败");
      }

      if (pageNum === 1) {
        setPosts(data.data);
      } else {
        setPosts((prev) => [...prev, ...data.data]);
      }

      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (err: unknown) {
      console.error("Load posts error:", err);
      setError(err instanceof Error ? err.message : String(err) || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  // 无限滚动
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading]);

  // 加载下一页
  useEffect(() => {
    if (page > 1) {
      loadPosts(page);
    }
  }, [page, loadPosts]);

  if (error && posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            loadPosts(1);
          }}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          重试
        </button>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EAF353] mx-auto mb-4"></div>
          <p className="text-white/60">加载中...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-semibold text-white mb-2">还没有内容</h2>
        <p className="text-white/60 mb-6">成为第一个分享演出时刻的人吧！</p>
        <button className="px-6 py-3 bg-[#EAF353] text-white rounded-lg font-medium hover:bg-[#FFC9E0] transition">
          📝 发布第一篇帖子
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 瀑布流网格 */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="break-inside-avoid mb-4"
          >
            <Link
              href={`/encore/${post.id}`}
              className="block bg-white border border-[#FFEBF5] rounded-xl overflow-hidden hover:border-[#FFE3F0] hover:shadow-lg transition-all group"
            >
              {/* 图片 */}
              {post.images.length > 0 && (
                <div className="relative overflow-hidden">
                  <img
                    src={post.images[0].imageUrl}
                    alt={post.content.substring(0, 50)}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* 多图标识 */}
                  {post.images.length > 1 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white flex items-center gap-1">
                      🖼️ {post.images.length}
                    </div>
                  )}
                </div>
              )}

              {/* 内容 */}
              <div className="p-4">
                {/* 标题/内容 */}
                <p className="text-[#282828] text-sm line-clamp-2 mb-3">
                  {post.content}
                </p>

                {/* 活动标签 */}
                {post.event && (
                  <div className="mb-3 flex items-center gap-1 text-xs">
                    <span>🎪</span>
                    <span className="truncate item-name">{post.event.name}</span>
                  </div>
                )}

                {/* 地点标签 */}
                {post.location && (
                  <div className="mb-3 flex items-center gap-1 text-xs text-[#282828]/60">
                    <span>📍</span>
                    <span className="truncate">{post.location}</span>
                  </div>
                )}

                {/* 用户信息 */}
                <div className="flex items-center gap-2 mb-3">
                  {post.user.avatar ? (
                    <img
                      src={post.user.avatar}
                      alt={post.user.nickname}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-[#EAF353] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {post.user.nickname[0]}
                    </div>
                  )}
                  <span className="text-xs text-[#282828]/80 truncate">
                    {post.user.nickname}
                  </span>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center gap-4 text-xs text-[#282828]/60">
                  <div className="flex items-center gap-1">
                    <span>❤️</span>
                    <span>{post.likeCount > 0 ? post.likeCount : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>💬</span>
                    <span>{post.commentCount > 0 ? post.commentCount : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>👁️</span>
                    <span>{post.viewCount > 0 ? post.viewCount : ''}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* 加载更多指示器 */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-white/60">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EAF353]"></div>
              <span>加载更多...</span>
            </div>
          )}
        </div>
      )}

      {/* 已加载全部 */}
      {!hasMore && posts.length > 0 && (
        <div className="py-8 text-center text-white/40 text-sm">
          已经到底啦 ✨
        </div>
      )}

      {/* 发布按钮（悬浮） - 根据右侧边栏宽度调整位置 */}
      <button
        className="fixed bottom-8 w-14 h-14 bg-[#EAF353] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 hover:bg-[#FFC9E0] transition-all flex items-center justify-center text-2xl z-40"
        style={{ right: 'calc(var(--right-sidebar-width, 64px) + 2rem)' }}
        onClick={() => alert("发布功能即将上线！")}
      >
        ✏️
      </button>
    </div>
  );
}
