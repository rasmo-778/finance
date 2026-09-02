import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Transaction } from '../types';
import { formatAmount, formatDate, getCategoryMeta } from '../utils/formatters';

interface DeleteConfirmModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  transaction,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !transaction) return null;

  const categoryMeta = getCategoryMeta(transaction.category, transaction.type);
  const CategoryIcon = categoryMeta.icon;
  const isExpense = transaction.type === 'expense';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        id="delete-confirm-modal"
        className="w-full max-w-sm rounded-[24px] p-6 border border-[#222734] bg-[#161A23] shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[rgba(255,82,82,0.15)] text-[#FF5252] border border-[rgba(255,82,82,0.25)]">
            <AlertTriangle size={20} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1E2330] text-[#8A94A6] hover:text-white transition-colors cursor-pointer border border-[#2A3142]"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold font-display tracking-tight mb-1.5 text-white">
          Удалить операцию?
        </h3>
        <p className="text-xs mb-4 leading-relaxed text-[#8A94A6]">
          Это действие нельзя отменить. Запись будет удалена безвозвратно.
        </p>

        {/* Transaction Summary Card */}
        <div className="p-3.5 rounded-[16px] border border-[#2A3142] bg-[#1E2330] mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-[#2A3142]"
              style={{
                backgroundColor: '#161A23',
                color: categoryMeta.color,
              }}
            >
              <CategoryIcon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate text-white">
                {transaction.category || 'Без категории'}
              </div>
              <div className="text-[11px] font-mono text-[#8A94A6]">
                {formatDate(transaction.date)} {transaction.note ? `• ${transaction.note}` : ''}
              </div>
            </div>
          </div>
          <div
            className="text-sm font-bold font-mono-num text-right shrink-0"
            style={{
              color: isExpense ? '#FF5252' : '#00E676',
            }}
          >
            {isExpense ? '− ' : '+ '}
            {formatAmount(transaction.amount, transaction.currency)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-[14px] text-xs font-bold font-display bg-[#1E2330] border border-[#2A3142] text-white hover:bg-[#252C3D] transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-[14px] text-xs font-bold font-display flex items-center justify-center gap-2 bg-[#FF5252] text-white hover:bg-[#FF3333] transition-transform active:scale-95 cursor-pointer shadow-md"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Удалить</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
