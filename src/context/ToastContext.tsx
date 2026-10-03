import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, description?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, description?: string) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, description }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast"
            style={{
              borderColor:
                toast.type === 'success'
                  ? 'var(--primary)'
                  : toast.type === 'error'
                  ? 'var(--accent-rose)'
                  : toast.type === 'warning'
                  ? 'var(--accent-amber)'
                  : 'var(--accent-blue)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={20} color="var(--primary)" />}
            {toast.type === 'error' && <AlertCircle size={20} color="var(--accent-rose)" />}
            {toast.type === 'warning' && <AlertCircle size={20} color="var(--accent-amber)" />}
            {toast.type === 'info' && <Info size={20} color="var(--primary)" />}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{toast.message}</div>
              {toast.description && (
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {toast.description}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
