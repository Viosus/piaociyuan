// app/api/pay/mock/route.ts
import { NextResponse } from "next/server";
import { getDB, getOrderById, getHoldById, updateOrderStatus } from "@/lib/database";
import { normalizeId } from "@/lib/store";
import { purgeExpiredHolds, ApiError } from "@/lib/inventory";

export async function POST(req: Request) {
  try {
    const now = Date.now();
    await purgeExpiredHolds(now);

    const body = await req.json().catch(() => ({}));
    const { orderId } = body || {};

    // 1️⃣ 参数校验
    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          message: "请求参数错误，请检查后重试。",
        },
        { status: 400 }
      );
    }

    const normalizedOrderId = normalizeId(orderId);

    // 2️⃣ 查询订单
    const order = getOrderById(normalizedOrderId);

    if (!order) {
      console.warn(`[PAY_FAIL] 订单不存在：orderId=${normalizedOrderId}`);
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_NOT_FOUND",
          message: "订单不存在或已被删除。",
        },
        { status: 404 }
      );
    }

    // 3️⃣ 幂等性：若已支付
    if (order.status === "PAID") {
      console.log(`[PAY_IDEMPOTENT] 订单已支付：orderId=${normalizedOrderId}`);
      return NextResponse.json({
        ok: true,
        code: "ORDER_ALREADY_PAID",
        message: "订单已支付",
        data: {
          status: "PAID",
          paidAt: Number(order.paidAt),
        },
      });
    }

    // 4️⃣ 验证 hold
    const hold = getHoldById(order.holdId);

    if (!hold || Number(hold.expireAt) <= now) {
      console.warn(`[PAY_FAIL] hold 已过期：orderId=${normalizedOrderId}`);
      return NextResponse.json(
        {
          ok: false,
          code: "HOLD_EXPIRED",
          message: "锁票已过期，请重新选择票档并下单。",
        },
        { status: 410 }
      );
    }

    // 5️⃣ 执行支付（先释放 hold，再更新订单）
    console.log(`[PAY_START] orderId=${normalizedOrderId}`);

    const db = getDB();
    
    // 删除 hold
    db.prepare('DELETE FROM holds WHERE id = ?').run(order.holdId);

    // 更新订单
    updateOrderStatus(normalizedOrderId, "PAID", now);

    console.log(`[PAY_SUCCESS] orderId=${normalizedOrderId}`);

    return NextResponse.json({
      ok: true,
      code: "PAY_SUCCESS",
      message: "支付成功",
      data: {
        status: "PAID",
        paidAt: now,
      },
    });
  } catch (err: any) {
    console.error("[PAY_ERROR]", err);

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