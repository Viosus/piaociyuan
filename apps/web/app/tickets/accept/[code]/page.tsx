"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function AcceptTransferPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const transferCode = (params.code as string).toUpperCase();

  const [transferInfo, setTransferInfo] = useState<{
    ticketName?: string;
    fromUser?: string;
    message?: string;
    expiresAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);

  // 加载转赠信息
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push(`/auth/login?returnUrl=/tickets/accept/${transferCode}`);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/tickets/transfer/${transferCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok) {
          setTransferInfo({
            ticketName: data.data.ticket?.event?.name,
            fromUser: data.data.fromUser?.nickname,
            message: data.data.message,
            expiresAt: data.data.expiresAt,
          });
        } else {
          toast.error(data.message || "转赠码无效或已过期");
        }
      } catch {
        toast.error("网络错误");
      } finally {
        setLoading(false);
      }
    })();
  }, [transferCode, router, toast]);

  const handleAction = async (action: "accept" | "reject") => {
    setAccepting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tickets/transfer/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ transferCode, action }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(action === "accept" ? "已接收门票" : "已拒绝转赠");
        setDone(action === "accept" ? "accepted" : "rejected");
      } else {
        toast.error(data.message || "操作失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46467A]" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 -mt-20 pt-24">
      <div className="bg-white rounded-2xl shadow border border-[#FFEBF5] p-6 text-center">
        <div className="text-5xl mb-4">🎫</div>
        <h1 className="text-xl font-bold text-[#46467A] mb-2">门票转赠</h1>

        {!transferInfo ? (
          <>
            <p className="text-sm text-[#1a1a1f]/60 mb-6">
              转赠码 <code className="font-mono">{transferCode}</code> 无效或已过期
            </p>
            <Link
              href="/tickets"
              className="inline-block px-6 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] transition"
            >
              返回我的票
            </Link>
          </>
        ) : done === "accepted" ? (
          <>
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              ✓ 已成功接收门票
            </p>
            <Link
              href="/tickets"
              className="inline-block px-6 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] transition"
            >
              查看我的票
            </Link>
          </>
        ) : done === "rejected" ? (
          <>
            <p className="text-sm text-[#1a1a1f]/60 mb-6">已拒绝此次转赠</p>
            <Link
              href="/events"
              className="inline-block px-6 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] transition"
            >
              去逛活动
            </Link>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-[#1a1a1f] mb-1">
              {transferInfo.fromUser || "对方"} 给你转赠了一张票
            </p>
            {transferInfo.ticketName && (
              <p className="text-sm text-[#46467A] font-medium mb-3">
                《{transferInfo.ticketName}》
              </p>
            )}
            {transferInfo.message && (
              <p className="text-sm bg-[#46467A]/5 text-[#1a1a1f] p-3 rounded-lg mb-4 border border-[#46467A]/10">
                💬 {transferInfo.message}
              </p>
            )}
            {transferInfo.expiresAt && (
              <p className="text-xs text-[#1a1a1f]/40 mb-6">
                有效期至 {new Date(transferInfo.expiresAt).toLocaleString("zh-CN")}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAction("reject")}
                disabled={accepting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                拒绝
              </button>
              <button
                type="button"
                onClick={() => handleAction("accept")}
                disabled={accepting}
                className="flex-1 px-4 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] disabled:opacity-50 transition"
              >
                {accepting ? "处理中..." : "接收门票"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
