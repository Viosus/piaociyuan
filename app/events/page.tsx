// app/events/page.tsx
import Link from "next/link";
import { getAllEvents } from "@/lib/database";

export default async function EventsPage() {
  const events = await getAllEvents();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent">
          热门活动
        </h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${encodeURIComponent(String(event.id))}`}
            className="bg-white border border-[#FFEBF5] rounded-xl hover:border-[#FFE3F0] hover:shadow-lg transition p-3 block group"
          >
            <img
              src={event.cover}
              alt={event.name}
              className="rounded-lg w-full h-48 object-cover mb-3 group-hover:scale-105 transition-transform"
            />
            <h2 className="text-lg font-bold item-name">{event.name}</h2>
            <p className="text-[#282828]">
              {event.city} · {event.date} {event.time}
            </p>
            <p className="mt-2 text-sm text-[#282828] opacity-80">{event.venue}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}