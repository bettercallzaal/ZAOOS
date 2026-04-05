'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  dismissing: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);
  // Track active timers so we can clean them up
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    // Trigger the exit animation first
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t))
    );
    // Remove from DOM after animation completes (0.2s)
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(`remove-${id}`);
    }, 200);
    timersRef.current.set(`remove-${id}`, removeTimer);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000) => {
      const id = String(++counterRef.current);
      setToasts((prev) => [...prev, { id, message, type, dismissing: false }]);

      // Auto-dismiss after duration
      const dismissTimer = setTimeout(() => {
        dismiss(id);
        timersRef.current.delete(`dismiss-${id}`);
      }, duration);
      timersRef.current.set(`dismiss-${id}`, dismissTimer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Toast List ───────────────────────────────────────────────────────────────

function ToastList({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Individual Toast Card ────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastType, string> = {
  success: 'bg-green-700/90 border-green-500/50 text-green-50',
  error:   'bg-red-700/90 border-red-500/50 text-red-50',
  info:    'bg-blue-700/90 border-blue-500/50 text-blue-50',
};

const VARIANT_ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-2.5 min-w-[220px] max-w-[320px]',
        'px-4 py-2.5 rounded-lg border shadow-lg backdrop-blur-sm',
        'text-sm pointer-events-auto',
        VARIANT_STYLES[toast.type],
        toast.dismissing ? 'animate-toast-out' : 'animate-toast-in',
      ].join(' ')}
    >
      {/* Icon */}
      <span className="mt-px shrink-0 font-semibold text-xs w-4 text-center leading-5">
        {VARIANT_ICONS[toast.type]}
      </span>

      {/* Message */}
      <span className="flex-1 leading-5">{toast.message}</span>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity leading-none mt-px"
      >
        ✕
      </button>
    </div>
  );
}
