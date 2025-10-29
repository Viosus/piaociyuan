import OrderClient from "./ui/OrderClient";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params; // App Router 的 params 是 Promise
  return <OrderClient id={id} />;
}
