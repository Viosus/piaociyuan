"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Event = {
  id: number;
  name: string;
  city: string;
  venue: string;
  date: string;
  time: string;
};

type Tier = {
  id: number;
  name: string;
  price: number;
  remaining: number;
};

const DEFAULT_MAX_PER_USER = 2;
const PER_EVENT_LIMIT: Record<number, number> = {};

function getEnvMax(): number {
  const raw = process.env.NEXT_PUBLIC_MAX_PER_USER;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_PER_USER;
}

function formatMMSS(msLeft: number) {
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

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

type Props = {
  event: Event;
  tier: Tier;
  initialQty: number;
  urlLimit?: number;
};

export default function CheckoutClient({ event, tier, initialQty, urlLimit }: Props) {
  const router = useRouter();

  const perEventLimit = PER_EVENT_LIMIT[event.id];
  const baseLimit =
    Number.isFinite(urlLimit) && urlLimit! > 0
      ? urlLimit!
      : Number.isFinite(perEventLimit) && perEventLimit > 0
      ? perEventLimit
      : getEnvMax();

  const maxQty = Math.max(1, Math.min(baseLimit, tier.remaining));
  const [qty, setQty] = useState(() => {
    if (!Number.isFinite(initialQty) || initialQty < 1) return 1;
    return Math.min(maxQty, Math.max(1, initialQty));
  });

  const total = useMemo(() => tier.price * qty, [tier.price, qty]);

  const HOLD_MS = 10 * 60 * 1000;
  const holdKey = `pcy-hold-${event.id}-${tier.id}`;
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
      router.push(`/events/${event.id}`);
    }
  }, [isExpired, router, event.id, holdKey]);

  const resetHold = () => {
    const next = Date.now() + HOLD_MS;
    sessionStorage.setItem(holdKey, String(next));
    setExpireAt(next);
    expiredRef.current = false;
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function createHold() {
    const res = await fetch("/api/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, tierId: tier.id, qty }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = data?.message || data?.error || "HOLD_FAILED";

      if (
        (data?.code === "HOLD_NOT_ENOUGH_STOCK" || data?.error === "HOLD_NOT_ENOUGH_STOCK") &&
        data?.data?.available != null
      ) {
        throw new Error(`当前仅剩 ${data.data.available} 张票，请调整购买数量`);
      }

      throw new Error(errorMessage);
    }

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
      body: JSON.stringify({ eventId: event.id, tierId: tier.id, qty, holdId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = data?.message || data?.error || "ORDER_FAILED";
      throw new Error(errorMessage);
    }

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

        <div className="border rounded-xl p-4 mb-6">
          <div className="font-medium">{event.name}</div>
          <div className="text-sm text-gray-500">
            {event.city} · {event.venue} · {event.date} {event.time}
          </div>

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

        {errorMsg && (
          <div className="mb-3 p-3 rounded text-red-700 bg-red-50 text-sm">{errorMsg}</div>
        )}

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