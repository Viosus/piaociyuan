import NFTDetailClient from "./ui/NFTDetailClient";

export const metadata = {
  title: "NFT详情 - 票次元",
  description: "查看NFT详细信息",
};

export default function NFTDetailPage({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  return <NFTDetailClient params={params} />;
}
