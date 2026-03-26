'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[APP_ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😵</div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          页面出错了
        </h1>
        <p className="text-gray-500 mb-8">
          很抱歉，页面遇到了一些问题。请尝试刷新页面或返回首页。
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#46467A] text-white rounded-lg font-medium hover:bg-[#3a3a6a] transition-colors"
          >
            重新加载
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-[#46467A] text-[#46467A] rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
