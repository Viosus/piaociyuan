"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (type: ToastType, message: string, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_STYLES: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "rgba(70, 70, 122, 0.95)", icon: "✓" },
  error: { bg: "rgba(176, 60, 100, 0.95)", icon: "✕" },
  info: { bg: "rgba(70, 70, 122, 0.95)", icon: "i" },
  warning: { bg: "rgba(180, 130, 40, 0.95)", icon: "!" },
};

let counter = 0;
const nextId = () => `toast_${Date.now()}_${++counter}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, durationMs = 3000) => {
      const id = nextId();
      setItems((prev) => [...prev, { id, type, message }]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const value: ToastContextValue = {
    show,
    success: (m, d) => show("success", m, d),
    error: (m, d) => show("error", m, d),
    info: (m, d) => show("info", m, d),
    warning: (m, d) => show("warning", m, d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          top: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 9999,
          pointerEvents: "none",
          maxWidth: "min(90vw, 28rem)",
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: TYPE_STYLES[t.type].bg,
              color: "#ffffff",
              fontSize: "0.875rem",
              boxShadow:
                "0 10px 15px -3px rgba(70, 70, 122, 0.4), 0 0 20px rgba(70, 70, 122, 0.2)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 235, 245, 0.3)",
              cursor: "pointer",
              animation: "toastSlideIn 0.2s ease-out",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.25rem",
                height: "1.25rem",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.25)",
                fontSize: "0.75rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {TYPE_STYLES[t.type].icon}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
