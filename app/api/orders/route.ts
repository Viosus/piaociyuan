// app/api/orders/route.ts
// 修复内容：
// 1. 统一使用 normalizeId 处理 ID
// 2. 统一错误响应格式
// 3. 增强日志输出
// 4. 优化参数校验

import { NextResponse } from "next/server";
import { ordersMap, holdsMap, genId, normalizeId } from "@/lib/store";
import { purgeExpiredHolds, ApiError } from "@/lib/inventory";

// ✅ 列表查询：GET /api/orders?status=PENDING|PAID（可选）
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const result: any[] = [];

    for (const [, order] of ordersMap.entries()) {
      if (!statusFilter || order.status === statusFilter) {
        result.push({
          ok: true,
          orderId: order.orderId,
          eventId: order.eventId,
          tierId: order.tierId,
          qty: order.qty,
          status: order.status,
          createdAt: order.createdAt,
          paidAt: order.paidAt ?? null,
          holdId: order.holdId,
        });
      }
    }

    // 按创建时间倒序
    result.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      ok: true,
      data: result,
      total: result.length,
    });
  } catch (e: any) {
    console.error("[ORDER_LIST_ERROR]", e);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: "查询订单失败",
      },
      { status: 500 }
    );
  }
}

// ✅ 创建订单：POST /api/orders
export async function POST(req: Request) {
  try {
    const now = Date.now();
    purgeExpiredHolds(now);

    const body = await req.json().catch(() => ({}));
    const { eventId, tierId, qty, holdId } = body || {};

    // 1️⃣ 参数校验
    if (
      eventId == null ||
      tierId == null ||
      !holdId ||
      typeof qty !== "number" ||
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          message: "请求参数错误，请检查后重试。",
        },
        { status: 400 }
      );
    }

    // 2️⃣ 统一 ID 处理
    const normalizedEventId = normalizeId(eventId);
    const normalizedTierId = normalizeId(tierId);
    const normalizedHoldId = normalizeId(holdId);

    // 3️⃣ 验证 hold 存在性
    const hold = holdsMap.get(normalizedHoldId);
    if (!hold) {
      console.warn(
        `[ORDER_CREATE_FAIL] hold 不存在：holdId=${normalizedHoldId}`
      );
      return NextResponse.json(
        {
          ok: false,
          code: "HOLD_NOT_FOUND",
          message: "锁票不存在，请重新选择票档并下单。",
        },
        { status: 404 }
      );
    }

    // 4️⃣ 验证 hold 是否过期
    if (hold.expireAt <= now) {
      console.warn(
        `[ORDER_CREATE_FAIL] hold 已过期：holdId=${normalizedHoldId}, expireAt=${hold.expireAt}, now=${now}`
      );
      return NextResponse.json(
        {
          ok: false,
          code: "HOLD_EXPIRED",
          message: "锁票已过期，请重新选择票档并下单。",
        },
        { status: 410 }
      );
    }

    // 5️⃣ 一致性校验：eventId/tierId/qty 必须与 hold 完全一致
    if (
      hold.eventId !== normalizedEventId ||
      hold.tierId !== normalizedTierId ||
      hold.qty !== qty
    ) {
      console.warn(
        `[ORDER_CREATE_FAIL] 订单与锁票不一致：hold=${JSON.stringify(
          hold
        )}, request={eventId:${normalizedEventId}, tierId:${normalizedTierId}, qty:${qty}}`
      );
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_HOLD_MISMATCH",
          message: "订单信息与锁票不一致，请返回重新下单。",
        },
        { status: 400 }
      );
    }

    // 6️⃣ 创建订单
    const orderId = genId("O");
    const order = {
      orderId,
      eventId: normalizedEventId,
      tierId: normalizedTierId,
      qty: Number(qty),
      status: "PENDING" as const,
      createdAt: now,
      paidAt: null as number | null,
      holdId: normalizedHoldId,
    };

    ordersMap.set(orderId, order);

    console.log(
      `[ORDER_CREATE] orderId=${orderId}, eventId=${normalizedEventId}, tierId=${normalizedTierId}, qty=${qty}, holdId=${normalizedHoldId}`
    );

    // 7️⃣ 返回结果
    return NextResponse.json({
      ok: true,
      data: {
        orderId,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err: any) {
    console.error("[ORDER_CREATE_ERROR]", err);

    if (err instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: err.message,
          data: err.data,
        },
        { status: err.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "服务繁忙，请稍后重试。",
      },
      { status: 500 }
    );
  }
}