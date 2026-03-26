import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-[#46467A] mb-4">404</div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          页面不存在
        </h1>
        <p className="text-gray-500 mb-8">
          您访问的页面可能已被移除、更名或暂时不可用。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#46467A] text-white rounded-lg font-medium hover:bg-[#3a3a6a] transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
