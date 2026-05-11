"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/PageSkeleton";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "ticket_status", label: "票务" },
  { key: "order_status", label: "订单" },
  { key: "post_like", label: "点赞" },
  { key: "post_comment", label: "评论" },
  { key: "new_follower", label: "粉丝" },
  { key: "new_message", label: "消息" },
  { key: "system", label: "系统" },
];

const TYPE_ICON: Record<string, string> = {
  event_reminder: "📅",
  order_status: "🧾",
  ticket_status: "🎫",
  post_like: "❤️",
  post_comment: "💬",
  new_follower: "👤",
  new_message: "✉️",
  system: "🔔",
};

function formatTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = now - t;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter !== "all") params.set("type", filter);
      const data = await apiGet(`/api/notifications?${params}`);
      if (data.ok) {
        setNotifications(data.data || []);
      } else {
        toast.error(data.message || "加载通知失败");
      }
    } catch {
      toast.error("加载通知失败，请检查网络");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login?returnUrl=/notifications");
      return;
    }
    load();
  }, [load, router]);

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/notifications/${n.id}/read`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setNotifications((prev) =>
          prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it))
        );
      } catch {
        // 静默失败：跳转优先
      }
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    if (marking) return;
    setMarking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("已全部标为已读");
      } else {
        toast.error("操作失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 -mt-20 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#46467A]">
          通知中心
          {unreadCount > 0 && (
            <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-red-500 text-white rounded-full align-middle">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={marking}
            className="text-sm text-[#46467A] hover:bg-[#46467A]/10 px-3 py-1.5 rounded-full transition disabled:opacity-50"
          >
            {marking ? "处理中..." : "全部标为已读"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              filter === tab.key
                ? "bg-[#46467A] text-white"
                : "bg-white/80 text-foreground hover:bg-white border border-[#FFEBF5]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <ListSkeleton rows={6} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title={filter === "all" ? "还没有通知" : "该分类下暂无通知"}
          description="新动态、新粉丝、票务变化都会在这里告诉你"
          action={{ label: "去逛逛", href: "/events" }}
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => handleClick(n)}
                className={`w-full text-left flex gap-3 p-4 rounded-xl border transition ${
                  n.isRead
                    ? "bg-white/60 border-[#FFEBF5] hover:bg-white"
                    : "bg-white border-[#46467A]/30 hover:bg-[#46467A]/5"
                }`}
              >
                <span className="text-2xl flex-shrink-0" aria-hidden>
                  {TYPE_ICON[n.type] || "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm ${n.isRead ? "font-normal text-foreground-soft" : "font-semibold text-foreground"}`}>
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" aria-label="未读" />
                    )}
                  </div>
                  <p className="text-sm text-foreground-soft mb-1 break-words">{n.content}</p>
                  <p className="text-xs text-foreground-faint">{formatTime(n.createdAt)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-foreground-faint mt-6">
        <Link href="/account/settings" className="hover:underline">通知偏好设置</Link>
      </p>
    </div>
  );
}
