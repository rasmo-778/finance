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

  return (
    <div
      id={`transaction-item-${transaction.id}`}
      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-[20px] border border-[#222734] bg-[#161A23] transition-all duration-200"
    >
      {/* Left: Icon & Description */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border border-[#2A3142] transition-transform group-hover:scale-105"
          style={{
            backgroundColor: '#1E2330',
            color: isIncome ? '#00E676' : '#FF5252',
          }}
        >
          <CategoryIcon size={18} />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-bold font-display truncate leading-tight text-white">
            {transaction.category || 'Без категории'}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[11px] font-mono-num truncate text-[#8A94A6]">
            <span>{formatDate(transaction.date)}</span>
            {transaction.note && (
              <>
                <span className="text-[#555F73]">•</span>
                <span className="truncate max-w-[130px] opacity-75">{transaction.note}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div
            className="text-sm sm:text-base font-bold font-mono-num tracking-tight"
            style={{
              color: isIncome ? '#00E676' : '#FF5252',
            }}
          >
            {isIncome ? '+ ' : '− '}
            {formatAmount(Math.abs(transaction.amount), transaction.currency)}
          </div>
          <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-right text-[#555F73]">
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
            className="w-8 h-8 ml-1 rounded-full flex items-center justify-center transition-all opacity-70 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer bg-[rgba(255,82,82,0.15)] text-[#FF5252]"
            title="Удалить"
            aria-label="Удалить транзакцию"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
