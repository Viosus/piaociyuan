"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search as SearchIcon } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/PageSkeleton";

interface UserResult {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  isVerified: boolean;
  followerCount: number;
}

interface PostResult {
  id: string;
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: { id: string; nickname: string; avatar: string | null };
  images: { imageUrl: string }[];
}

interface EventResult {
  id: number;
  name: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  cover: string;
  category: string;
}

type SearchType = "all" | "user" | "post" | "event";

const TABS: { key: SearchType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "user", label: "用户" },
  { key: "post", label: "帖子" },
  { key: "event", label: "活动" },
];

function SearchPageInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const initialQ = sp.get("q") || "";
  const initialType = (sp.get("type") || "all") as SearchType;

  const [q, setQ] = useState(initialQ);
  const [activeType, setActiveType] = useState<SearchType>(initialType);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (query: string, type: SearchType) => {
      if (query.trim().length < 2) {
        setUsers([]);
        setPosts([]);
        setEvents([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, type });
        const data = await apiGet(`/api/search?${params}`);
        if (data.ok) {
          setUsers(data.data.users || []);
          setPosts(data.data.posts || []);
          setEvents(data.data.events || []);
        }
      } catch {
        toast.error("搜索失败");
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // url query 变化触发搜索
  useEffect(() => {
    if (initialQ) search(initialQ, initialType);
  }, [initialQ, initialType, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      toast.warning("至少输入 2 个字符");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}&type=${activeType}`);
  };

  const switchTab = (t: SearchType) => {
    setActiveType(t);
    if (q.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}&type=${t}`);
    }
  };

  const showUsers = activeType === "all" || activeType === "user";
  const showPosts = activeType === "all" || activeType === "post";
  const showEvents = activeType === "all" || activeType === "event";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 -mt-20 pt-24">
      {/* 搜索框 */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1a1f]/40" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜用户、帖子、活动..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#46467A]/30 rounded-full focus:outline-none focus:ring-2 focus:ring-[#46467A] text-[#1a1a1f]"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#46467A] text-white rounded-full hover:bg-[#5A5A8E] transition"
        >
          搜索
        </button>
      </form>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              activeType === t.key
                ? "border-[#46467A] text-[#46467A]"
                : "border-transparent text-[#1a1a1f]/60 hover:text-[#1a1a1f]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {q.trim().length < 2 ? (
        <EmptyState
          icon="🔍"
          title="开始搜索"
          description="输入至少 2 个字符搜索用户、帖子或活动"
        />
      ) : loading ? (
        <ListSkeleton rows={6} />
      ) : users.length === 0 && posts.length === 0 && events.length === 0 ? (
        <EmptyState
          icon="🤷"
          title="没有找到匹配结果"
          description={`没有跟"${q}"相关的内容`}
        />
      ) : (
        <div className="space-y-6">
          {/* Users */}
          {showUsers && users.length > 0 && (
            <section>
              {activeType === "all" && (
                <h2 className="text-sm font-semibold text-[#46467A] mb-2">用户</h2>
              )}
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/u/${u.id}`}
                      className="flex items-center gap-3 p-3 bg-white border border-[#FFEBF5] rounded-xl hover:bg-[#FFEBF5]/30 transition"
                    >
                      {u.avatar ? (
                        <Image
                          src={u.avatar}
                          alt={u.nickname}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {u.nickname[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-medium text-[#1a1a1f] truncate">{u.nickname}</h3>
                          {u.isVerified && <span className="text-blue-500 text-sm">✓</span>}
                        </div>
                        {u.bio && <p className="text-xs text-[#1a1a1f]/60 truncate">{u.bio}</p>}
                        <p className="text-xs text-[#1a1a1f]/40">{u.followerCount} 粉丝</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Posts */}
          {showPosts && posts.length > 0 && (
            <section>
              {activeType === "all" && (
                <h2 className="text-sm font-semibold text-[#46467A] mb-2">帖子</h2>
              )}
              <ul className="space-y-2">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/encore/${p.id}`}
                      className="flex gap-3 p-3 bg-white border border-[#FFEBF5] rounded-xl hover:bg-[#FFEBF5]/30 transition"
                    >
                      {p.images[0] && (
                        <Image
                          src={p.images[0].imageUrl}
                          alt=""
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1a1a1f] line-clamp-2">{p.content}</p>
                        <p className="text-xs text-[#1a1a1f]/40 mt-1">
                          {p.user.nickname} · ❤️ {p.likeCount} · 💬 {p.commentCount}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Events */}
          {showEvents && events.length > 0 && (
            <section>
              {activeType === "all" && (
                <h2 className="text-sm font-semibold text-[#46467A] mb-2">活动</h2>
              )}
              <ul className="space-y-2">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/events/${ev.id}`}
                      className="flex gap-3 p-3 bg-white border border-[#FFEBF5] rounded-xl hover:bg-[#FFEBF5]/30 transition"
                    >
                      <Image
                        src={ev.cover}
                        alt={ev.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#1a1a1f] truncate">{ev.name}</h3>
                        <p className="text-xs text-[#1a1a1f]/60 truncate">
                          {ev.city} · {ev.venue}
                        </p>
                        <p className="text-xs text-[#1a1a1f]/40">
                          {ev.date} {ev.time}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
