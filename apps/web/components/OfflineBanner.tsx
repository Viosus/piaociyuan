"use client";

/**
 * W-T3 离线 banner
 *
 * 监听 navigator.onLine，离线时在顶部显示固定 banner 提示，
 * 网络恢复时显示 "已恢复" 1.5s 后自动消失。
 *
 * 注意：navigator.onLine 是 best-effort（依赖浏览器对网卡状态的判断），
 * 真实的 API 调用失败处理仍由各个 fetch 调用方负责（W-L4）。
 * 这个 banner 只是给用户最快速的视觉信号。
 */

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  // SSR 期间 navigator 不存在，初始值用 true（假设在线，避免 hydration mismatch）
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    // mount 后用真实的 navigator.onLine 同步
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 1500);
      return () => clearTimeout(t);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 在线 + 没在显示"已恢复" → 不渲染（零 DOM 影响）
  if (isOnline && !showRestored) return null;

  if (!isOnline) {
    return (
      <div
        role="alert"
        className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white text-sm py-2 px-4 text-center shadow-lg"
      >
        ⚠️ 网络连接已断开，部分功能不可用
      </div>
    );
  }

  // showRestored
  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[100] bg-green-500 text-white text-sm py-2 px-4 text-center shadow-lg transition-opacity"
    >
      ✓ 网络已恢复
    </div>
  );
}
