"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NFTAsset = {
  id: string;
  tokenId: number;
  contractAddress: string;
  metadataUri: string;
  currentOwnerAddress: string;
  mintedAt: string;
  order: {
    id: string;
    eventId: number;
    tierId: number;
  };
  event?: {
    id: number;
    name: string;
    venue: string;
    startTime: string;
  };
  tier?: {
    id: number;
    name: string;
    price: number;
  };
};

type MetadataAttribute = {
  trait_type: string;
  value: string | number;
  display_type?: string;
};

type NFTMetadata = {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: MetadataAttribute[];
};

export default function NFTDetailClient({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const { tokenId } = use(params);
  const router = useRouter();
  const [nft, setNft] = useState<NFTAsset | null>(null);
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "metadata" | "history">("details");

  useEffect(() => {
    fetchNFTDetail();
  }, [tokenId]);

  const fetchNFTDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/nft/assets/${tokenId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取NFT详情失败");
      }

      const data = await response.json();
      setNft(data.asset);

      // 尝试获取元数据
      if (data.asset.metadataUri) {
        try {
          const metadataUrl = data.asset.metadataUri.replace(
            "ipfs://",
            "https://gateway.pinata.cloud/ipfs/"
          );
          const metadataRes = await fetch(metadataUrl);
          if (metadataRes.ok) {
            const metadataData = await metadataRes.json();
            setMetadata(metadataData);
          }
        } catch (err) {
          console.error("获取元数据失败:", err);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  };

  const getBlockExplorerUrl = (type: "token" | "tx" | "address", value: string) => {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "80002";
    const baseUrl =
      chainId === "137"
        ? "https://polygonscan.com"
        : "https://amoy.polygonscan.com";

    switch (type) {
      case "token":
        return `${baseUrl}/token/${nft?.contractAddress}?a=${nft?.tokenId}`;
      case "tx":
        return `${baseUrl}/tx/${value}`;
      case "address":
        return `${baseUrl}/address/${value}`;
      default:
        return baseUrl;
    }
  };

  const getOpenSeaUrl = () => {
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "80002";
    const isMainnet = chainId === "137";
    const baseUrl = isMainnet
      ? "https://opensea.io"
      : "https://testnets.opensea.io";

    return `${baseUrl}/assets/${isMainnet ? "matic" : "amoy"}/${nft?.contractAddress}/${nft?.tokenId}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !nft) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">NFT不存在</h1>
          <p className="text-gray-600 mb-4">{error || "请返回重试"}</p>
          <Link
            href="/account/nfts"
            className="inline-block px-6 py-2 bg-[#EAF353] text-white rounded-lg hover:bg-[#FFC9E0]"
          >
            返回NFT列表
          </Link>
        </div>
      </main>
    );
  }

  const imageUrl = metadata?.image?.replace(
    "ipfs://",
    "https://gateway.pinata.cloud/ipfs/"
  ) || "/placeholder-nft.png";

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <Link
          href="/account/nfts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#EAF353] mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回NFT列表
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左侧：NFT图片 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
              <img
                src={imageUrl}
                alt={metadata?.name || `NFT #${nft.tokenId}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 快速操作 */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={getOpenSeaUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 90 90">
                  <path d="M45 0C20.151 0 0 20.151 0 45s20.151 45 45 45 45-20.151 45-45S69.849 0 45 0zm23.123 49.573L50.821 73.605c-.35.577-1.08.77-1.657.42l-17.21-10.395c-.577-.35-.77-1.08-.42-1.657L48.84 37.94c.35-.577 1.08-.77 1.657-.42l17.21 10.395c.577.35.77 1.08.42 1.657z" />
                </svg>
                OpenSea
              </a>
              <a
                href={getBlockExplorerUrl("token", "")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                区块浏览器
              </a>
            </div>
          </div>

          {/* 右侧：NFT信息 */}
          <div className="bg-white rounded-2xl shadow p-6">
            {/* 标题和描述 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-[#EAF353]">
                  {metadata?.name || `Token #${nft.tokenId}`}
                </h1>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                  #{nft.tokenId}
                </span>
              </div>
              {metadata?.description && (
                <p className="text-gray-600">{metadata.description}</p>
              )}
            </div>

            {/* 标签页 */}
            <div className="flex gap-4 border-b mb-4">
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-2 px-1 ${
                  activeTab === "details"
                    ? "border-b-2 border-[#EAF353] text-[#EAF353] font-semibold"
                    : "text-gray-500"
                }`}
              >
                详情
              </button>
              <button
                onClick={() => setActiveTab("metadata")}
                className={`pb-2 px-1 ${
                  activeTab === "metadata"
                    ? "border-b-2 border-[#EAF353] text-[#EAF353] font-semibold"
                    : "text-gray-500"
                }`}
              >
                属性
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2 px-1 ${
                  activeTab === "history"
                    ? "border-b-2 border-[#EAF353] text-[#EAF353] font-semibold"
                    : "text-gray-500"
                }`}
              >
                历史
              </button>
            </div>

            {/* 详情标签 */}
            {activeTab === "details" && (
              <div className="space-y-3">
                <DetailRow
                  label="合约地址"
                  value={nft.contractAddress}
                  copyable
                  onCopy={() => copyToClipboard(nft.contractAddress)}
                  link={getBlockExplorerUrl("address", nft.contractAddress)}
                />
                <DetailRow
                  label="Token ID"
                  value={nft.tokenId.toString()}
                  copyable
                  onCopy={() => copyToClipboard(nft.tokenId.toString())}
                />
                <DetailRow
                  label="当前持有者"
                  value={nft.currentOwnerAddress}
                  copyable
                  onCopy={() => copyToClipboard(nft.currentOwnerAddress)}
                  link={getBlockExplorerUrl("address", nft.currentOwnerAddress)}
                />
                <DetailRow
                  label="铸造时间"
                  value={new Date(nft.mintedAt).toLocaleString("zh-CN")}
                />
                <DetailRow
                  label="关联订单"
                  value={nft.order.id}
                  link={`/order/${nft.order.id}`}
                />
                {nft.event && (
                  <DetailRow
                    label="活动名称"
                    value={nft.event.name}
                    link={`/events/${nft.event.id}`}
                  />
                )}
                {nft.tier && (
                  <DetailRow
                    label="票档"
                    value={`${nft.tier.name} - ¥${nft.tier.price}`}
                  />
                )}
              </div>
            )}

            {/* 属性标签 */}
            {activeTab === "metadata" && (
              <div>
                {metadata?.attributes && metadata.attributes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {metadata.attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {attr.trait_type}
                        </div>
                        <div className="font-semibold text-gray-900">
                          {attr.display_type === "date"
                            ? new Date(
                                Number(attr.value) * 1000
                              ).toLocaleDateString("zh-CN")
                            : attr.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无属性数据
                  </div>
                )}
              </div>
            )}

            {/* 历史标签 */}
            {activeTab === "history" && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">铸造</div>
                    <div className="text-sm text-gray-500">
                      {new Date(nft.mintedAt).toLocaleString("zh-CN")}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      由平台铸造并转移至您的钱包
                    </div>
                  </div>
                </div>
                <div className="text-center py-4 text-gray-500 text-sm">
                  更多历史记录请在区块浏览器查看
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// 详情行组件
function DetailRow({
  label,
  value,
  copyable,
  onCopy,
  link,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
  link?: string;
}) {
  const shortValue =
    value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;

  return (
    <div className="flex items-start justify-between py-2 border-b last:border-0">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="flex items-center gap-2">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-[#EAF353] hover:underline"
            title={value}
          >
            {shortValue}
          </a>
        ) : (
          <span className="text-sm font-mono text-gray-900" title={value}>
            {shortValue}
          </span>
        )}
        {copyable && (
          <button
            onClick={onCopy}
            className="text-gray-400 hover:text-[#EAF353]"
            title="复制"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
