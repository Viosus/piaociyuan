import Link from "next/link";
import { ReactNode } from "react";

interface SectionContainerProps {
  title: string;
  subtitle?: string;
  icon?: string;
  moreLink?: string;
  moreLinkText?: string;
  children: ReactNode;
  bgGradient?: string;
}

export default function SectionContainer({
  title,
  subtitle,
  icon,
  moreLink,
  moreLinkText = "查看更多",
  children,
  bgGradient = "from-purple-50 to-pink-50",
}: SectionContainerProps) {
  return (
    <section className={`rounded-2xl bg-gradient-to-br ${bgGradient} p-8 mb-8`}>
      {/* 栏目头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#46467A] flex items-center gap-2">
            {icon && <span className="text-3xl">{icon}</span>}
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
        </div>
        {moreLink && (
          <Link
            href={moreLink}
            className="px-5 py-2 bg-white/80 hover:bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:shadow-md transition-all flex items-center gap-1"
          >
            <span>{moreLinkText}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* 栏目内容 */}
      <div>{children}</div>
    </section>
  );
}
