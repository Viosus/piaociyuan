"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/PageSkeleton";

interface FollowItem {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  isVerified: boolean;
  isFollowing?: boolean;
}

interface Props {
  userId: string;
  listType: "followers" | "following";
}

const TITLE = {
  followers: "粉丝",
  following: "关注",
};

export default function FollowList({ userId, listType }: Props) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<FollowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/user/${userId}/${listType}?limit=100`);
      if (data.ok) {
        setUsers(data.data || []);
      } else {
        toast.error(data.message || "加载失败");
      }
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [userId, listType, toast]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) setCurrentUserId(String(u.id));
      }
    } catch {
      // ignore
    }
    load();
  }, [load]);

  const handleToggleFollow = async (u: FollowItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("请先登录");
      router.push(`/auth/login?returnUrl=/u/${userId}/${listType}`);
      return;
    }
    const wasFollowing = !!u.isFollowing;
    // 取关需要确认
    if (wasFollowing) {
      const ok = await confirm({
        title: "取消关注",
        message: `确定取消关注「${u.nickname}」吗？`,
        confirmText: "取消关注",
        cancelText: "再想想",
        danger: true,
      });
      if (!ok) return;
    }
    setBusyMap((prev) => ({ ...prev, [u.id]: true }));
    try {
      const res = await fetch(`/api/users/${u.id}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setUsers((prev) =>
          prev.map((it) =>
            it.id === u.id ? { ...it, isFollowing: !wasFollowing } : it
          )
        );
        toast.success(wasFollowing ? "已取消关注" : "已关注");
      } else {
        toast.error(data.message || "操作失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setBusyMap((prev) => ({ ...prev, [u.id]: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 -mt-20 pt-24">
      <button
        type="button"
        onClick={() => router.push(`/u/${userId}`)}
        className="inline-flex items-center gap-1 px-3 py-1.5 mb-4 text-sm text-[#46467A] hover:bg-[#46467A]/10 rounded-full transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回主页
      </button>

      <h1 className="text-2xl font-bold text-[#46467A] mb-4">{TITLE[listType]}</h1>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title={listType === "followers" ? "还没有粉丝" : "还没有关注任何人"}
          description={listType === "followers" ? "" : "关注感兴趣的人，看 TA 的动态"}
        />
      ) : (
        <ul className="space-y-2">
          {users.map((u) => {
            const isSelf = currentUserId === u.id;
            const busy = busyMap[u.id];
            return (
              <li key={u.id}>
                <div className="flex items-center gap-3 p-3 bg-white border border-[#FFEBF5] rounded-xl">
                  <Link href={`/u/${u.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition">
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
                        <h3 className="font-medium text-foreground truncate">{u.nickname}</h3>
                        {u.isVerified && <span className="text-blue-500 text-sm">✓</span>}
                      </div>
                      {u.bio && (
                        <p className="text-xs text-foreground-soft truncate">{u.bio}</p>
                      )}
                    </div>
                  </Link>
                  {!isSelf && u.isFollowing !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(u)}
                      disabled={busy}
                      className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full transition disabled:opacity-50 ${
                        u.isFollowing
                          ? "bg-white border border-[#46467A]/30 text-[#46467A] hover:bg-[#46467A]/5"
                          : "bg-[#46467A] text-white hover:bg-[#5A5A8E]"
                      }`}
                    >
                      {busy ? "..." : u.isFollowing ? "已关注" : "关注"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
