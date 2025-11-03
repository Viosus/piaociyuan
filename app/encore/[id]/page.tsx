// app/encore/[id]/page.tsx
import { Metadata } from 'next';
import PostDetailClient from './ui/PostDetailClient';
import { use } from 'react';

export const metadata: Metadata = {
  title: '帖子详情 - 票次元',
  description: '查看帖子详情',
};

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PostDetailClient postId={id} />;
}
