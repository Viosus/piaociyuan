"use client";

/**
 * W-T4 危险操作确认弹窗
 *
 * 替代原生 window.confirm()，提供视觉一致 + 可定制的危险操作确认 UX。
 *
 * 两种使用方式：
 * 1. 受控组件：<ConfirmDialog open onConfirm onCancel>
 * 2. 命令式 hook：const confirm = useConfirm(); await confirm({title, message})
 *    返回 Promise<boolean>，便于在事件 handler 里直接 if (await confirm(...))
 *
 * 视觉特点：
 * - 居中遮罩 + 卡片
 * - 支持 danger=true 时主按钮变红
 * - 按 ESC 取消、点遮罩取消、Tab focus 到取消按钮
 */

import { useEffect, useRef, useState, createContext, useContext, useCallback, ReactNode } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "确认操作",
  message,
  confirmText = "确认",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // 自动 focus 到取消按钮（避免误确认）
    cancelButtonRef.current?.focus();

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-[#1a1a1f] mb-3">
          {title}
        </h2>
        <p className="text-sm text-gray-700 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white transition ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#46467A] hover:bg-[#5A5A8E]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 命令式 hook 模式 ──────────────────────────────────────────────────
// 用法：
//   const confirm = useConfirm();
//   if (await confirm({ message: '确定删除？', danger: true })) { /* do delete */ }

interface ConfirmContextValue {
  request: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions | null;
    resolve: ((v: boolean) => void) | null;
  }>({ opts: null, resolve: null });

  const request = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ opts, resolve });
    });
  }, []);

  const close = (result: boolean) => {
    state.resolve?.(result);
    setState({ opts: null, resolve: null });
  };

  return (
    <ConfirmContext.Provider value={{ request }}>
      {children}
      {state.opts && (
        <ConfirmDialog
          open
          {...state.opts}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within <ConfirmProvider>");
  }
  return ctx.request;
}
