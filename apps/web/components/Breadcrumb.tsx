/**
 * W-N4 面包屑组件
 *
 * 详情页（活动 / 帖子 / 用户主页）顶部展示路径，方便用户回退到列表层级。
 *
 * 用法：
 *   <Breadcrumb items={[
 *     { label: "宇宙信号", href: "/signals" },
 *     { label: "周杰伦演唱会" }, // 末项不传 href = 当前页
 *   ]} />
 */

import Link from "next/link";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="面包屑导航" className="text-xs text-[#1a1a1f]/60 mb-3 flex flex-wrap items-center gap-1">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <Fragment key={`${item.label}-${idx}`}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-[#46467A] hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "text-[#46467A] font-medium" : ""}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <svg
                className="w-3 h-3 flex-shrink-0 text-[#1a1a1f]/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
