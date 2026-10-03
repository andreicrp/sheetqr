import React, { useEffect } from 'react';
import { Trash2, Ban, AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  iconType?: 'delete' | 'revoke' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  iconType = 'warning',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    if (iconType === 'delete') {
      return <Trash2 size={26} color="var(--accent-rose)" />;
    }
    if (iconType === 'revoke') {
      return <Ban size={26} color="var(--accent-rose)" />;
    }
    return <AlertTriangle size={26} color="var(--accent-amber)" />;
  };

  const getIconBg = () => {
    if (variant === 'danger') return 'var(--accent-rose-light)';
    if (variant === 'warning') return 'var(--accent-amber-light)';
    return 'var(--primary-light)';
  };

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '24rem',
          textAlign: 'center',
          padding: '1.75rem 1.25rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            right: '12px',
            top: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Icon Badge */}
        <div
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            background: getIconBg(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {getIcon()}
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
          {title}
        </h3>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => {
              navigator?.vibrate?.(10);
              onCancel();
            }}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              navigator?.vibrate?.([20, 40, 20]);
              onConfirm();
            }}
            className={`btn ${variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-secondary' : 'btn-primary'}`}
            style={{
              width: '100%',
              justifyContent: 'center',
              backgroundColor: variant === 'danger' ? 'var(--accent-rose)' : undefined,
              color: variant === 'danger' ? '#ffffff' : undefined,
            }}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
