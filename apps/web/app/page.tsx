// app/page.tsx - 主页
import { Suspense } from 'react';
import HomePage from './ui/HomePage';
import { HomePageSkeleton } from './ui/HomePageSkeleton';

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePage />
    </Suspense>
  );
}
