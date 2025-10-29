"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getEventById, getTiersByEventId } from "@/lib/mock";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"" | "PENDING" | "PAID">("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const url = status ? `/api/orders?status=${status}` : `/api/orders`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return orders;
    return orders.filter(o => o.id.toLowerCase().includes(key));
  }, [orders, q]);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold">我的订单</h1>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索订单号"
              className="px-3 py-2 border rounded-lg w-56"
            />
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待支付</option>
              <option value="PAID">已支付</option>
            </select>
            <button
              onClick={load}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              刷新
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="py-2 pr-4">订单号</th>
                <th className="py-2 pr-4">活动</th>
                <th className="py-2 pr-4">票档/数量</th>
                <th className="py-2 pr-4">金额</th>
                <th className="py-2 pr-4">状态</th>
                <th className="py-2 pr-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    没有订单
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const ev = getEventById(o.eventId);
                  const tier = getTiersByEventId(o.eventId).find(t => t.id === o.tierId);
                  const total = tier ? tier.price * o.qty : 0;
                  return (
                    <tr key={o.id} className="border-t text-sm">
                      <td className="py-3 pr-4 font-mono">{o.id}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{ev?.name ?? "活动已下架"}</div>
                        <div className="text-gray-500">
                          {ev ? `${ev.city} · ${ev.date} ${ev.time}` : ""}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {tier ? `${tier.name} × ${o.qty}` : `票档 ${o.tierId} × ${o.qty}`}
                      </td>
                      <td className="py-3 pr-4">¥ {total}</td>
                      <td className="py-3 pr-4">
                        {o.status === "PAID" ? (
                          <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs">已支付</span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs">待支付</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/order/${o.id}`}
                            className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                          >
                            查看
                          </Link>
                          {o.status === "PAID" && (
                            <Link
                              href={`/account/badges?orderId=${encodeURIComponent(o.id)}`}
                              className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                            >
                              纪念品
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm">
          <Link href="/events" className="text-indigo-600 underline">
            返回活动列表
          </Link>
        </div>
      </div>
    </main>
  );
}
