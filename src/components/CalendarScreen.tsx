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
type FilterType = 'all' | 'expense' | 'income';

const PERIOD_TABS: { id: TabKey; label: string }[] = [
  { id: 'today',  label: 'Сегодня' },
  { id: 'week',   label: '7 дней'  },
  { id: 'month',  label: 'Месяц'   },
  { id: 'custom', label: 'Период'  },
];

const FILTER_TABS: { id: FilterType; label: string }[] = [
  { id: 'all',     label: 'Все'     },
  { id: 'expense', label: 'Расходы' },
  { id: 'income',  label: 'Доходы'  },
];

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
  const [filterType, setFilterType] = useState<FilterType>('all');

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch { /* ignore */ }
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
      const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onChangeDateRange(toLocalISODate(firstDay), toLocalISODate(lastDay));
    }
    // 'custom' — keep current dateFrom/dateTo values
  };

  // Client-side filtering by date window and type
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Parse custom range once
    let customStart: Date | null = null;
    let customEnd: Date | null = null;
    if (dateFrom) {
      const p = dateFrom.split('-');
      if (p.length === 3) customStart = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 0, 0, 0, 0);
    }
    if (dateTo) {
      const p = dateTo.split('-');
      if (p.length === 3) customEnd = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 23, 59, 59, 999);
    }

    return transactions.filter((tx) => {
      // Type filter
      if (filterType === 'expense' && tx.type !== 'expense') return false;
      if (filterType === 'income'  && tx.type !== 'income')  return false;

      // Date filter
      const txDate = parseDateSafe(tx.date);
      if (!txDate) return true; // keep unparseable

      switch (activeTab) {
        case 'today':  return txDate >= todayStart && txDate <= todayEnd;
        case 'week':   return txDate >= weekStart  && txDate <= todayEnd;
        case 'month':  return txDate >= monthStart && txDate <= monthEnd;
        case 'custom':
          if (customStart && txDate < customStart) return false;
          if (customEnd   && txDate > customEnd)   return false;
          return true;
        default: return true;
      }
    });
  }, [transactions, filterType, activeTab, dateFrom, dateTo]);

  // Period totals grouped by currency
  const periodTotalsByCurrency = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    filteredTransactions.forEach((tx) => {
      const c = (tx.currency || 'RUB').toUpperCase();
      if (!map.has(c)) map.set(c, { income: 0, expense: 0 });
      if (tx.type === 'income') {
        map.get(c)!.income += Math.abs(tx.amount);
      } else {
        map.get(c)!.expense += Math.abs(tx.amount);
      }
    });
    return Array.from(map.entries()).map(([currency, totals]) => ({ currency, ...totals }));
  }, [filteredTransactions]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
        <div>
          <h1
            className="font-display"
            style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Календарь
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>
            История и выбор периода
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onRefresh && (
            <button
              type="button"
              onClick={() => { triggerHaptic(); onRefresh(); }}
              disabled={isLoading}
              style={{
                width: '2.25rem', height: '2.25rem',
                borderRadius: '50%',
                border: '1px solid var(--border-secondary)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
              title="Обновить данные"
              aria-label="Обновить данные"
            >
              <RefreshCw size={14} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          )}

          <div
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              border: '1px solid var(--border-secondary)',
              background: 'var(--bg-elevated)',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Clock size={11} />
            <span>{filteredTransactions.length} записей</span>
          </div>
        </div>
      </div>

      {/* Period summary cards */}
      {periodTotalsByCurrency.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {periodTotalsByCurrency.map((total) => (
            <div key={total.currency} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {/* Expense card */}
              <div
                className="card"
                style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
              >
                <div
                  style={{
                    width: '2rem', height: '2rem',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--accent-expense-dim)',
                    color: 'var(--accent-expense)',
                  }}
                >
                  <ArrowUpRight size={15} strokeWidth={2} />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Расходы
                  </div>
                  <div
                    className="font-mono-num"
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-expense)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={`−${formatAmount(total.expense, total.currency)}`}
                  >
                    −{formatAmount(total.expense, total.currency)}
                  </div>
                </div>
              </div>

              {/* Income card */}
              <div
                className="card"
                style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
              >
                <div
                  style={{
                    width: '2rem', height: '2rem',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--accent-income-dim)',
                    color: 'var(--accent-income)',
                  }}
                >
                  <ArrowDownRight size={15} strokeWidth={2} />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Доходы
                  </div>
                  <div
                    className="font-mono-num"
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-income)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={`+${formatAmount(total.income, total.currency)}`}
                  >
                    +{formatAmount(total.income, total.currency)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date range filter card */}
      <div
        className="card"
        style={{ padding: '0.875rem 1rem' }}
      >
        {/* Period tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.25rem',
            padding: '0.25rem',
            borderRadius: '14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {PERIOD_TABS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                style={{
                  padding: '0.5rem 0.25rem',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: isActive ? 700 : 600,
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--border-secondary)' : '1px solid transparent',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Custom date pickers */}
        {activeTab === 'custom' && (
          <div
            className="animate-fade-in"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.75rem' }}
          >
            <div>
              <label
                style={{ display: 'block', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}
              >
                С даты:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onChangeDateRange(e.target.value, dateTo)}
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}
              >
                По дату:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onChangeDateRange(dateFrom, e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* Type filter pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {FILTER_TABS.map((f) => {
            const isSelected = filterType === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => { triggerHaptic(); setFilterType(f.id); }}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.35rem',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: isSelected ? 700 : 600,
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--border-secondary)' : '1px solid transparent',
                  background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
        {isLoading ? (
          <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Loader2 size={26} style={{ color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Загрузка транзакций...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div
            className="card"
            style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
          >
            <div
              style={{
                width: '3rem', height: '3rem',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
              }}
            >
              <Inbox size={22} strokeWidth={1.5} />
            </div>
            <div className="font-display" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              За выбранный период ничего не найдено
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '20rem' }}>
              Попробуйте выбрать другой диапазон дат или сбросить фильтры.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              showDelete
              onDeleteRequest={onDeleteRequest}
            />
          ))
        )}
      </div>
    </div>
  );
};
