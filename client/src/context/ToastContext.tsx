'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X, TriangleAlert } from 'lucide-react';
import { cx } from '@/lib/utils';
import styles from '@/components/ui/ToastViewport/ToastViewport.module.css';

type ToastTone = 'success' | 'error' | 'warning' | 'neutral';

interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface Toast extends Required<Omit<ToastInput, 'description'>> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  notify: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneIcon = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  neutral: Info,
} satisfies Record<ToastTone, typeof Info>;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    const durationMs = toast.durationMs ?? 4200;

    setToasts((current) => [
      {
        id,
        title: toast.title,
        description: toast.description,
        tone: toast.tone ?? 'neutral',
        durationMs,
      },
      ...current,
    ].slice(0, 4));

    if (durationMs > 0) {
      window.setTimeout(() => dismiss(id), durationMs);
    }

    return id;
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(() => ({ notify, dismiss }), [dismiss, notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="region" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];

          return (
            <div
              key={toast.id}
              className={cx(styles.toast, styles[toast.tone])}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
            >
              <Icon size={18} aria-hidden="true" />
              <div className={styles.copy}>
                <strong>{toast.title}</strong>
                {toast.description && <span>{toast.description}</span>}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
