"use client";

/**
 * W-N5 滚动回顶按钮
 *
 * 监听最近的 scroll container（默认 layout 里 ml-20 那个 div）滚动距离，
 * 超过 1 屏高度就显示。点击平滑滚到顶。
 *
 * 用法：在主内容容器内任意位置放一次 <ScrollToTop />。
 * 它会自动找最近的可滚动祖先（overflow-y-auto / scroll）。
 */

import { useEffect, useState, useRef } from "react";

const SHOW_THRESHOLD = 600; // 超过 600px 才显示，避免短页面也出现

export default function ScrollToTop({
  /** 自定义 scroll target；不传则自动找最近 overflow-y 容器 */
  scrollSelector,
}: {
  scrollSelector?: string;
}) {
  const [visible, setVisible] = useState(false);
  const targetRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    let target: HTMLElement | Window;
    if (scrollSelector) {
      const el = document.querySelector<HTMLElement>(scrollSelector);
      target = el || window;
    } else {
      // layout.tsx 的主内容容器：ml-20 + overflow-y-auto
      const el = document.querySelector<HTMLElement>(
        "div.overflow-y-auto.ml-20, div.ml-20.overflow-y-auto"
      );
      target = el || window;
    }
    targetRef.current = target;

    const getScrollTop = () =>
      target === window
        ? window.scrollY
        : (target as HTMLElement).scrollTop;

    const handleScroll = () => {
      setVisible(getScrollTop() > SHOW_THRESHOLD);
    };

    handleScroll();
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [scrollSelector]);

  const handleClick = () => {
    const target = targetRef.current;
    if (!target) return;
    if (target === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      (target as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="返回顶部"
      title="返回顶部"
      className="fixed bottom-8 right-[calc(var(--right-sidebar-width,64px)+1.5rem)] z-30 w-11 h-11 rounded-full bg-[#46467A] text-white shadow-lg hover:bg-[#5A5A8E] transition-all hover:-translate-y-0.5 flex items-center justify-center"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
}
