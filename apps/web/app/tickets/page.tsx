"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { ListSkeleton } from "@/components/PageSkeleton";

interface Ticket {
  id: string;
  ticketCode: string;
  status: string;
  price: number;
  purchasedAt?: string;
  event: {
    id: number;
    name: string;
    city: string;
    venue: string;
    date: string;
    time: string;
    coverImage: string;
    category: string;
  } | null;
  tier: { id: number; name: string; price: number } | null;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  unused: { text: "未使用", cls: "bg-blue-100 text-blue-700" },
  used: { text: "已使用", cls: "bg-gray-100 text-gray-600" },
  refunded: { text: "已退款", cls: "bg-orange-100 text-orange-700" },
  transferring: { text: "转赠中", cls: "bg-purple-100 text-purple-700" },
  cancelled: { text: "已取消", cls: "bg-red-100 text-red-700" },
};

export default function TicketsPage() {
  const router = useRouter();
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const data = await apiGet(`/api/tickets/my-tickets?${params}`);
      if (data.ok) {
        setTickets(data.data || []);
      } else {
        toast.error(data.message || "加载票务失败");
      }
    } catch {
      toast.error("加载失败，请检查网络");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login?returnUrl=/tickets");
      return;
    }
    load();
  }, [load, router]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 -mt-20 pt-24">
      <h1 className="text-2xl font-bold text-[#46467A] mb-4">我的票</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "all", label: "全部" },
          { key: "unused", label: "未使用" },
          { key: "used", label: "已使用" },
          { key: "refunded", label: "已退款" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === tab.key
                ? "bg-[#46467A] text-white"
                : "bg-white/80 text-foreground hover:bg-white border border-[#FFEBF5]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="🎫"
          title={filter === "all" ? "还没有票" : `暂无${STATUS_LABEL[filter]?.text || ""}的票`}
          description="买票后凭票二维码现场入场"
          action={{ label: "去逛活动", href: "/events" }}
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => {
            const status = STATUS_LABEL[t.status] || { text: t.status, cls: "bg-gray-100 text-gray-600" };
            return (
              <li key={t.id}>
                <Link
                  href={`/tickets/${t.id}`}
                  className="flex gap-4 p-4 bg-white border border-[#FFEBF5] rounded-xl hover:shadow-md transition"
                >
                  {t.event?.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.event.coverImage}
                      alt={t.event.name}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {t.event?.name || "未知活动"}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${status.cls} flex-shrink-0`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-soft truncate">
                      {t.event?.city} · {t.event?.venue}
                    </p>
                    <p className="text-sm text-foreground-soft">
                      {t.event?.date} {t.event?.time}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-[#46467A] font-medium">{t.tier?.name || ""}</span>
                      <span className="text-sm text-[#46467A] font-semibold">¥ {t.price}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
