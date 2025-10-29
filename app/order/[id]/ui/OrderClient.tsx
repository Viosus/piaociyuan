"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  eventId: number;
  tierId: number;
  qty: number;
  holdId: string;
  status: "PENDING" | "PAID";
  createdAt: number;
  paidAt?: number;
};

function StatusBadge({ status }: { status: Order["status"] }) {
  const cls =
    status === "PAID"
      ? "bg-green-50 text-green-700"
      : "bg-amber-50 text-amber-700";
  const text = status === "PAID" ? "已支付" : "待支付";
  return <span className={`px-2 py-1 text-xs rounded ${cls}`}>{text}</span>;
}

export default function OrderClient({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createdAtText = useMemo(() => {
    if (!order) return "";
    const d = new Date(order.createdAt);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }, [order]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "FETCH_FAIL");
      const data = (await res.json()) as Order;
      setOrder(data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    pollRef.current = setInterval(fetchOrder, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (order?.status === "PAID" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [order?.status]);

  async function payNow() {
    if (!order) return;
    setPaying(true);
    try {
      const res = await fetch("/api/pay/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "PAY_FAIL");
      // 立即刷新订单状态
      await fetchOrder();
    } catch (e: any) {
      alert(`支付失败：${e?.message || "未知错误"}`);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="animate-pulse text-gray-400">加载中...</div>
        </div>
      </main>
    );
  }

  if (err || !order) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">订单不存在</h1>
          <p className="text-gray-500">{err || "请返回重试"}</p>
          <Link href="/events" className="mt-6 inline-block text-indigo-600 underline">
            返回活动列表
          </Link>
        </div>
      </main>
    );
  }

  const isPaid = order.status === "PAID";

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">订单详情</h1>
            <div className="mt-1 text-gray-500 text-sm">订单号：{order.id}</div>
            <div className="mt-1 text-gray-500 text-sm">下单时间：{createdAtText}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* 占位二维码区域 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-3">入场二维码（占位）</div>
            <div className="aspect-square border rounded-lg flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="font-mono text-xs text-gray-400 mb-2">ORDER</div>
                <div className="font-mono text-sm break-all px-4">{order.id}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              * 支付成功后二维码才会生效（当前为占位图）
            </div>
          </div>

          {/* 操作区 */}
          <div className="border rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-3">支付与票务</div>
            {!isPaid ? (
              <>
                <div className="p-3 rounded bg-amber-50 text-amber-800 text-sm mb-3">
                  订单待支付，请在有效期内完成支付。
                </div>
                <button
                  onClick={payNow}
                  disabled={paying}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {paying ? "支付中..." : "去支付（模拟）"}
                </button>
                <div className="mt-3 text-xs text-gray-500">
                  支付成功后，页面会自动更新为“已支付”状态。
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded bg-green-50 text-green-700 text-sm mb-3">
                  支付完成，订单已生效。
                </div>
                <Link
                  href={`/account/badges?orderId=${encodeURIComponent(order.id)}`}
                  className="w-full inline-flex items-center justify-center py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  查看电子纪念品
                </Link>
                <div className="mt-3 text-xs text-gray-500">
                  你可以在电子纪念品页保存 PNG 图片作为留念。
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Link href="/events" className="text-indigo-600 underline text-sm">
            返回活动列表
          </Link>
        </div>
      </div>
    </main>
  );
}
