import { NextResponse } from "next/server";

const g = globalThis as any;
g._orders = g._orders || new Map<string, any>();
g._holds = g._holds || new Map<string, any>();

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const order = g._orders.get(id);
  if (!order) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json(order);
}
