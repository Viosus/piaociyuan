"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WalletConnectButton as WalletConnect } from './WalletConnectButton';
import { MintNFTButton as MintButton } from './MintNFTButton';

// ============================================
// 类型定义
// ============================================

type WalletStatus = {
  connected: boolean;
  walletAddress?: string;
  walletType?: string;
  connectedAt?: string;
};

type NFTAsset = {
  id: string;
  tokenId: number;
  contractAddress: string;
  name: string;
  imageUrl: string;
  description: string;
  orderNumber: string;
  mintedAt: string;
  openseaUrl: string;
  explorerUrl: string;
};

// ============================================
// 1. 钱包连接按钮组件（导出独立组件）
// ============================================

export function WalletConnectButton() {
  return <WalletConnect />;
}

// ============================================
// 2. NFT铸造按钮组件（导出独立组件）
// ============================================

type MintNFTButtonProps = {
  ticketId: string;
  ticketStatus: string;
  nftMintStatus?: string | null;
};

export function MintNFTButton(props: MintNFTButtonProps) {
  return <MintButton {...props} />;
}

// ============================================
// 3. 我的NFT列表组件
// ============================================

export function MyNFTList() {
  const [nfts, setNfts] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNFTs();
  }, []);

  const fetchNFTs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("请先登录");
      }

      const response = await fetch("/api/nft/assets/my", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取NFT列表失败");
      }

      const data = await response.json();
      setNfts(data.assets);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <svg
          className="animate-spin h-8 w-8 mx-auto text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-600 mt-2">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="w-16 h-16 mx-auto text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-gray-600 mt-4 font-medium">还没有NFT</p>
        <p className="text-gray-500 text-sm mt-1">购买票品后可转为NFT收藏</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <Link
          key={nft.id}
          href={`/account/nfts/${nft.tokenId}`}
          className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white group cursor-pointer"
        >
          <div className="relative">
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-mono">
              #{nft.tokenId}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 group-hover:text-[#EAF353] transition-colors">
              {nft.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{nft.description}</p>

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500">订单号</span>
              <span className="font-mono text-xs truncate max-w-[120px]">
                {nft.orderNumber}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-500">铸造时间</span>
              <span className="text-gray-700">
                {new Date(nft.mintedAt).toLocaleDateString("zh-CN")}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-[#EAF353] text-sm font-medium">
              <span>查看详情</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============================================
// 4. 注意：OrderNFTSection 组件已废弃
// ============================================
// 现在NFT铸造改为基于票（Ticket）而不是订单（Order）
// 请在订单详情页面直接为每张票使用 MintNFTButton 组件
// 参考 app/order/[id]/ui/OrderClient.tsx

// ============================================
// 5. 声明全局的 window.ethereum
// ============================================

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
