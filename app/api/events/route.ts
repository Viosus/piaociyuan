// app/api/events/route.ts
import { NextResponse } from "next/server";
import { getAllEvents } from "@/lib/database";

export async function GET() {
  try {
    const events = getAllEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("[EVENTS_API_ERROR]", error);
    return NextResponse.json(
      { error: "获取活动列表失败" },
      { status: 500 }
    );
  }
}