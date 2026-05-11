"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";

interface TicketDetail {
  id: string;
  ticketCode: string;
  status: string;
  price: number;
  seatNumber?: string | null;
  purchasedAt?: string;
  usedAt?: string | null;
  event: {
    id: number;
    name: string;
    city: string;
    venue: string;
    date: string;
    time: string;
    coverImage: string;
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

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/tickets/${ticketId}`);
      if (data.ok) {
        setTicket(data.data);
      } else {
        toast.error(data.message || "加载票详情失败");
        router.push("/tickets");
      }
    } catch {
      toast.error("网络错误");
      router.push("/tickets");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router, toast]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push(`/auth/login?returnUrl=/tickets/${ticketId}`);
      return;
    }
    load();
  }, [load, router, ticketId]);

  // 生成 QR Code（仅 unused 状态）
  useEffect(() => {
    if (!ticket || ticket.status !== "unused") return;
    let cancelled = false;
    (async () => {
      try {
        // qrcode 包没 @types，dynamic import 走 any
        // @ts-expect-error - qrcode lacks type declarations
        const QRCode = await import("qrcode");
        const url: string = await QRCode.toDataURL(ticket.ticketCode, {
          width: 280,
          margin: 1,
          color: { dark: "#46467A", light: "#FFFFFF" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch (e) {
        console.error("QR 生成失败", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticket]);

  const handleRefund = async () => {
    if (!ticket) return;
    const ok = await confirm({
      title: "申请退款",
      message: `确定退款这张票吗？退款后无法恢复。\n金额：¥${ticket.price}`,
      confirmText: "申请退款",
      cancelText: "再想想",
      danger: true,
    });
    if (!ok) return;

    setRefunding(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tickets/${ticket.id}/refund`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("退款申请已提交");
        load();
      } else {
        toast.error(data.message || "退款失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46467A]" />
      </div>
    );
  }
  if (!ticket) return null;

  const status = STATUS_LABEL[ticket.status] || { text: ticket.status, cls: "bg-gray-100 text-gray-600" };
  const canRefund = ticket.status === "unused";
  const canTransfer = ticket.status === "unused";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 -mt-20 pt-24">
      {/* 返回 */}
      <button
        type="button"
        onClick={() => router.push("/tickets")}
        className="inline-flex items-center gap-1 px-3 py-1.5 mb-4 text-sm text-[#46467A] hover:bg-[#46467A]/10 rounded-full transition"
      >
        <ArrowLeft className="w-4 h-4" />
        我的票
      </button>

      {/* 票面 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#FFEBF5]">
        {/* 顶部活动信息 */}
        {ticket.event && (
          <div className="relative h-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.event.coverImage}
              alt={ticket.event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div className="text-white min-w-0">
                <h1 className="text-xl font-bold drop-shadow truncate">{ticket.event.name}</h1>
                <p className="text-xs opacity-90 drop-shadow">
                  {ticket.event.city} · {ticket.event.venue}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs ${status.cls} flex-shrink-0`}>
                {status.text}
              </span>
            </div>
          </div>
        )}

        {/* 票面信息 */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            <div>
              <p className="text-foreground-soft text-xs">票档</p>
              <p className="font-medium">{ticket.tier?.name || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-soft text-xs">价格</p>
              <p className="font-medium">¥ {ticket.price}</p>
            </div>
            <div>
              <p className="text-foreground-soft text-xs">日期 / 时间</p>
              <p className="font-medium">
                {ticket.event?.date} {ticket.event?.time}
              </p>
            </div>
            {ticket.seatNumber && (
              <div>
                <p className="text-foreground-soft text-xs">座位</p>
                <p className="font-medium">{ticket.seatNumber}</p>
              </div>
            )}
          </div>

          {/* QR */}
          {ticket.status === "unused" && (
            <div className="flex flex-col items-center py-6 border-t border-dashed border-[#46467A]/30">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="入场二维码" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded animate-pulse" />
              )}
              <p className="text-xs text-foreground-soft mt-2 font-mono">{ticket.ticketCode}</p>
              <p className="text-sm text-foreground-soft mt-1">现场出示此二维码入场</p>
            </div>
          )}
          {ticket.status === "used" && ticket.usedAt && (
            <div className="text-center py-6 border-t border-dashed border-gray-300">
              <p className="text-sm text-gray-600">已于 {new Date(ticket.usedAt).toLocaleString("zh-CN")} 使用</p>
            </div>
          )}

          {/* 操作 */}
          {(canRefund || canTransfer) && (
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              {canTransfer && (
                <Link
                  href={`/tickets/${ticket.id}/transfer`}
                  className="flex-1 text-center px-4 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] transition"
                >
                  转赠
                </Link>
              )}
              {canRefund && (
                <button
                  type="button"
                  onClick={handleRefund}
                  disabled={refunding}
                  className="flex-1 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                >
                  {refunding ? "处理中..." : "申请退款"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
