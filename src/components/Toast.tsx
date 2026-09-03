import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError   = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  const accentColor = isError
    ? 'var(--accent-expense)'
    : isSuccess
    ? 'var(--accent-income)'
    : 'var(--text-secondary)';

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        id="app-toast-message"
        className="card animate-bounce-in"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          maxWidth: '28rem',
          width: '100%',
          borderLeft: `3px solid ${accentColor}`,
          boxShadow: `0 12px 32px -8px rgba(0,0,0,0.4), 0 0 0 1px var(--border-card)`,
        }}
      >
        <div style={{ flexShrink: 0, marginTop: '1px' }}>
          {isError   && <AlertCircle   size={17} style={{ color: accentColor }} />}
          {isSuccess && <CheckCircle2  size={17} style={{ color: accentColor }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '2px',
              color: accentColor,
            }}
          >
            {isError ? 'Ошибка' : isSuccess ? 'Успешно' : 'Уведомление'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {toast.text}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          style={{
            flexShrink: 0,
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.125rem',
            transition: 'color 0.15s',
          }}
          aria-label="Закрыть"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
