import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { Toast, ToastType } from '../../types';
import { TOAST_DURATION } from '../../utils/constants';

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  updateToast: (id: string, message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const autoDismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = autoDismissTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      autoDismissTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = TOAST_DURATION) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss. Track the timer so it can be cleared on manual dismiss or
    // unmount, preventing a setState-after-unmount on a torn-down provider.
    if (duration > 0) {
      const timer = setTimeout(() => {
        autoDismissTimersRef.current.delete(id);
        dismissToast(id);
      }, duration);
      autoDismissTimersRef.current.set(id, timer);
    }

    return id;
  }, [dismissToast]);

  // Clear all pending auto-dismiss timers when the provider unmounts.
  useEffect(() => {
    const timers = autoDismissTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const updateToast = useCallback((id: string, message: string, type: ToastType = 'info') => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, message, type } : toast))
    );
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const value = useMemo(
    () => ({ toasts, showToast, updateToast, dismissToast, success, error, info, warning }),
    [toasts, showToast, updateToast, dismissToast, success, error, info, warning],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}


