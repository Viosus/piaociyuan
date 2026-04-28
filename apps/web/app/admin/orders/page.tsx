"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";

type OrderItem = {
  id: string;
  userId: string;
  user: { id: string; nickname: string | null; phone: string | null; email: string | null } | null;
  eventId: number;
  tierId: number;
  qty: number;
  status: string;
  amount: number;
  createdAt: number;
  paidAt: number | null;
  refundedAt: number | null;
  paymentMethod: string | null;
  event: { id: number; name: string; city: string; date: string } | null;
  tier: { id: number; name: string; price: number } | null;
  tickets: Array<{ id: string; ticketCode: string; status: string }>;
};

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "PENDING", label: "待支付" },
  { value: "PAID", label: "已支付" },
  { value: "CANCELLED", label: "已取消" },
  { value: "REFUNDED", label: "已退款" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  CANCELLED: "已取消",
  REFUNDED: "已退款",
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [processing, setProcessing] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await apiGet(`/api/admin/orders?${params.toString()}`);
      if (res.ok && res.data) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch {
      alert("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    loadOrders();
  }, [page, statusFilter, search, router]);

  const handleRefund = async (orderId: string) => {
    if (!confirm("确定要退款此订单？此操作不可撤销。")) return;
    setProcessing(orderId);
    try {
      const res = await apiPost(`/api/admin/orders/${orderId}/refund`, {});
      if (res.ok) {
        alert("退款成功");
        loadOrders();
      } else {
        alert(`退款失败: ${res.message}`);
      }
    } catch {
      alert("退款失败");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="page-background">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
            <button
              onClick={() => router.push("/admin")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              返回管理后台
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="搜索订单号或用户ID"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 px-4 py-2 border rounded"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">共 {total} 条</span>
          </div>
        </div>

        {/* 订单列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            暂无订单
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">订单号</th>
                    <th className="text-left px-4 py-3 font-medium">用户</th>
                    <th className="text-left px-4 py-3 font-medium">活动</th>
                    <th className="text-left px-4 py-3 font-medium">票档</th>
                    <th className="text-center px-4 py-3 font-medium">数量</th>
                    <th className="text-right px-4 py-3 font-medium">金额</th>
                    <th className="text-center px-4 py-3 font-medium">状态</th>
                    <th className="text-left px-4 py-3 font-medium">下单时间</th>
                    <th className="text-center px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[140px] truncate">
                        {order.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{order.user?.nickname || "未知"}</div>
                        <div className="text-xs text-gray-400">{order.user?.phone || order.user?.email || ""}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <div className="text-sm truncate">{order.event?.name || "未知活动"}</div>
                        <div className="text-xs text-gray-400">{order.event?.date || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.tier?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">{order.qty}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        ¥{order.amount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => setDetailOrder(order)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            详情
                          </button>
                          {order.status === "PAID" && (
                            <button
                              onClick={() => handleRefund(order.id)}
                              disabled={processing === order.id}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            >
                              退款
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 bg-white rounded shadow">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </main>

      {/* 订单详情弹窗 */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">订单详情</h2>
                <button
                  onClick={() => setDetailOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">订单号：</span>
                    <span className="font-mono">{detailOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">状态：</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[detailOrder.status]}`}>
                      {STATUS_LABELS[detailOrder.status]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">用户：</span>
                    <span>{detailOrder.user?.nickname || "未知"} ({detailOrder.user?.phone || detailOrder.user?.email || ""})</span>
                  </div>
                  <div>
                    <span className="text-gray-500">金额：</span>
                    <span className="font-bold text-lg">¥{detailOrder.amount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">活动：</span>
                    <span>{detailOrder.event?.name || "未知"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">票档：</span>
                    <span>{detailOrder.tier?.name || "未知"} x {detailOrder.qty}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">下单时间：</span>
                    <span>{formatTime(detailOrder.createdAt)}</span>
                  </div>
                  {detailOrder.paidAt && (
                    <div>
                      <span className="text-gray-500">支付时间：</span>
                      <span>{formatTime(detailOrder.paidAt)}</span>
                    </div>
                  )}
                </div>

                {detailOrder.paymentMethod && (
                  <div>
                    <span className="text-gray-500">支付方式：</span>
                    <span>{detailOrder.paymentMethod}</span>
                  </div>
                )}

                {/* 门票列表 */}
                {detailOrder.tickets.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-700 mb-2">门票列表</h4>
                    <div className="space-y-2">
                      {detailOrder.tickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-mono text-xs">{ticket.ticketCode}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            ticket.status === 'used' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'refunded' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                {detailOrder.status === "PAID" && (
                  <button
                    onClick={() => {
                      setDetailOrder(null);
                      handleRefund(detailOrder.id);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                  >
                    退款
                  </button>
                )}
                <button
                  onClick={() => setDetailOrder(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
