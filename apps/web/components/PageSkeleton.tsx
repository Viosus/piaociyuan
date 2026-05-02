/**
 * W-N3 路由切换骨架屏
 *
 * 给 Next.js App Router 的 loading.tsx 用——切路由时立即显示，
 * 替代默认白屏。
 *
 * 提供两个变种：
 *   - <PageSkeleton />: 通用占位（顶部一行 + 主体卡片网格）
 *   - <ListSkeleton rows={N} />: 纯列表占位
 */

interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

export function ListSkeleton({ rows = 6, className = "" }: ListSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-2xl bg-white/50 backdrop-blur-sm border border-[#FFEBF5] animate-pulse"
          aria-hidden
        />
      ))}
    </div>
  );
}

interface CardGridSkeletonProps {
  columns?: number;
  rows?: number;
}

export function CardGridSkeleton({
  columns = 3,
  rows = 2,
}: CardGridSkeletonProps) {
  const cells = columns * rows;
  const gridClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid ${gridClass} gap-4`}>
      {Array.from({ length: cells }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/50 backdrop-blur-sm border border-[#FFEBF5] overflow-hidden animate-pulse"
          aria-hidden
        >
          <div className="h-48 bg-white/40" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-white/40" />
            <div className="h-3 w-1/2 rounded bg-white/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="正在加载"
      className="max-w-6xl mx-auto px-4 py-6 space-y-6"
    >
      <div className="h-8 w-48 rounded-full bg-white/50 animate-pulse" />
      <CardGridSkeleton />
    </div>
  );
}
