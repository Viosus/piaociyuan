'use client';

import { useState, useEffect } from 'react';

interface MintNFTButtonProps {
  ticketId: string;
  ticketStatus: string;
  nftMintStatus?: string | null;
}

interface MintStatusResponse {
  mintStatus: string;
  nftTokenId?: number;
  nftContractAddress?: string;
  error?: string;
}

/**
 * 次元领取按钮组件
 * 验票后可领取对应的次元藏品（3D建模/AR数字艺术品）
 */
export function MintNFTButton({ ticketId, ticketStatus, nftMintStatus: initialStatus }: MintNFTButtonProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState(initialStatus || 'not_requested');
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);

  // 如果正在生成，定时查询状态
  useEffect(() => {
    if (mintStatus === 'pending' || mintStatus === 'minting') {
      const interval = setInterval(checkMintStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [mintStatus, ticketId]);

  const checkMintStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/nft/mint/status/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data: MintStatusResponse = await response.json();

      setMintStatus(data.mintStatus);
      if (data.nftTokenId) {
        setTokenId(data.nftTokenId);
      }
      if (data.error) {
        setError(data.error);
      }
    } catch {
      // 静默处理查询生成状态失败
    }
  };

  const handleMint = async () => {
    setIsMinting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('请先登录');
      }

      const response = await fetch('/api/nft/mint/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '领取请求失败');
      }

      setMintStatus('pending');
      alert('次元领取请求已提交！预计1-5分钟完成');

    } catch (err) {
      setError(err instanceof Error ? err.message : '领取失败');
    } finally {
      setIsMinting(false);
    }
  };

  // 票未验证（未验票无法领取次元）
  if (ticketStatus !== 'used') {
    return (
      <div className="text-sm text-gray-500">
        请先验票后才能领取次元藏品
      </div>
    );
  }

  // 已领取
  if (mintStatus === 'minted') {
    return (
      <div className="p-3 bg-green-50 border border-green-300 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="font-semibold text-green-800 text-sm">次元已领取</span>
        </div>
        {tokenId && (
          <p className="text-xs text-green-700">
            藏品编号: #{tokenId}
          </p>
        )}
      </div>
    );
  }

  // 领取中
  if (mintStatus === 'pending' || mintStatus === 'minting') {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span>⏳</span>
          <span className="font-semibold text-yellow-800 text-sm">次元领取中...</span>
        </div>
        <p className="text-xs text-yellow-700">
          预计1-5分钟完成，请稍候
        </p>
      </div>
    );
  }

  // 失败
  if (mintStatus === 'failed') {
    return (
      <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span>❌</span>
          <span className="font-semibold text-red-800 text-sm">领取失败</span>
        </div>
        {error && (
          <p className="text-xs text-red-700 mb-2">{error}</p>
        )}
        <button
          onClick={handleMint}
          disabled={isMinting}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          重试
        </button>
      </div>
    );
  }

  // 未领取，显示按钮
  return (
    <div className="space-y-1">
      <button
        onClick={handleMint}
        disabled={isMinting}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
      >
        {isMinting ? '提交中...' : '💎 领取次元'}
      </button>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default MintNFTButton;
