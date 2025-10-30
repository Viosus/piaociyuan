// app/account/collection/[id]/page.tsx
/**
 * 收藏品详情页
 */

import { Suspense } from 'react';
import BadgeDetailClient from './ui/BadgeDetailClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BadgeDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-white/60">加载中...</p>
              </div>
            </div>
          }
        >
          <BadgeDetailClient badgeId={id} />
        </Suspense>
      </div>
    </div>
  );
}
