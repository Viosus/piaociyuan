// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // 直接重定向到活动列表页
  redirect('/events');
}
