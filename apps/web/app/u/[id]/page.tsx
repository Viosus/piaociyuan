// app/u/[id]/page.tsx
import { Metadata } from 'next';
import { use } from 'react';
import UserProfileClient from './ui/UserProfileClient';

export const metadata: Metadata = {
  title: '用户主页 - 票次元',
  description: '查看用户的个人主页和动态',
};

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <UserProfileClient userId={id} />;
}
