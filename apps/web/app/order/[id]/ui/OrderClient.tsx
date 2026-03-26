"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from '@/lib/api';
// NFT minting hidden for store submission
// import { MintNFTButton } from '@/components/MintNFTButton';

type Ticket = {
  id: string;
  ticketCode: string;
  status: "available" | "locked" | "sold" | "used" | "refunded";
  price: number;
  refundedAt?: string | null; // 退票时间，用于判断是否已退票
  usedAt?: string | null; // 使用时间
  nftMintStatus?: string | null; // NFT铸造状态
  nftTokenId?: number | null; // NFT Token ID
};

type Order = {
  id: string;
  eventId: number;
  tierId: number;
  qty: number;
  holdId: string;
  status: "PENDING" | "PAID";
  createdAt: number;
  paidAt?: number;
  tickets?: Ticket[];
  nftStatus?: string; // NFT状态
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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [refunding, setRefunding] = useState(false);
  const [usingTicket, setUsingTicket] = useState<string | null>(null); // 正在使用的票ID
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

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
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "加载失败");
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
    } catch (error: unknown) {
      alert(`支付失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setPaying(false);
    }
  }

  const soldTickets = useMemo(() => {
    return order?.tickets?.filter(t => t.status === 'sold') || [];
  }, [order?.tickets]);

  const hasRefundableTickets = soldTickets.length > 0;

  function openRefundModal() {
    setSelectedTickets(new Set());
    setShowRefundModal(true);
  }

  function toggleTicket(ticketId: string) {
    const newSet = new Set(selectedTickets);
    if (newSet.has(ticketId)) {
      newSet.delete(ticketId);
    } else {
      newSet.add(ticketId);
    }
    setSelectedTickets(newSet);
  }

  function selectAllTickets() {
    setSelectedTickets(new Set(soldTickets.map(t => t.id)));
  }

  // ⚠️ 测试功能：模拟工作人员验票
  // 生产环境应该：
  // 1. 移除此按钮
  // 2. 由工作人员扫描二维码触发
  // 3. 工作人员系统调用验票API
  async function useTicket(ticketId: string) {
    if (!confirm('⚠️ 测试功能：模拟工作人员验票\n\n确定要使用此票吗？使用后将获得纪念品！')) return;

    setUsingTicket(ticketId);
    try {
      const data = await apiPost("/api/tickets/use", { ticketId });

      if (!data.ok) {
        throw new Error(data.message || "使用票失败");
      }

      // 显示获得的纪念品
      if (data.data.badges && data.data.badges.length > 0) {
        const badgeNames = data.data.badges.map((b: { name: string }) => b.name).join('\n');
        alert(`检票成功！🎉\n\n获得纪念品:\n${badgeNames}\n\n可在"我的次元"中查看`);
      } else {
        alert('检票成功！');
      }

      await fetchOrder();
    } catch (error: unknown) {
      alert(`检票失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setUsingTicket(null);
    }
  }

  async function refundSelectedTickets() {
    if (selectedTickets.size === 0) {
      alert('请至少选择一张票');
      return;
    }

    const ticketsToRefund = Array.from(selectedTickets);
    if (!confirm(`确定要退 ${ticketsToRefund.length} 张票吗？`)) return;

    setRefunding(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const ticketId of ticketsToRefund) {
        try {
          const data = await apiPost("/api/tickets/refund", { ticketId });
          if (!data.ok) throw new Error(data.message || "退票失败");
          successCount++;
        } catch {
          // 静默处理退票失败
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`成功退票 ${successCount} 张${failCount > 0 ? `，失败 ${failCount} 张` : ''}`);
        await fetchOrder();
        setShowRefundModal(false);
        setSelectedTickets(new Set());
        // 退票成功后跳转到订单列表页
        router.push('/account/orders');
      } else {
        alert('退票失败，请稍后重试');
      }
    } catch (error: unknown) {
      alert(`退票失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setRefunding(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="animate-pulse text-[#282828] opacity-60">加载中...</div>
        </div>
      </main>
    );
  }

  if (err || !order) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-2 text-[#EAF353]">订单不存在</h1>
          <p className="text-[#282828]">{err || "请返回重试"}</p>
          <Link href="/events" className="mt-6 inline-block text-[#EAF353] underline">
            返回活动列表
          </Link>
        </div>
      </main>
    );
  }

  const isPaid = order.status === "PAID";
  const allTicketsRefunded = order.tickets && order.tickets.length > 0 && order.tickets.every(t => t.refundedAt !== null && t.refundedAt !== undefined);

  return (
    <main className="min-h-screen p-8 bg-[#C72471]">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#EAF353]">订单详情</h1>
            <div className="mt-1 text-[#282828] text-sm">订单号：{order.id}</div>
            <div className="mt-1 text-[#282828] text-sm">下单时间：{createdAtText}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* 占位二维码区域 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-xl p-4">
            <div className="text-sm text-[#282828] mb-3">入场二维码（占位）</div>
            <div className="aspect-square border rounded-lg flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="font-mono text-xs text-[#282828] opacity-60 mb-2">ORDER</div>
                <div className="font-mono text-sm break-all px-4">{order.id}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#282828] opacity-60">
              * 支付成功后二维码才会生效（当前为占位图）
            </div>
          </div>

          {/* 操作区 */}
          <div className="border rounded-xl p-4">
            <div className="text-sm text-[#282828] mb-3">支付与票务</div>
            {!isPaid && !allTicketsRefunded ? (
              <>
                <div className="p-3 rounded bg-amber-50 text-amber-800 text-sm mb-3">
                  订单待支付，请在有效期内完成支付。
                </div>
                <button
                  onClick={payNow}
                  disabled={paying}
                  className="w-full py-3 bg-[#EAF353] text-white rounded-lg hover:bg-[#FFC9E0] disabled:opacity-50"
                >
                  {paying ? "支付中..." : "去支付（模拟）"}
                </button>
                <div className="mt-3 text-xs text-[#282828]">
                  支付成功后，页面会自动更新为"已支付"状态。
                </div>
              </>
            ) : allTicketsRefunded ? (
              <>
                <div className="p-3 rounded bg-gray-100 text-[#282828] text-sm mb-3">
                  所有票已退票，订单已失效。
                </div>
                <Link
                  href="/events"
                  className="w-full inline-flex items-center justify-center py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  返回活动列表
                </Link>
              </>
            ) : (
              <>
                <div className="p-3 rounded bg-green-50 text-green-700 text-sm mb-3">
                  支付完成，订单已生效。
                </div>
                <Link
                  href="/account/collection"
                  className="w-full inline-flex items-center justify-center py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 mb-3"
                >
                  🎨 我的次元
                </Link>
                {hasRefundableTickets && (
                  <button
                    onClick={openRefundModal}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    退票
                  </button>
                )}
                <div className="mt-3 text-xs text-[#282828]">
                  你可以在电子纪念品页保存 PNG 图片作为留念。
                </div>
              </>
            )}
          </div>
        </div>

        {/* 票列表 */}
        {isPaid && order.tickets && order.tickets.length > 0 && (
          <div className="mt-6 border rounded-xl p-4">
            <h2 className="text-lg font-semibold text-[#EAF353] mb-4">我的票 ({order.tickets.length})</h2>
            <div className="space-y-3">
              {order.tickets.map((ticket) => {
                const isRefunded = ticket.status === 'refunded' || (ticket.refundedAt !== null && ticket.refundedAt !== undefined);
                return (
                  <div
                    key={ticket.id}
                    className={`border rounded-lg p-3 ${
                      isRefunded ? 'bg-gray-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold">
                          {ticket.ticketCode}
                        </div>
                        <div className="text-xs text-[#282828] mt-1">
                          状态: {
                            isRefunded ? '🔄 已退票' :
                            ticket.status === 'sold' ? '✅ 已售出' :
                            ticket.status === 'used' ? '✓ 已使用' :
                            ticket.status
                          } · ¥{ticket.price}
                        </div>
                      </div>
                      {!isRefunded && (
                        <div className="flex flex-col gap-2 min-w-[100px]">
                          {ticket.status === 'sold' && (
                            <button
                              onClick={() => useTicket(ticket.id)}
                              disabled={usingTicket === ticket.id}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all whitespace-nowrap disabled:opacity-50"
                            >
                              {usingTicket === ticket.id ? '检票中...' : '🎫 检票'}
                            </button>
                          )}
                          {/* MintNFTButton hidden for store submission */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 退票模态框 */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-[#EAF353] mb-4">选择要退的票</h2>

              <div className="mb-4 space-y-2 max-h-96 overflow-y-auto">
                {soldTickets.map((ticket) => (
                  <label
                    key={ticket.id}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTickets.has(ticket.id)}
                      onChange={() => toggleTicket(ticket.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-mono text-sm font-semibold">
                        {ticket.ticketCode}
                      </div>
                      <div className="text-xs text-[#282828]">
                        ¥{ticket.price}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllTickets}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                >
                  全选
                </button>
                <button
                  onClick={() => setSelectedTickets(new Set())}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                >
                  清空
                </button>
              </div>

              <div className="text-sm text-[#282828] mb-4">
                已选择 {selectedTickets.size} / {soldTickets.length} 张票
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  disabled={refunding}
                  className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={refundSelectedTickets}
                  disabled={refunding || selectedTickets.size === 0}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refunding ? '退票中...' : `退 ${selectedTickets.size} 张票`}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link href="/events" className="text-[#EAF353] underline text-sm">
            返回活动列表
          </Link>
        </div>
      </div>
    </main>
  );
}
