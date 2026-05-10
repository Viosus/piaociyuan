"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function TransferTicketPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const ticketId = params.id as string;

  const [toUserPhone, setToUserPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tickets/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ticketId,
          transferType: "gift",
          toUserPhone: toUserPhone || undefined,
          message: message || undefined,
          expiresInHours: 48,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTransferCode(data.data.transferCode);
        toast.success("转赠已发起");
      } else {
        toast.error(data.message || "转赠失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const transferLink = transferCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/tickets/accept/${transferCode}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transferLink);
      setCopied(true);
      toast.success("链接已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动选中链接");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 -mt-20 pt-24">
      <button
        type="button"
        onClick={() => router.push(`/tickets/${ticketId}`)}
        className="inline-flex items-center gap-1 px-3 py-1.5 mb-4 text-sm text-[#46467A] hover:bg-[#46467A]/10 rounded-full transition"
      >
        <ArrowLeft className="w-4 h-4" />
        票详情
      </button>

      <div className="bg-white rounded-2xl shadow border border-[#FFEBF5] p-6">
        <h1 className="text-xl font-bold text-[#46467A] mb-2">转赠门票</h1>
        <p className="text-sm text-[#1a1a1f]/60 mb-6">
          可指定对方手机号定向转赠，也可以留空生成转赠链接分享给任意人。链接 48 小时内有效。
        </p>

        {transferCode ? (
          // 成功状态：显示链接
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-700 mb-2">✓ 转赠已发起，链接 48 小时内有效</p>
              <p className="text-xs text-green-600">把下面链接发给对方，对方登录后打开即可接收</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
              <code className="flex-1 text-xs text-[#1a1a1f] truncate">{transferLink}</code>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 p-2 text-[#46467A] hover:bg-[#46467A]/10 rounded transition"
                aria-label="复制链接"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/tickets/${ticketId}`)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                完成
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1f] mb-1">
                对方手机号（可选）
              </label>
              <input
                type="tel"
                value={toUserPhone}
                onChange={(e) => setToUserPhone(e.target.value)}
                placeholder="留空则生成通用转赠链接"
                pattern="1[3-9]\d{9}"
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A]"
              />
              <p className="text-xs text-[#1a1a1f]/40 mt-1">指定后只有该手机号注册的账号能接收</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1f] mb-1">
                留言（可选）
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="送票留言，对方接收时会看到"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A] resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/tickets/${ticketId}`)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] disabled:opacity-50 transition"
              >
                {submitting ? "发起中..." : "发起转赠"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
