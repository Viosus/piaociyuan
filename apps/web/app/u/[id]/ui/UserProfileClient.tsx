"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import Breadcrumb from "@/components/Breadcrumb";

interface UserProfile {
  id: string;
  nickname: string;
  avatar?: string | null;
  bio?: string | null;
  coverImage?: string | null;
  website?: string | null;
  location?: string | null;
  isVerified: boolean;
  verifiedType?: string | null;
  isFollowing: boolean;
  isFollowedBy: boolean;
  stats: {
    postCount: number;
    followerCount: number;
    followingCount: number;
  };
}

interface Post {
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
  images: {
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
  }[];
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function UserProfileClient({ userId }: { userId: string }) {
  const toast = useToast();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 从 localStorage 推断当前用户 ID（用于隐藏自己页面上的关注按钮）
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id) setCurrentUserId(String(parsed.id));
      }
    } catch {
      // ignore
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const res = await fetch(`/api/user/${userId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || "加载用户资料失败");
      }
      setUser(data.data);
    } catch (e: unknown) {
      setProfileError(e instanceof Error ? e.message : "加载用户资料失败");
    } finally {
      setProfileLoading(false);
    }
  }, [userId]);

  const loadPosts = useCallback(
    async (pageNum: number) => {
      try {
        setPostsLoading(true);
        const res = await fetch(
          `/api/posts?userId=${userId}&page=${pageNum}&pageSize=20`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        if (!data.ok) return;
        const items: Post[] = data.data || [];
        setPosts((prev) => (pageNum === 1 ? items : [...prev, ...items]));
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } finally {
        setPostsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadProfile();
    setPage(1);
    setHasMore(true);
    loadPosts(1);
  }, [userId, loadProfile, loadPosts]);

  // 无限滚动
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore || postsLoading) return;
    const target = loadMoreRef.current;
    if (!target) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const next = page + 1;
        setPage(next);
        loadPosts(next);
      }
    });
    observerRef.current.observe(target);
    return () => observerRef.current?.disconnect();
  }, [page, hasMore, postsLoading, loadPosts]);

  // W-S2 进入私聊：复用已存在的对话或创建新对话，跳到 /messages/[id]
  const handleSendMessage = async () => {
    if (!user || dmBusy) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("请先登录");
      router.push(`/auth/login?returnUrl=${encodeURIComponent(`/u/${userId}`)}`);
      return;
    }
    setDmBusy(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "无法开启对话");
        return;
      }
      router.push(`/messages/${data.id}`);
    } catch {
      toast.error("网络错误，请稍后再试");
    } finally {
      setDmBusy(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || followBusy) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("请先登录");
      return;
    }
    setFollowBusy(true);
    const wasFollowing = user.isFollowing;
    try {
      const method = wasFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.ok) {
        setUser({
          ...user,
          isFollowing: data.data.isFollowing,
          stats: {
            ...user.stats,
            followerCount: data.data.followerCount ?? user.stats.followerCount,
          },
        });
        toast.success(wasFollowing ? "已取消关注" : `已关注 ${user.nickname}`);
      } else {
        toast.error(data.message || "操作失败");
      }
    } catch {
      toast.error("网络错误，请稍后再试");
    } finally {
      setFollowBusy(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46467A] mx-auto mb-4"></div>
          <p className="text-[#1a1a1f]/60">加载中...</p>
        </div>
      </div>
    );
  }

  if (profileError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#46467A] text-lg mb-4">{profileError || "用户不存在"}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 rounded-xl bg-[#46467A] text-white hover:opacity-90 transition"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = currentUserId !== null && currentUserId === user.id;

  return (
    <div className="min-h-screen pb-12 px-4 -mt-20">
      <div className="max-w-3xl mx-auto pt-24">
        <Breadcrumb
          items={[
            { label: "安可区", href: "/encore" },
            { label: user.nickname || "个人主页" },
          ]}
        />
        {/* 用户卡片 */}
        <div
          className="rounded-2xl p-6 mb-6 shadow"
          style={{ background: "rgba(255, 255, 255, 0.8)" }}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.nickname}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#FFEBF5]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#46467A] text-white flex items-center justify-center text-2xl font-bold">
                  {user.nickname?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-bold text-[#46467A] truncate">
                  {user.nickname || "匿名用户"}
                </h1>
                {user.isVerified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#46467A] text-white">
                    已认证
                  </span>
                )}
              </div>

              {user.bio && (
                <p className="text-sm text-[#1a1a1f] mb-2 whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-[#1a1a1f]/60 flex-wrap">
                {user.location && <span>📍 {user.location}</span>}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#46467A] hover:underline"
                  >
                    🔗 {user.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <div>
              <div className="text-lg font-bold text-[#46467A]">
                {user.stats.postCount}
              </div>
              <div className="text-xs text-[#1a1a1f]/60">动态</div>
            </div>
            <Link
              href={`/u/${userId}/followers`}
              className="block hover:opacity-80 transition"
            >
              <div className="text-lg font-bold text-[#46467A]">
                {user.stats.followerCount}
              </div>
              <div className="text-xs text-[#1a1a1f]/60 hover:underline">粉丝</div>
            </Link>
            <Link
              href={`/u/${userId}/following`}
              className="block hover:opacity-80 transition"
            >
              <div className="text-lg font-bold text-[#46467A]">
                {user.stats.followingCount}
              </div>
              <div className="text-xs text-[#1a1a1f]/60 hover:underline">关注</div>
            </Link>
          </div>

          {/* 关注按钮 + W-S7 互关 badge */}
          {!isSelf && (
            <div className="mt-5 space-y-2">
              {user.isFollowing && user.isFollowedBy && (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full text-xs font-medium text-pink-600">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  互相关注
                </div>
              )}
              {!user.isFollowing && user.isFollowedBy && (
                <div className="text-center text-xs text-[#1a1a1f]/60">
                  TA 关注了你
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleFollowToggle}
                  disabled={followBusy}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition ${
                    user.isFollowing
                      ? "border border-[#46467A]/30 text-[#46467A] hover:bg-[#46467A]/10"
                      : "bg-[#46467A] text-white hover:opacity-90"
                  } ${followBusy ? "opacity-60 cursor-not-allowed" : ""}`}
                  style={user.isFollowing ? { background: "rgba(255, 255, 255, 0.8)" } : undefined}
                >
                  {user.isFollowing ? "已关注" : user.isFollowedBy ? "回关" : "关注"}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={dmBusy}
                  className="flex-1 py-2.5 rounded-xl font-medium border border-[#46467A]/30 text-[#46467A] hover:bg-[#46467A]/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "rgba(255, 255, 255, 0.8)" }}
                  title="发送私信"
                >
                  {dmBusy ? "..." : "发私信"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 动态列表 */}
        <h2 className="text-lg font-semibold text-[#46467A] mb-3 px-1">动态</h2>
        {posts.length === 0 && !postsLoading ? (
          <div
            className="rounded-2xl p-12 text-center shadow"
            style={{ background: "rgba(255, 255, 255, 0.8)" }}
          >
            <div className="text-4xl mb-2">📭</div>
            <p className="text-[#1a1a1f]/60">还没有发布动态</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/encore/${p.id}`}
                className="block rounded-2xl p-4 shadow hover:shadow-lg transition"
                style={{ background: "rgba(255, 255, 255, 0.8)" }}
              >
                <p className="text-sm text-[#1a1a1f] whitespace-pre-wrap line-clamp-3 mb-2">
                  {p.content}
                </p>
                {p.images?.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {p.images.slice(0, 3).map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.id}
                        src={img.imageUrl}
                        alt=""
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-[#1a1a1f]/60">
                  <span>👁 {p.viewCount}</span>
                  <span>❤ {p.likeCount}</span>
                  <span>💬 {p.commentCount}</span>
                  <span className="ml-auto">
                    {new Date(p.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 无限滚动哨兵 */}
        <div ref={loadMoreRef} className="h-8 flex items-center justify-center mt-4">
          {postsLoading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#46467A]"></div>
          )}
          {!hasMore && posts.length > 0 && (
            <span className="text-xs text-[#1a1a1f]/40">没有更多了</span>
          )}
        </div>
      </div>
    </div>
  );
}
