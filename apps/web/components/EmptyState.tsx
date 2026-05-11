/**
 * W-L3 空状态友好提示
 *
 * 列表为空时统一展示：图标 + 标题 + 副文 + （可选）行动按钮。
 * 替代之前 27+ 处自由发挥的 "暂无 / 还没有 ..." 段落，统一视觉。
 *
 * 用法：
 *   <EmptyState
 *     icon="📭"
 *     title="还没有动态"
 *     description="第一个发动态的人，就是你了"
 *     action={{ label: "去发动态", onClick: () => router.push('/encore') }}
 *   />
 */

import { ReactNode } from "react";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  /** emoji 或自定义 icon node */
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** 自定义间距 / 高度，默认 py-12 */
  className?: string;
}

export default function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`text-center py-12 px-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#FFEBF5] ${className}`}
    >
      <div className="text-5xl mb-3" aria-hidden>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-foreground-soft mb-4 whitespace-pre-line">
          {description}
        </p>
      )}
      {action && (action.href ? (
        <a
          href={action.href}
          className="inline-block px-5 py-2 bg-[#46467A] text-white text-sm rounded-full hover:bg-[#5A5A8E] transition"
        >
          {action.label}
        </a>
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          className="px-5 py-2 bg-[#46467A] text-white text-sm rounded-full hover:bg-[#5A5A8E] transition"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
