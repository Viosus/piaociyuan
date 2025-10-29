import Link from "next/link";
import { mockEvents } from "@/lib/mock";

export default function EventsPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      {/* 顶部导航 */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-indigo-600">热门活动</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/account/orders"
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-white"
          >
            我的订单
          </Link>
        </div>
      </div>

      {/* 活动卡片 */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockEvents.map((event) => (
          <Link
            key={event.id}
            href={`/events/${encodeURIComponent(String(event.id))}`}
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
