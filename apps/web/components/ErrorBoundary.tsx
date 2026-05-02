"use client";

/**
 * W-L4 全局错误边界
 *
 * 用于包裹页面 / 关键 section，捕获渲染期 + lifecycle 抛出的错误，
 * 显示友好提示 + 重试按钮（reset 内部 state，重渲染 children）。
 *
 * 不捕获：异步 effect 错误、事件 handler 错误（这些走 toast）。
 *
 * 用法：
 *   <ErrorBoundary>
 *     <SomeRiskyClient />
 *   </ErrorBoundary>
 */

import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  /** 自定义 fallback；不传时用默认卡片 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** 错误上报回调（可接 Sentry 等） */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <DefaultFallback error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="min-h-[40vh] flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#FFEBF5] shadow p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#1a1a1f] mb-1">页面出错了</h2>
        <p className="text-sm text-[#1a1a1f]/60 mb-4">
          {error.message || "发生未知错误"}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-sm bg-[#46467A] text-white rounded-lg hover:bg-[#5A5A8E] transition"
          >
            重试
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            刷新页面
          </button>
        </div>
      </div>
    </div>
  );
}
