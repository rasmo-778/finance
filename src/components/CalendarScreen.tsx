import React, { useState, useMemo } from 'react';
import { Clock, Inbox, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';
import { TransactionItem } from './TransactionItem';
import { formatAmount, parseDateSafe, toLocalISODate } from '../utils/formatters';

interface CalendarScreenProps {
  transactions: Transaction[];
  isLoading: boolean;
  dateFrom: string;
  dateTo: string;
  onChangeDateRange: (from: string, to: string) => void;
  onRefresh?: () => void;
  onDeleteRequest: (tx: Transaction) => void;
}

type TabKey = 'today' | 'week' | 'month' | 'custom';

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  transactions,
  isLoading,
  dateFrom,
  dateTo,
  onChangeDateRange,
  onRefresh,
  onDeleteRequest,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('month');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // ignore
    }
  };

  const handleSelectTab = (tab: TabKey) => {
    triggerHaptic();
    setActiveTab(tab);
    const now = new Date();

    if (tab === 'today') {
      const todayStr = toLocalISODate(now);
      onChangeDateRange(todayStr, todayStr);
    } else if (tab === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 6);
      onChangeDateRange(toLocalISODate(weekAgo), toLocalISODate(now));
    } else if (tab === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onChangeDateRange(toLocalISODate(firstDay), toLocalISODate(lastDay));
    }
  };

  // Robust client-side filtering by local date & time boundaries
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let customStart: Date | null = null;
    let customEnd: Date | null = null;

    if (dateFrom) {
      const p = dateFrom.split('-');
      if (p.length === 3) {
        customStart = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 0, 0, 0, 0);
      }
    }
    if (dateTo) {
      const p = dateTo.split('-');
      if (p.length === 3) {
        customEnd = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 23, 59, 59, 999);
      }
    }

    return transactions.filter((tx) => {
      // 1. Filter by transaction type
      if (filterType === 'expense' && tx.type !== 'expense') return false;
      if (filterType === 'income' && tx.type !== 'income') return false;

      // 2. Filter by date
      const txDate = parseDateSafe(tx.date);
      if (!txDate) return true; // Keep if unparseable

      if (activeTab === 'today') {
        return txDate >= todayStart && txDate <= todayEnd;
      } else if (activeTab === 'week') {
        return txDate >= weekStart && txDate <= todayEnd;
      } else if (activeTab === 'month') {
        return txDate >= monthStart && txDate <= monthEnd;
      } else if (activeTab === 'custom') {
        if (customStart && txDate < customStart) return false;
        if (customEnd && txDate > customEnd) return false;
        return true;
      }

      return true;
    });
  }, [transactions, filterType, activeTab, dateFrom, dateTo]);

  // Calculate totals for current view per currency
  const periodTotalsByCurrency = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    filteredTransactions.forEach((tx) => {
      const c = (tx.currency || 'UZS').toUpperCase();
      if (!map.has(c)) map.set(c, { income: 0, expense: 0 });
      if (tx.type === 'income') {
        map.get(c)!.income += Math.abs(tx.amount);
      } else {
        map.get(c)!.expense += Math.abs(tx.amount);
      }
    });
    return Array.from(map.entries()).map(([currency, totals]) => ({
      currency,
      ...totals,
    }));
  }, [filteredTransactions]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Title & Actions */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-bold font-display tracking-tight text-white">
            Календарь
          </h1>
          <p className="text-xs font-mono text-[11px] text-[#8A94A6]">
            История и выбор периода
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onRefresh();
              }}
              disabled={isLoading}
              className={`w-9 h-9 rounded-full bg-[#1E2330] border border-[#2A3142] text-[#8A94A6] hover:text-white flex items-center justify-center transition-all cursor-pointer ${
                isLoading ? 'opacity-50' : 'hover:scale-105 active:scale-95'
              }`}
              title="Обновить данные"
              aria-label="Обновить данные"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}

          <div className="px-3 py-1.5 rounded-full border border-[#2A3142] bg-[#1E2330] text-xs font-mono font-bold flex items-center gap-1.5 text-[#8A94A6]">
            <Clock size={13} />
            <span>{filteredTransactions.length} записей</span>
          </div>
        </div>
      </div>

      {/* Period Summary Cards at the Top */}
      {periodTotalsByCurrency.length > 0 && (
        <div className="space-y-3">
          {periodTotalsByCurrency.map((total) => (
            <div key={total.currency} className="grid grid-cols-2 gap-3">
              {/* Expense card */}
              <div className="p-4 rounded-[20px] border border-[#222734] bg-[#161A23] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[rgba(255,82,82,0.15)] text-[#FF5252]">
                  <ArrowUpRight size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8A94A6]">
                    Расходы
                  </div>
                  <div className="text-xs sm:text-sm font-bold font-mono-num truncate text-[#FF5252]">
                    −{formatAmount(total.expense, total.currency)}
                  </div>
                </div>
              </div>

              {/* Income card */}
              <div className="p-4 rounded-[20px] border border-[#222734] bg-[#161A23] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[rgba(0,230,118,0.15)] text-[#00E676]">
                  <ArrowDownRight size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8A94A6]">
                    Доходы
                  </div>
                  <div className="text-xs sm:text-sm font-bold font-mono-num truncate text-[#00E676]">
                    +{formatAmount(total.income, total.currency)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date Range Selection Card */}
      <div className="p-4 rounded-[20px] border border-[#222734] bg-[#161A23] space-y-3.5">
        {/* Specific Period Tabs: Today / Week / Month / Custom */}
        <div className="grid grid-cols-4 p-1 rounded-[14px] bg-[#1E2330] border border-[#2A3142]">
          {[
            { id: 'today', label: 'Сегодня' },
            { id: 'week', label: '7 дней' },
            { id: 'month', label: 'Месяц' },
            { id: 'custom', label: 'Период' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id as TabKey)}
                className={`py-2 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#161A23] text-white shadow-sm border border-[#2A3142]'
                    : 'text-[#8A94A6] hover:text-white opacity-70 hover:opacity-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers (visible if custom tab or user chooses to edit) */}
        {activeTab === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider font-bold mb-1.5 text-[#8A94A6]">
                С даты:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  onChangeDateRange(e.target.value, dateTo);
                }}
                className="w-full text-xs font-mono rounded-xl p-2.5 bg-[#1E2330] border border-[#2A3142] text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider font-bold mb-1.5 text-[#8A94A6]">
                По дату:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  onChangeDateRange(dateFrom, e.target.value);
                }}
                className="w-full text-xs font-mono rounded-xl p-2.5 bg-[#1E2330] border border-[#2A3142] text-white outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Type Filter Buttons (Все / Только расходы / Только доходы) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#222734]">
          {[
            { id: 'all', label: 'Все' },
            { id: 'expense', label: 'Расходы' },
            { id: 'income', label: 'Доходы' },
          ].map((f) => {
            const isSelected = filterType === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setFilterType(f.id as any);
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'font-bold bg-[#1E2330] text-white border border-[#2A3142] shadow-sm'
                    : 'text-[#8A94A6] hover:text-white opacity-60 hover:opacity-100'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions List with Delete Trigger */}
      <div className="space-y-2.5 pt-1">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-white" />
            <p className="text-xs font-mono text-[#8A94A6]">
              Загрузка транзакций...
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-[20px] border border-[#222734] bg-[#161A23] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center bg-[#1E2330] text-[#555F73]">
              <Inbox size={24} />
            </div>
            <div className="text-sm font-bold font-display text-white">
              За выбранный период ничего не найдено
            </div>
            <p className="text-xs leading-relaxed max-w-xs mx-auto text-[#8A94A6]">
              Попробуйте выбрать другой диапазон дат или сбросить фильтры.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              showDelete={true}
              onDeleteRequest={onDeleteRequest}
            />
          ))
        )}
      </div>
    </div>
  );
};
