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

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        id="app-toast-message"
        className="pointer-events-auto flex items-start gap-3 p-4 rounded-[18px] border shadow-2xl max-w-md w-full animate-bounce-in transition-all bg-[#161A23] backdrop-blur-xl"
        style={{
          borderColor: isError ? '#FF5252' : isSuccess ? '#00E676' : '#2A3142',
          boxShadow: isError
            ? '0 12px 30px -10px rgba(255,82,82,0.3)'
            : isSuccess
            ? '0 12px 30px -10px rgba(0,230,118,0.3)'
            : '0 12px 30px -10px rgba(0,0,0,0.6)',
        }}
      >
        <div className="shrink-0 mt-0.5">
          {isError && <AlertCircle size={18} className="text-[#FF5252]" />}
          {isSuccess && <CheckCircle2 size={18} className="text-[#00E676]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-bold font-mono uppercase tracking-wider mb-0.5"
            style={{ color: isError ? '#FF5252' : isSuccess ? '#00E676' : '#FFFFFF' }}
          >
            {isError ? 'Внимание' : isSuccess ? 'Успешно' : 'Уведомление'}
          </div>
          <div className="text-xs leading-relaxed text-white">
            {toast.text}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[#8A94A6] hover:text-white p-1 transition-colors cursor-pointer"
          aria-label="Закрыть"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
