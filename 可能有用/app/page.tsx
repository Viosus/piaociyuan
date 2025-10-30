/**
 * 原始位置：C:\piaoyuzhou\app\page.tsx
 * 用途：根路径页面（可能重复）
 * 功能：显示热门活动列表，与 app/events/page.tsx 功能重复
 * 说明：现在主页已改为 /events，此文件可能不再需要
 */

// app/page.tsx
import Link from "next/link";
import { getAllEvents } from "@/lib/database";

export default async function HomePage() {
  const events = await getAllEvents();

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-indigo-600 mb-6 text-center">
        热门活动
      </h1>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-3 block"
          >
            <img
              src={event.cover}
              alt={event.name}
              className="rounded-lg w-full h-48 object-cover mb-3"
            />
            <h2 className="text-lg font-semibold">{event.name}</h2>
            <p className="text-gray-500">
              {event.city} · {event.date} {event.time}
            </p>
            <p className="mt-2 text-sm text-gray-400">{event.venue}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}