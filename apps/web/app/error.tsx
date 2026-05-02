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
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          页面出错了
        </h1>
        <p className="text-sm text-gray-600 mb-2 whitespace-pre-line break-words">
          {error.message || '很抱歉，页面遇到了一些问题。'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">错误代码：{error.digest}</p>
        )}
        {!error.digest && <div className="mb-6" />}
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#46467A] text-white rounded-lg font-medium hover:bg-[#3a3a6a] transition-colors"
          >
            重试
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
