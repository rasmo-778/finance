import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, PieChart as PieIcon, X, Calendar as CalendarIcon } from 'lucide-react';
import { StatItem, Transaction } from '../types';
import {
  getCategoryMeta,
  getCurrencySymbol,
  parseDateSafe,
} from '../utils/formatters';
import { AnimatedNumber } from './AnimatedNumber';

interface AnalysisScreenProps {
  stats: StatItem[];
  transactions?: Transaction[];
  isLoading: boolean;
  onRefresh: () => void;
}

type PeriodTabKey = 'today' | 'week' | 'month' | 'all';

const PERIOD_TABS: { id: PeriodTabKey; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week',  label: '7 дней'  },
  { id: 'month', label: 'Месяц'   },
  { id: 'all',   label: 'Всё время' },
];

// Shared button style helper with smooth transition
const tabBtnStyle = (isActive: boolean, activeColor: string): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  padding: '0.6rem',
  borderRadius: '12px',
  fontSize: '0.8rem',
  fontWeight: 700,
  fontFamily: 'var(--font-display)',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  border: isActive ? `1px solid ${activeColor}33` : '1px solid transparent',
  background: isActive ? 'var(--bg-elevated)' : 'transparent',
  color: isActive ? activeColor : 'var(--text-muted)',
  opacity: isActive ? 1 : 0.7,
  boxShadow: isActive ? `0 2px 8px -2px ${activeColor}22` : 'none',
});

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({
  stats,
  transactions = [],
  isLoading,
  onRefresh,
}) => {
  // PROBLEM 3: Default period MUST be "7 дней" ('week')
  const [activePeriod, setActivePeriod] = useState<PeriodTabKey>('week');
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch { /* ignore */ }
  };

  // Unique currencies from stats / transactions
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    stats.forEach((s) => { if (s.currency) set.add(s.currency); });
    transactions.forEach((t) => { if (t.currency) set.add(t.currency); });
    return Array.from(set);
  }, [stats, transactions]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const activeCurrency = selectedCurrency || availableCurrencies[0] || 'RUB';

  // Filter transactions or stats by date period
  const filteredCategoryData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // If transactions are available, aggregate from transactions for precise date period filtering
    if (transactions.length > 0) {
      const categoryMap = new Map<string, number>();

      transactions.forEach((tx) => {
        const txCurrency = (tx.currency || 'RUB').toUpperCase();
        if (txCurrency !== activeCurrency) return;
        if (tx.type !== selectedType) return;

        const txDate = parseDateSafe(tx.date);
        if (!txDate) return;

        // Apply period filter
        let inPeriod = false;
        switch (activePeriod) {
          case 'today':
            inPeriod = txDate >= todayStart && txDate <= todayEnd;
            break;
          case 'week':
            inPeriod = txDate >= weekStart && txDate <= todayEnd;
            break;
          case 'month':
            inPeriod = txDate >= monthStart && txDate <= monthEnd;
            break;
          case 'all':
            inPeriod = true;
            break;
        }

        if (inPeriod) {
          const cat = tx.category || 'Без категории';
          const amt = Math.abs(tx.amount);
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
        }
      });

      return Array.from(categoryMap.entries())
        .map(([category, total_amount]) => ({
          category,
          total_amount,
          type: selectedType,
          currency: activeCurrency,
        }))
        .sort((a, b) => b.total_amount - a.total_amount);
    }

    // Fallback if no transactions provided: use stats
    return stats
      .filter((s) => {
        const matchCurrency = !s.currency || s.currency === activeCurrency;
        const inferredType = (s.total_amount || 0) < 0 ? 'expense' : 'income';
        const itemType = s.type || inferredType;
        return matchCurrency && itemType === selectedType && Math.abs(s.total_amount) > 0;
      })
      .map((s) => ({ ...s, total_amount: Math.abs(s.total_amount) }))
      .sort((a, b) => b.total_amount - a.total_amount);
  }, [transactions, stats, activeCurrency, selectedType, activePeriod]);

  const totalPeriodAmount = useMemo(
    () => filteredCategoryData.reduce((acc, curr) => acc + curr.total_amount, 0),
    [filteredCategoryData],
  );

  // Chart data — color is sourced from getCategoryMeta so it is consistent with the list
  const chartData = useMemo(() => {
    return filteredCategoryData.map((item) => {
      const meta = getCategoryMeta(item.category, selectedType);
      const percentage = totalPeriodAmount > 0 ? (item.total_amount / totalPeriodAmount) * 100 : 0;
      return {
        name: item.category || 'Без категории',
        value: item.total_amount,
        percentage: percentage.toFixed(1),
        color: meta.color,       // category-pinned color
        meta,
      };
    });
  }, [filteredCategoryData, totalPeriodAmount, selectedType]);

  // Selected item object (if user tapped a segment or list row)
  const selectedChartItem = useMemo(() => {
    if (!selectedCategoryName) return null;
    return chartData.find((item) => item.name === selectedCategoryName) || null;
  }, [chartData, selectedCategoryName]);

  const typeColor = selectedType === 'expense' ? 'var(--accent-expense)' : 'var(--accent-income)';

  const handleCategoryClick = (categoryName: string) => {
    triggerHaptic();
    setSelectedCategoryName((prev) => (prev === categoryName ? null : categoryName));
  };

  return (
    <div className="space-y-4 animate-page-switch">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
        <div>
          <h1
            className="font-display"
            style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Анализ
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px', fontFamily: 'var(--font-mono)' }}>
            Структура доходов и расходов
          </p>
        </div>

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
          title="Обновить"
          aria-label="Обновить"
        >
          <RefreshCw size={15} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Period filter tabs — DEFAULT IS "Сегодня" */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.25rem',
          padding: '0.25rem',
          borderRadius: '14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
        }}
      >
        {PERIOD_TABS.map((tab) => {
          const isActive = activePeriod === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setActivePeriod(tab.id);
                setSelectedCategoryName(null);
              }}
              style={{
                padding: '0.45rem 0.2rem',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: isActive ? 700 : 600,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                border: isActive ? '1px solid var(--border-secondary)' : '1px solid transparent',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Currency switcher (if multiple available) */}
      {availableCurrencies.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {availableCurrencies.map((cur) => {
            const isSelected = cur === activeCurrency;
            return (
              <button
                key={cur}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setSelectedCurrency(cur);
                  setSelectedCategoryName(null);
                }}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isSelected ? 'var(--text-primary)' : 'var(--bg-elevated)',
                  color: isSelected ? 'var(--bg-page)' : 'var(--text-secondary)',
                  border: `1px solid ${isSelected ? 'transparent' : 'var(--border-secondary)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {cur} • {getCurrencySymbol(cur)}
              </button>
            );
          })}
        </div>
      )}

      {/* Type toggle: Расходы / Доходы */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.3rem',
          padding: '0.3rem',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setSelectedType('expense');
            setSelectedCategoryName(null);
          }}
          style={tabBtnStyle(selectedType === 'expense', 'var(--accent-expense)')}
        >
          <ArrowUpRight size={15} strokeWidth={2} />
          <span>Расходы</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setSelectedType('income');
            setSelectedCategoryName(null);
          }}
          style={tabBtnStyle(selectedType === 'income', 'var(--accent-income)')}
        >
          <ArrowDownRight size={15} strokeWidth={2} />
          <span>Доходы</span>
        </button>
      </div>

      {/* Donut chart card */}
      <div
        id="analysis-chart-card"
        className="card"
        style={{ padding: '1.25rem', position: 'relative' }}
      >
        {isLoading ? (
          <div style={{ height: '15rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Loader2 size={28} style={{ color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Загрузка статистики...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: '15rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.75rem', padding: '1rem' }}>
            <div
              style={{
                width: '3rem', height: '3rem',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
              }}
            >
              <PieIcon size={22} strokeWidth={1.5} />
            </div>
            <div
              className="font-display"
              style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}
            >
              Нет данных по {selectedType === 'expense' ? 'расходам' : 'доходам'} за {PERIOD_TABS.find(p => p.id === activePeriod)?.label.toLowerCase()}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '20rem', lineHeight: 1.5 }}>
              Выберите другой период выше или добавьте операции.
            </p>
          </div>
        ) : (
          <div>
            {/* Donut with centered animated total number */}
            <div style={{ position: 'relative', height: '14rem', width: '100%' }}>
              {/* Center label with animated counter */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', zIndex: 0,
                  padding: '0 2rem',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {selectedChartItem ? selectedChartItem.name : 'ВСЕГО'}
                </span>

                <div
                  className="font-mono-num"
                  style={{
                    fontWeight: 800,
                    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                    color: selectedChartItem ? selectedChartItem.color : typeColor,
                    letterSpacing: '-0.025em',
                    marginTop: '2px',
                    lineHeight: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                  }}
                >
                  <span>{selectedType === 'expense' ? '−' : '+'}</span>
                  <AnimatedNumber
                    value={selectedChartItem ? selectedChartItem.value : totalPeriodAmount}
                    duration={400}
                  />
                </div>

                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '1px' }}>
                  {selectedChartItem ? `${selectedChartItem.percentage}% от суммы` : activeCurrency}
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%" style={{ position: 'relative', zIndex: 10 }}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="transparent"
                    strokeWidth={0}
                    onClick={(entry) => handleCategoryClick(String(entry.name))}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    {chartData.map((entry) => {
                      const isSelected = selectedCategoryName === entry.name;
                      return (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          stroke={isSelected ? 'var(--text-primary)' : 'transparent'}
                          strokeWidth={isSelected ? 2 : 0}
                          style={{
                            outline: 'none',
                            transition: 'all 0.25s ease',
                            opacity: selectedCategoryName && !isSelected ? 0.45 : 1,
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Selected Category Banner (if a segment is tapped) */}
            {selectedChartItem && (
              <div
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${selectedChartItem.color}44`,
                  marginTop: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span
                    style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      backgroundColor: selectedChartItem.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="font-display"
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}
                  >
                    Выбрано: {selectedChartItem.name} ({selectedChartItem.percentage}%)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryName(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Сбросить выбор"
                  aria-label="Сбросить выбор"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Compact color legend strip */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.4rem',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {chartData.map((item) => {
                const isSelected = selectedCategoryName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleCategoryClick(item.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: `1px solid ${isSelected ? item.color : 'transparent'}`,
                      borderRadius: '999px',
                      padding: '0.15rem 0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: selectedCategoryName && !isSelected ? 0.5 : 1,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '7px', height: '7px',
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 700 : 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category breakdown list */}
      {chartData.length > 0 && (
        <div className="space-y-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
            <h2
              style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-secondary)' }}
            >
              Категории ({chartData.length})
            </h2>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Доля в бюджете
            </span>
          </div>

          <div className="space-y-2">
            {chartData.map((item) => {
              const CategoryIcon = item.meta.icon;
              const isSelected = selectedCategoryName === item.name;

              return (
                <div
                  key={item.name}
                  className="card"
                  onClick={() => handleCategoryClick(item.name)}
                  style={{
                    padding: '0.875rem 1rem',
                    cursor: 'pointer',
                    border: `1px solid ${isSelected ? item.color : 'var(--border-card)'}`,
                    boxShadow: isSelected ? `0 0 12px ${item.color}33` : 'var(--shadow-card)',
                    transition: 'all 0.2s ease',
                    opacity: selectedCategoryName && !isSelected ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      {/* Icon with category-specific color */}
                      <div
                        style={{
                          width: '2.25rem', height: '2.25rem',
                          borderRadius: '12px',
                          flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: item.meta.bgColor,
                          color: item.color,
                          border: `1px solid ${item.color}22`,
                        }}
                      >
                        <CategoryIcon size={16} strokeWidth={1.75} />
                      </div>

                      {/* Color dot + name */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '7px', height: '7px',
                              borderRadius: '50%',
                              backgroundColor: item.color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            className="font-display"
                            style={{
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        className="font-mono-num"
                        style={{ fontWeight: 700, fontSize: '0.875rem', color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}
                      >
                        <span>{selectedType === 'expense' ? '−' : '+'}</span>
                        <AnimatedNumber value={item.value} duration={400} />
                        <span style={{ fontSize: '0.7rem', marginLeft: '2px' }}>{activeCurrency}</span>
                      </div>
                      <div
                        style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.color, opacity: 0.75 }}
                      >
                        {item.percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%', height: '4px',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '9999px',
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                        transition: 'width 0.5s ease',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
