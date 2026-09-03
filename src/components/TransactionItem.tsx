import React from 'react';
import { Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { formatAmount, formatDate, getCategoryMeta } from '../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  showDelete?: boolean;
  onDeleteRequest?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  showDelete = false,
  onDeleteRequest,
}) => {
  const categoryMeta = getCategoryMeta(transaction.category, transaction.type);
  const CategoryIcon = categoryMeta.icon;
  const isIncome = transaction.type === 'income';

  const amountColor = isIncome ? 'var(--accent-income)' : 'var(--accent-expense)';
  const iconBg      = isIncome ? 'var(--accent-income-dim)' : 'var(--accent-expense-dim)';

  return (
    <div
      id={`transaction-item-${transaction.id}`}
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1rem',
        gap: '0.5rem',
      }}
    >
      {/* Left: Icon + Description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-icon)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBg,
            color: categoryMeta.color,
            border: `1px solid ${isIncome ? 'var(--accent-income-glow)' : 'var(--accent-expense-glow)'}`,
          }}
        >
          <CategoryIcon size={17} strokeWidth={1.75} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            className="font-display"
            style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {transaction.category || 'Без категории'}
          </div>
          <div
            className="font-mono-num"
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              overflow: 'hidden',
            }}
          >
            <span style={{ flexShrink: 0 }}>{formatDate(transaction.date)}</span>
            {transaction.note && (
              <>
                <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>•</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px', opacity: 0.75 }}>
                  {transaction.note}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount + Delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div
            className="font-mono-num"
            style={{
              fontWeight: 700,
              fontSize: '0.875rem',
              color: amountColor,
              letterSpacing: '-0.02em',
            }}
          >
            {isIncome ? '+\u202F' : '−\u202F'}
            {formatAmount(Math.abs(transaction.amount), transaction.currency)}
          </div>
          <div
            className="font-mono-num"
            style={{
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textAlign: 'right',
              marginTop: '1px',
            }}
          >
            {transaction.currency}
          </div>
        </div>

        {showDelete && onDeleteRequest && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(transaction);
            }}
            style={{
              width: '2rem',
              height: '2rem',
              marginLeft: '0.125rem',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'var(--accent-expense-dim)',
              color: 'var(--accent-expense)',
              opacity: 0.7,
              transition: 'opacity 0.15s',
            }}
            title="Удалить"
            aria-label="Удалить транзакцию"
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
};
