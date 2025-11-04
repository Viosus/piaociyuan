// app/api/holds/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeId } from "@/lib/store";
import {
  getTierCapacity,
  getPaidQty,
  getActiveHoldQty,
  purgeExpiredHolds,
  getAvailableQty,
  assertPositiveInt,
  createHoldWithLock,
  ApiError,
} from "@/lib/inventory";

type HoldBody = {
  eventId: number | string;
  tierId: number | string;
  qty: number;
};

// ✅ 创建锁票
export async function POST(req: Request) {
  try {
    const now = Date.now();

    // 1️⃣ 惰性清理过期 hold
    const purged = await purgeExpiredHolds(now);
    if (purged > 0) {
      console.log(`[HOLD_POST] 清理了 ${purged} 个过期锁票`);
    }

    const body = (await req.json().catch(() => ({}))) as HoldBody;
    const { eventId, tierId, qty } = body;

    // 2️⃣ 参数校验
    if (eventId == null || tierId == null) {
      return NextResponse.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          message: "请求参数错误，请检查后重试。",
        },
        { status: 400 }
      );
    }

    assertPositiveInt(qty, 10);

    // 3️⃣ 统一 ID 处理
    const normalizedEventId = normalizeId(eventId);
    const normalizedTierId = normalizeId(tierId);

    // 4️⃣ 使用乐观锁创建 hold
    const result = await createHoldWithLock(
      normalizedEventId,
      normalizedTierId,
      qty,
      now
    );

    if (!result) {
      const available = await getAvailableQty(normalizedEventId, normalizedTierId, now);
      return NextResponse.json(
        {
          ok: false,
          code: "HOLD_NOT_ENOUGH_STOCK",
          message: `当前可售 ${available} 张，请调整数量后重试。`,
          data: { available },
        },
        { status: 409 }
      );
    }

    // 5️⃣ 成功返回
    return NextResponse.json({
      ok: true,
      data: {
        holdId: result.holdId,
        expireAt: result.expireAt,
      },
    });
  } catch (e: unknown) {
    console.error("[HOLD_ERROR]", e);

    if (e instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          code: e.code,
          message: e.message,
          data: e.data,
        },
        { status: e.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: "服务繁忙，请稍后重试。",
      },
      { status: 500 }
    );
  }
}

// ✅ 诊断接口
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    const tierId = url.searchParams.get("tierId");
    const now = Date.now();

    if (!eventId || !tierId) {
      return NextResponse.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          message: "缺少 eventId 或 tierId",
        },
        { status: 400 }
      );
    }

    const normalizedEventId = normalizeId(eventId);
    const normalizedTierId = normalizeId(tierId);

    await purgeExpiredHolds(now);

    const capacity = await getTierCapacity(normalizedEventId, normalizedTierId);
    const paid = await getPaidQty(normalizedEventId, normalizedTierId);
    const activeHolds = await getActiveHoldQty(normalizedEventId, normalizedTierId, now);
    const available = Math.max(0, capacity - paid - activeHolds);

    // 查询所有相关的 holds
    const holds = await prisma.hold.findMany({
      where: {
        eventId: normalizedEventId,
        tierId: normalizedTierId,
      },
    });

    return NextResponse.json({
      ok: true,
      eventId: normalizedEventId,
      tierId: normalizedTierId,
      diagnostics: {
        capacity,
        paid,
        activeHolds,
        available,
        now,
        timestamp: new Date(now).toISOString(),
      },
      holds: holds.map((h: any) => ({
        holdId: h.id,
        qty: h.qty,
        expireAt: Number(h.expireAt),
        expired: Number(h.expireAt) <= now,
        createdAt: Number(h.createdAt),
      })),
    });
  } catch (e: unknown) {
    console.error("[HOLD_DIAGNOSTIC_ERROR]", e);

    if (e instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          code: e.code,
          message: e.message,
        },
        { status: e.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "诊断失败",
      },
      { status: 500 }
    );
  }
}