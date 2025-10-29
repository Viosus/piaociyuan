"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getEventById, getTiersByEventId } from "@/lib/mock";

/** ================= 数量上限配置（优先级从高到低） =================
 * 1) URL 参数：limit（仅用于调试/灰度，如 /checkout?...&limit=1）
 * 2) 按活动覆盖：PER_EVENT_LIMIT[eventId]
 * 3) 环境变量：NEXT_PUBLIC_MAX_PER_USER（.env.local）
 * 4) 默认值：2
 * =============================================================== */
const DEFAULT_MAX_PER_USER = 2;
const PER_EVENT_LIMIT: Record<number, number> = {
  // 1: 1,
};

function getEnvMax(): number {
  const raw = process.env.NEXT_PUBLIC_MAX_PER_USER;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_PER_USER;
}

function formatMMSS(msLeft: number) {
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** 美观的数量选择器（带长按、键盘输入、防抖、边界处理） */
function QuantityPicker({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setDraft(String(value)), [value]);

  const commit = (str: string) => {
    const n = Number(str);
    if (!Number.isFinite(n)) return;
    onChange(Math.min(max, Math.max(min, Math.floor(n))));
  };

  const startRepeat = (delta: number) => {
    onChange(Math.min(max, Math.max(min, value + delta)));
    if (repeatRef.current) clearInterval(repeatRef.current);
    repeatRef.current = setInterval(() => {
      onChange(Math.min(max, Math.max(min, value + delta)));
    }, 120);
  };
  const stopRepeat = () => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };

  const decDisabled = value <= min;
  const incDisabled = value >= max;

  return (
    <div className="inline-flex items-center select-none">
      <button
        type="button"
        className={`w-10 h-10 rounded-l-xl border flex items-center justify-center text-lg transition
          ${decDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-50 active:scale-95"}
        `}
        disabled={decDisabled}
        onMouseDown={() => !decDisabled && startRepeat(-1)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={() => !decDisabled && startRepeat(-1)}
        onTouchEnd={stopRepeat}
        aria-label="减少数量"
      >
        −
      </button>

      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(draft);
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(max, value + 1));
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(min, value - 1));
          }
        }}
        className="w-16 h-10 border-t border-b text-center outline-none font-medium"
      />

      <button
        type="button"
        className={`w-10 h-10 rounded-r-xl border flex items-center justify-center text-lg transition
          ${incDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-50 active:scale-95"}
        `}
        disabled={incDisabled}
        onMouseDown={() => !incDisabled && startRepeat(1)}
        onMouseUp={stopRepeat}
        onMouseLeave={stopRepeat}
        onTouchStart={() => !incDisabled && startRepeat(1)}
        onTouchEnd={stopRepeat}
        aria-label="增加数量"
      >
        +
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = Number(searchParams?.get("eventId") || 0);
  const tierId = Number(searchParams?.get("tierId") || 0);
  const initialQty = Number(searchParams?.get("qty") || 1);

  const urlLimitRaw = searchParams?.get("limit");
  const urlLimit = Number(urlLimitRaw);
  const perEventLimit = PER_EVENT_LIMIT[eventId];
  const baseLimit =
    Number.isFinite(urlLimit) && urlLimit > 0
      ? urlLimit
      : Number.isFinite(perEventLimit) && perEventLimit > 0
      ? perEventLimit
      : getEnvMax();

  const event = getEventById(eventId);
  const tier = getTiersByEventId(eventId).find((t) => t.id === tierId);

  if (!event || !tier) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">订单信息不完整</h1>
          <p className="text-gray-500">请从活动详情页重新选择票档。</p>
        </div>
      </main>
    );
  }

  const maxQty = Math.max(1, Math.min(baseLimit, tier.remaining));
  const [qty, setQty] = useState(() => {
    if (!Number.isFinite(initialQty) || initialQty < 1) return 1;
    return Math.min(maxQty, Math.max(1, initialQty));
  });

  const total = useMemo(() => tier.price * qty, [tier.price, qty]);

  /** ---------- 10 分钟锁票倒计时（进入结算开始；刷新恢复） ---------- */
  const HOLD_MS = 10 * 60 * 1000;
  const holdKey = `pcy-hold-${eventId}-${tierId}`;
  const [expireAt, setExpireAt] = useState<number>(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(holdKey) : null;
    const now = Date.now();
    if (stored) {
      const ts = Number(stored);
      if (Number.isFinite(ts) && ts > now) return ts;
    }
    const next = now + HOLD_MS;
    if (typeof window !== "undefined") sessionStorage.setItem(holdKey, String(next));
    return next;
  });
  const [now, setNow] = useState<number>(() => Date.now());
  const expiredRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const msLeft = Math.max(0, expireAt - now);
  const isExpired = msLeft <= 0;

  useEffect(() => {
    if (isExpired && !expiredRef.current) {
      expiredRef.current = true;
      sessionStorage.removeItem(holdKey);
      alert("锁票已过期，已为你释放库存。请返回活动页重新选择票档。");
      router.push(`/events/${eventId}`);
    }
  }, [isExpired, router, eventId, holdKey]);

  const resetHold = () => {
    const next = Date.now() + HOLD_MS;
    sessionStorage.setItem(holdKey, String(next));
    setExpireAt(next);
    expiredRef.current = false;
  };

  // -------------- 提交流程：创建 hold -> 创建 order -> 跳转 --------------
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  async function createHold() {
    const res = await fetch("/api/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, tierId, qty }),
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      // ✅ 兼容新旧格式：优先使用 message，其次 error
      const errorMessage = data?.message || data?.error || "HOLD_FAILED";
      
      // 特殊处理：库存不足时显示可售数量
      if ((data?.code === "HOLD_NOT_ENOUGH_STOCK" || data?.error === "HOLD_NOT_ENOUGH_STOCK") 
          && data?.data?.available != null) {
        throw new Error(`当前仅剩 ${data.data.available} 张票，请调整购买数量`);
      }
      
      throw new Error(errorMessage);
    }
    
    // ✅ 兼容新旧格式：data 可能嵌套在 data 字段中
    const result = data?.data || data;
    return {
      holdId: result.holdId,
      expireAt: result.expireAt,
    };
  }

  async function createOrder(holdId: string) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, tierId, qty, holdId }),
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      // ✅ 兼容新旧格式
      const errorMessage = data?.message || data?.error || "ORDER_FAILED";
      throw new Error(errorMessage);
    }
    
    // ✅ 兼容新旧格式
    const result = data?.data || data;
    return {
      orderId: result.orderId,
      status: result.status,
    };
  }

  async function handleSubmit() {
    if (isExpired) {
      alert("锁票已过期，请重新锁票或返回活动页重选。");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { holdId } = await createHold();
      const { orderId } = await createOrder(holdId);
      router.push(`/order/${orderId}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">确认订单</h1>

          {/* 倒计时 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">锁票剩余</span>
            <span
              className={`px-2 py-1 rounded font-mono text-sm
                ${msLeft < 60_000 ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-700"}`}
              aria-live="polite"
            >
              {mounted ? formatMMSS(msLeft) : "10:00"}
            </span>

            <button
              type="button"
              onClick={resetHold}
              className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
              title="重新开始 10 分钟锁票（演示）"
            >
              重新锁票
            </button>
          </div>
        </div>

        {/* 信息卡片 */}
        <div className="border rounded-xl p-4 mb-6">
          <div className="font-medium">{event.name}</div>
          <div className="text-sm text-gray-500">
            {event.city} · {event.venue} · {event.date} {event.time}
          </div>

          {/* 数量选择器 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-gray-700">
              票档：<span className="font-medium">{tier.name}</span>
            </div>
            <QuantityPicker value={qty} onChange={setQty} min={1} max={maxQty} />
          </div>

          <div className="mt-2 text-sm text-gray-500">
            单价：¥ {tier.price} · 库存：{tier.remaining} · 限购：每人最多 {maxQty} 张
          </div>

          <div className="mt-3 text-indigo-700 font-semibold">合计：¥ {total}</div>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded text-red-700 bg-red-50 text-sm">{errorMsg}</div>
        )}

        {/* 提交按钮 */}
        <button
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          disabled={isExpired || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "提交中..." : "提交订单"}
        </button>

        <div className="mt-4 p-3 rounded bg-indigo-50 text-indigo-800 text-sm leading-relaxed">
          说明：进入结算页即开始 10 分钟锁票倒计时（演示），刷新页面会延续本事件/票档的剩余时间。
          若倒计时结束，系统会释放锁票并跳回活动页。
        </div>
      </div>
    </main>
  );
}