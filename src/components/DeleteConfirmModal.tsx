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
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        id="delete-confirm-modal"
        className="card animate-bounce-in"
        style={{ width: '100%', maxWidth: 'min(22rem, calc(100vw - 2rem))', padding: '1.5rem' }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div
            style={{
              width: '2.5rem', height: '2.5rem',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--accent-expense-dim)',
              color: 'var(--accent-expense)',
              border: '1px solid var(--accent-expense-glow)',
            }}
          >
            <AlertTriangle size={18} strokeWidth={1.75} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              width: '2rem', height: '2rem',
              borderRadius: '50%',
              border: '1px solid var(--border-secondary)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
            }}
            aria-label="Закрыть"
          >
            <X size={14} />
          </button>
        </div>

        {/* Title */}
        <h3
          className="font-display"
          style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.375rem', letterSpacing: '-0.01em' }}
        >
          Удалить операцию?
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Это действие нельзя отменить. Запись будет удалена безвозвратно.
        </p>

        {/* Transaction preview */}
        <div
          style={{
            padding: '0.875rem',
            borderRadius: '16px',
            border: '1px solid var(--border-secondary)',
            background: 'var(--bg-elevated)',
            marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '2.25rem', height: '2.25rem',
                borderRadius: '12px',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: categoryMeta.bgColor,
                color: categoryMeta.color,
                border: `1px solid ${categoryMeta.color}22`,
              }}
            >
              <CategoryIcon size={16} strokeWidth={1.75} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                className="font-display"
                style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {transaction.category || 'Без категории'}
              </div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {formatDate(transaction.date)}{transaction.note ? ` • ${transaction.note}` : ''}
              </div>
            </div>
          </div>

          <div
            className="font-mono-num"
            style={{
              fontWeight: 700,
              fontSize: '0.875rem',
              color: isExpense ? 'var(--accent-expense)' : 'var(--accent-income)',
              flexShrink: 0,
              marginLeft: '0.5rem',
            }}
          >
            {isExpense ? '− ' : '+ '}
            {formatAmount(transaction.amount, transaction.currency)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-primary)',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              background: 'var(--accent-expense)',
              border: 'none',
              color: '#FFFFFF',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} strokeWidth={1.75} />
                <span>Удалить</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
