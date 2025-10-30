"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Order = {
  id: string;
  eventId: number;
  tierId: number;
  qty: number;
  status: "PENDING" | "PAID";
  createdAt: number;
  paidAt?: number;
};

export default function BadgesPage() {
  const sp = useSearchParams();
  const orderId = sp.get("orderId") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const paidAtText = useMemo(() => {
    if (!order?.paidAt) return "";
    const d = new Date(order.paidAt);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }, [order?.paidAt]);

  async function fetchOrder() {
    if (!orderId) {
      setErr("缺少 orderId");
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "加载失败");
      setOrder(data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "加载失败");
    }
  }

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status !== "PAID") return;
    const cacheKey = `pyz-badge-${order.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setImgUrl(cached);
      return;
    }

    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 720;
    const ctx = canvas.getContext("2d")!;
    // 背景
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 顶部标题
    ctx.fillStyle = "#A78BFA";
    ctx.font = "bold 40px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("PiaoCiYuan 电子纪念品", 40, 80);
    // 信息卡
    ctx.fillStyle = "#1F2937";
    ctx.fillRect(40, 120, 640, 420);
    ctx.strokeStyle = "#6366F1";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 120, 640, 420);
    // 文本
    ctx.fillStyle = "#E5E7EB";
    ctx.font = "bold 32px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("Congratulations!", 60, 170);
    ctx.font = "24px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText(`Order ID: ${order.id}`, 60, 220);
    ctx.fillText(`Quantity: ${order.qty}`, 60, 260);
    ctx.fillText(`Status: ${order.status}`, 60, 300);
    if (order.paidAt) ctx.fillText(`Paid At: ${paidAtText}`, 60, 340);
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "20px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("票次元", 60, 510);
    ctx.fillText("This is a demo badge image.", 60, 540);

    const url = canvas.toDataURL("image/png");
    localStorage.setItem(cacheKey, url);
    setImgUrl(url);
  }, [order, paidAtText]);

  if (err) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">电子纪念品</h1>
          <p className="text-gray-500 mb-4">{err}</p>
          <Link href="/events" className="text-indigo-600 underline">
            返回活动列表
          </Link>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="animate-pulse text-gray-400">加载中...</div>
        </div>
      </main>
    );
  }

  if (order.status !== "PAID") {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">电子纪念品</h1>
          <p className="text-gray-500">订单未支付，暂无法生成纪念品。</p>
          <Link
            href={`/order/${order.id}`}
            className="mt-4 inline-block text-indigo-600 underline"
          >
            返回订单页支付
          </Link>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-1">电子纪念品</h1>
        <div className="text-sm text-gray-500 mb-6">
          订单号：{order.id} · 已支付时间：{paidAtText}
        </div>

        <div className="border rounded-xl p-4 flex flex-col items-center">
          {imgUrl ? (
            <>
              <img
                src={imgUrl}
                alt="纪念品"
                className="w-full max-w-md rounded-lg shadow"
              />
              <div className="flex gap-2 mt-4">
                <a
                  href={imgUrl}
                  download={`badge_${order.id}.png`}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  下载 PNG
                </a>
                <button
                  onClick={() => {
                    localStorage.removeItem(`pyz-badge-${order.id}`);
                    setImgUrl(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  重新生成
                </button>
                <Link
                  href="/events"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  返回主页
                </Link>
              </div>
            </>
          ) : (
            <div className="text-gray-400">图片生成中...</div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
