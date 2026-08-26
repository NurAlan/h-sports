"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastAPI {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
  error: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
  info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
};

const BORDER: Record<ToastType, string> = {
  success: "border-green-200",
  error: "border-red-200",
  warning: "border-amber-200",
  info: "border-blue-200",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss]
  );

  // Stabilkan referensi api — mencegah infinite loop di useEffect consumer
  const api = useMemo<ToastAPI>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      warning: (m) => push("warning", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toaster — fixed di atas, z-index tinggi */}
      <div className="pointer-events-none fixed top-4 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${BORDER[t.type]}`}
          >
            {ICONS[t.type]}
            <p className="flex-1 text-sm font-medium text-foreground">
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Tutup notifikasi"
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return ctx;
}
