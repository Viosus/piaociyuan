'use client';

import { useState, useEffect } from 'react';

interface WalletStatus {
  connected: boolean;
  walletAddress: string | null;
}

/**
 * 钱包连接按钮组件
 * 用于模式2：用户主动连接钱包
 */
export function WalletConnectButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否已绑定钱包
  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/nft/wallet/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data: WalletStatus = await response.json();
      if (data.connected && data.walletAddress) {
        setWalletAddress(data.walletAddress);
      }
    } catch (err) {
      console.error('检查钱包状态失败:', err);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // 1. 检查MetaMask
      if (!window.ethereum) {
        throw new Error('请先安装MetaMask钱包');
      }

      // 2. 请求连接
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];
      const address = accounts[0];

      // 3. 生成签名消息
      const message = `绑定钱包到账户\n时间戳: ${Date.now()}`;

      // 4. 请求签名
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      }) as string;

      // 5. 发送到后端绑定
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('请先登录');
      }

      const response = await fetch('/api/nft/wallet/bind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          walletAddress: address,
          signature: signature,
          message: message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '绑定失败');
      }

      setWalletAddress(address);
      alert('钱包绑定成功！');

    } catch (err) {
      console.error('连接钱包错误:', err);
      setError(err instanceof Error ? err.message : '连接失败');
    } finally {
      setIsConnecting(false);
    }
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-lg">
        <span className="text-green-600">✓</span>
        <span className="text-sm font-medium text-green-700">
          已连接: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        {isConnecting ? '连接中...' : '🔗 连接钱包'}
      </button>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-500">
        连接钱包后可将您的票转为NFT
      </p>
    </div>
  );
}

export default WalletConnectButton;
