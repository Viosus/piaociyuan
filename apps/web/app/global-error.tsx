'use client';

/**
 * W-L4 根级错误边界
 *
 * 仅当 root layout 抛出错误时触发；必须自带 <html>/<body>，
 * 因为此时 layout.tsx 已经失败，框架不会再渲染它。
 *
 * Next.js 约定：global-error.tsx 在生产构建后才生效，开发模式下 Next.js
 * 会优先显示开发错误覆盖层。
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GLOBAL_ERROR]', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            background: '#E0DFFD',
            color: '#1a1a1f',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>😵</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              系统出错了
            </h1>
            <p style={{ color: '#666', marginBottom: 8, whiteSpace: 'pre-line' }}>
              {error.message || '应用根层级发生错误，请刷新或稍后再试。'}
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 24,
                  fontFamily: 'monospace',
                }}
              >
                错误代码：{error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '12px 24px',
                background: '#46467A',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
