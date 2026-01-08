// app/page.tsx - 主页
import { Suspense } from 'react';
import HomePage from './ui/HomePage';
import { HomePageSkeleton } from './ui/HomePageSkeleton';

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePage />
    </Suspense>
  );
}
