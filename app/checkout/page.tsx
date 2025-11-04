// app/checkout/page.tsx
import { getEventById, getTiersByEventId } from "@/lib/database";
import CheckoutClient from "./ui/CheckoutClient";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const eventId = Number(params.eventId || 0);
  const tierId = Number(params.tierId || 0);
  const initialQty = Number(params.qty || 1);
  const urlLimit = params.limit ? Number(params.limit) : undefined;

  if (isNaN(eventId) || isNaN(tierId)) {
    return (
      <div className="min-h-screen bg-[#C72471] flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-[#EAF353]">订单信息不完整</h1>
          <p className="text-[#282828]">请从活动详情页重新选择票档。</p>
          <Link href="/events" className="mt-4 inline-block text-[#EAF353] underline">
            返回活动列表
          </Link>
        </div>
      </div>
    );
  }

  const event = await getEventById(eventId);
  const tiers = await getTiersByEventId(eventId);
  const tier = tiers.find((t) => t.id === tierId);

  if (!event || !tier) {
    return (
      <div className="min-h-screen bg-[#C72471] flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-[#EAF353]">订单信息不完整</h1>
          <p className="text-[#282828]">请从活动详情页重新选择票档。</p>
          <Link href="/events" className="mt-4 inline-block text-[#EAF353] underline">
            返回活动列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CheckoutClient
      event={event}
      tier={tier}
      initialQty={initialQty}
      urlLimit={urlLimit}
    />
  );
}