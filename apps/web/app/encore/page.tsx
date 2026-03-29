// app/encore/page.tsx
/**
 * 安可区 - 社交主页
 */

import { Suspense } from 'react';
import EncoreClient from './ui/EncoreClient';

export default function EncorePage() {
  return (
    <div className="min-h-screen pb-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#46467A] via-[#E0DFFD] to-blue-400 bg-clip-text text-transparent mb-2">
            🔥 安可区
          </h1>
          <p className="text-white/60">分享你的演出时刻，发现更多精彩瞬间</p>
        </div>

        {/* 内容区域 */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46467A] mx-auto mb-4"></div>
                <p className="text-white/60">加载中...</p>
              </div>
            </div>
          }
        >
          <EncoreClient />
        </Suspense>
      </div>
    </div>
  );
}
