// app/api/events/[id]/route.ts
import { NextResponse } from "next/server";
import { getEventById } from "@/lib/database";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await getEventById(eventId);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (err: any) {
    console.error("[EVENT_GET_ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}