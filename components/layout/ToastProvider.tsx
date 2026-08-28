"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

/**
 * Transient confirmation for actions whose effect isn't visible on screen —
 * "Invitation resent", "Role changed". Actions that already confirm themselves
 * (a settings field showing "Saved.", a dialog with an explicit success state)
 * should keep their inline message: a toast in the corner is worse feedback
 * than one next to the control you just used.
 *
 * Errors stay inline too. A toast auto-dismisses, and a failure the user has to
 * read and act on shouldn't.
 */

export type ToastTone = "success" | "danger";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 5000;
/** Older toasts are dropped rather than stacking off the top of the viewport. */
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, tone }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DISMISS_MS),
      );
    },
    [dismiss],
  );

  // Timers outlive the toast only if the tree unmounts mid-flight.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface p-3 shadow-lg"
          >
            <span
              aria-hidden
              className={`mt-1 size-1.5 shrink-0 rounded-full ${
                t.tone === "danger" ? "bg-danger" : "bg-success"
              }`}
            />
            <p className="flex-1 text-[13px] font-medium text-foreground">
              {t.message}
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-hover"
            >
              <X className="size-3.5 text-foreground-muted" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
