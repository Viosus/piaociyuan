// app/api/pay/mock/route.ts
// 修复内容：
// 1. 优化操作顺序（先释放 hold，再更新订单）
// 2. 统一使用 normalizeId 处理 ID
// 3. 统一错误响应格式
// 4. 增强日志输出
// 5. 添加幂等性日志

import { NextResponse } from "next/server";
import { ordersMap, holdsMap, normalizeId } from "@/lib/store";
import { purgeExpiredHolds, ApiError } from "@/lib/inventory";

export async function POST(req: Request) {
  try {
    const now = Date.now();
    purgeExpiredHolds(now);

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

    // 2️⃣ 统一 ID 处理
    const normalizedOrderId = normalizeId(orderId);

    // 3️⃣ 验证订单存在性
    const order = ordersMap.get(normalizedOrderId);
    if (!order) {
      console.warn(
        `[PAY_FAIL] 订单不存在：orderId=${normalizedOrderId}`
      );
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_NOT_FOUND",
          message: "订单不存在或已被删除。",
        },
        { status: 404 }
      );
    }

    // 4️⃣ 幂等性：若已支付，直接返回成功
    if (order.status === "PAID") {
      console.log(
        `[PAY_IDEMPOTENT] 订单已支付，幂等返回成功：orderId=${normalizedOrderId}`
      );
      return NextResponse.json({
        ok: true,
        code: "ORDER_ALREADY_PAID",
        message: "订单已支付",
        data: {
          status: "PAID",
          paidAt: order.paidAt,
        },
      });
    }

    // 5️⃣ 验证来源 hold 是否仍有效
    const hold = holdsMap.get(order.holdId);
    if (!hold || hold.expireAt <= now) {
      console.warn(
        `[PAY_FAIL] hold 已过期或不存在：orderId=${normalizedOrderId}, holdId=${order.holdId}`
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

    // 6️⃣ 执行支付（优化操作顺序：先释放 hold，再更新订单）
    // 优点：即使更新订单失败，hold 也被释放，不会锁死库存
    console.log(
      `[PAY_START] orderId=${normalizedOrderId}, holdId=${order.holdId}, eventId=${order.eventId}, tierId=${order.tierId}, qty=${order.qty}`
    );

    // ✅ 第一步：先释放 hold（防止库存锁死）
    holdsMap.delete(order.holdId);

    // ✅ 第二步：再更新订单状态
    order.status = "PAID";
    order.paidAt = now;
    ordersMap.set(normalizedOrderId, order);

    console.log(
      `[PAY_SUCCESS] orderId=${normalizedOrderId}, paidAt=${now}, 已释放 holdId=${order.holdId}`
    );

    // 7️⃣ 返回成功
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