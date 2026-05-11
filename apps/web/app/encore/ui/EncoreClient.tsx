// app/encore/ui/EncoreClient.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CreatePostDialog from "./CreatePostDialog";
import FavoriteButton from "./FavoriteButton";

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

type SortKey = "latest" | "hot" | "following";

const SORT_TABS: { key: SortKey; label: string; icon: string }[] = [
  { key: "latest", label: "最新", icon: "🆕" },
  { key: "hot", label: "热门", icon: "🔥" },
  { key: "following", label: "关注", icon: "⭐" },
];

export default function EncoreClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("latest");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 检查登录态（用于关注 Tab 的引导）
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  // 加载帖子
  const loadPosts = useCallback(async (pageNum: number, currentSort: SortKey) => {
    try {
      setLoading(true);
      const headers: HeadersInit = {};
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(
        `/api/posts?page=${pageNum}&pageSize=20&sort=${currentSort}`,
        { headers }
      );
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : String(error) || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载 / 切换排序时重新加载
  useEffect(() => {
    setError(null);
    setPage(1);
    setHasMore(true);
    loadPosts(1, sort);
  }, [sort, loadPosts]);

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
      loadPosts(page, sort);
    }
  }, [page, loadPosts, sort]);

  // 排序 Tab
  const renderSortTabs = () => (
    <div
      className="flex items-center gap-1 mb-6 p-1 rounded-2xl border border-[#FFEBF5]"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 1px 3px 0 rgba(70, 70, 122, 0.2)",
      }}
    >
      {SORT_TABS.map((tab) => {
        const active = tab.key === sort;
        return (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              active
                ? "bg-[#46467A] text-white shadow"
                : "text-foreground-soft hover:text-[#46467A] hover:bg-white/60"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (error && posts.length === 0) {
    return (
      <div>
        {renderSortTabs()}
        <div className="text-center py-12">
          <p className="text-[#46467A] mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadPosts(1, sort);
            }}
            className="px-6 py-2 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] transition"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div>
        {renderSortTabs()}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46467A] mx-auto mb-4"></div>
            <p className="text-foreground-soft">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    // 「关注」Tab 的特殊空态
    if (sort === "following") {
      return (
        <div>
          {renderSortTabs()}
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold text-[#46467A] mb-2">
              {isLoggedIn ? "还没有关注的人" : "登录后查看关注"}
            </h2>
            <p className="text-foreground-soft mb-6">
              {isLoggedIn
                ? "去发现更多有趣的人，关注他们后可以在这里看到他们的动态"
                : "登录账号后，关注感兴趣的用户即可在这里看到他们的动态"}
            </p>
            <button
              onClick={() => setSort("latest")}
              className="px-6 py-2.5 bg-[#46467A] text-white rounded-xl font-medium hover:bg-[#5A5A8E] transition"
            >
              去逛逛最新动态
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        {renderSortTabs()}
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-[#46467A] mb-2">还没有内容</h2>
          <p className="text-foreground-soft mb-6">成为第一个分享演出时刻的人吧！</p>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-6 py-3 bg-[#46467A] text-white rounded-xl font-medium hover:bg-[#5A5A8E] transition"
          >
            📝 发布第一篇帖子
          </button>

          {/* 发帖对话框 */}
          <CreatePostDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onSuccess={() => {
              setPage(1);
              loadPosts(1, sort);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderSortTabs()}
      {/* 瀑布流网格 */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {posts.map((post, postIndex) => (
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
                  <Image
                    src={post.images[0].imageUrl}
                    alt={post.content.substring(0, 50)}
                    width={post.images[0].width || 800}
                    height={post.images[0].height || 1067}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    priority={postIndex < 4}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
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
                <p className="text-foreground text-sm line-clamp-2 mb-3">
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
                  <div className="mb-3 flex items-center gap-1 text-xs text-foreground-soft">
                    <span>📍</span>
                    <span className="truncate">{post.location}</span>
                  </div>
                )}

                {/* 用户信息 */}
                <div
                  role="link"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/u/${post.user.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/u/${post.user.id}`);
                    }
                  }}
                  className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80 transition"
                >
                  {post.user.avatar ? (
                    <Image
                      src={post.user.avatar}
                      alt={post.user.nickname}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-[#46467A] to-[#E0DFFD] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {post.user.nickname[0]}
                    </div>
                  )}
                  <span className="text-xs text-foreground-soft truncate hover:text-[#46467A]">
                    {post.user.nickname}
                  </span>
                </div>

                {/* 底部操作栏 */}
                <div className="flex items-center justify-between">
                  {/* 统计信息 */}
                  <div className="flex items-center gap-4 text-xs text-foreground-soft">
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

                  {/* 收藏按钮 */}
                  <div onClick={(e) => e.preventDefault()}>
                    <FavoriteButton postId={post.id} />
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#46467A]"></div>
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
        className="fixed bottom-8 w-14 h-14 bg-[#46467A] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 hover:bg-[#5A5A8E] transition-all flex items-center justify-center text-2xl z-40"
        style={{ right: 'calc(var(--right-sidebar-width, 64px) + 2rem)' }}
        onClick={() => setIsCreateDialogOpen(true)}
        title="发布新帖子"
      >
        ✏️
      </button>

      {/* 发帖对话框 */}
      <CreatePostDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setPage(1);
          loadPosts(1, sort); // 刷新列表
        }}
      />
    </div>
  );
}
