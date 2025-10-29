// app/events/[id]/page.tsx
import Link from "next/link";
import { getEventById, getTiersByEventId } from "@/lib/database";

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const eventId = Number(id);

  if (isNaN(eventId)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">活动 ID 无效</h1>
          <Link href="/events" className="text-indigo-600 underline">
            返回活动列表
          </Link>
        </div>
      </main>
    );
  }

  const event = await getEventById(eventId);
  const tiers = await getTiersByEventId(eventId);

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">活动不存在</h1>
          <Link href="/events" className="text-indigo-600 underline">
            返回活动列表
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="relative">
        <img
          src={event.cover}
          alt={event.name}
          className="w-full h-64 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 md:left-8 text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow">
            {event.name}
          </h1>
          <p className="mt-1 text-sm md:text-base opacity-90">
            {event.city} · {event.venue} · {event.date} {event.time}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-3">演出简介</h2>
          <p className="text-gray-700 leading-relaxed">{event.desc}</p>
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg text-indigo-800 text-sm">
            温馨提示：本场支持实名电子票入场；每个手机号限购 2 张；锁票 10 分钟未支付将自动释放。
          </div>
        </div>

        <aside className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-3">选择票档</h2>

          {tiers.length === 0 ? (
            <div className="border rounded-lg p-4 text-gray-500">
              暂无票档可售，请稍后再试。
            </div>
          ) : (
            <div className="space-y-3">
              {tiers.map((t) => (
                <div
                  key={t.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-gray-500">剩余 {t.remaining} 张</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">¥ {t.price}</div>
                    <Link
                      href={`/checkout?eventId=${encodeURIComponent(String(event.id))}&tierId=${encodeURIComponent(String(t.id))}&qty=1`}
                      className="inline-block mt-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
                    >
                      立即购票
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}