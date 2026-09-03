import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, PieChart as PieIcon } from 'lucide-react';
import { StatItem } from '../types';
import {
  formatAmount,
  formatJustNumber,
  getCategoryMeta,
  getCurrencySymbol,
} from '../utils/formatters';

interface AnalysisScreenProps {
  stats: StatItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

// Shared button style helper
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
  transition: 'all 0.15s',
  border: isActive ? `1px solid ${activeColor}22` : '1px solid transparent',
  background: isActive ? 'var(--bg-elevated)' : 'transparent',
  color: isActive ? activeColor : 'var(--text-muted)',
  opacity: isActive ? 1 : 0.7,
});

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({
  stats,
  isLoading,
  onRefresh,
}) => {
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch { /* ignore */ }
  };

  // Unique currencies from stats
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    stats.forEach((s) => { if (s.currency) set.add(s.currency); });
    return Array.from(set);
  }, [stats]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const activeCurrency = selectedCurrency || availableCurrencies[0] || 'RUB';

  // Filter by currency & type; sort by amount descending
  const filteredStats = useMemo(() => {
    return stats
      .filter((s) => {
        const matchCurrency = !s.currency || s.currency === activeCurrency;
        const inferredType = (s.total_amount || 0) < 0 ? 'expense' : 'income';
        const itemType = s.type || inferredType;
        return matchCurrency && itemType === selectedType && Math.abs(s.total_amount) > 0;
      })
      .map((s) => ({ ...s, total_amount: Math.abs(s.total_amount) }))
      .sort((a, b) => b.total_amount - a.total_amount);
  }, [stats, activeCurrency, selectedType]);

  const totalPeriodAmount = useMemo(
    () => filteredStats.reduce((acc, curr) => acc + curr.total_amount, 0),
    [filteredStats],
  );

  // Chart data — color is sourced from getCategoryMeta so it is consistent with the list
  const chartData = useMemo(() => {
    return filteredStats.map((item) => {
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
  }, [filteredStats, totalPeriodAmount, selectedType]);

  const typeColor = selectedType === 'expense' ? 'var(--accent-expense)' : 'var(--accent-income)';

  // Recharts custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div
        style={{
          padding: '0.75rem',
          borderRadius: '16px',
          border: '1px solid var(--border-secondary)',
          background: 'var(--bg-card)',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
          <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data.color }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {data.name}
          </span>
        </div>
        <div
          className="font-mono-num"
          style={{ fontSize: '0.8rem', fontWeight: 700, color: data.color }}
        >
          {selectedType === 'expense' ? '− ' : '+ '}
          {formatAmount(data.value, activeCurrency)}
        </div>
        <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '1px' }}>
          {data.percentage}% от суммы
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
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

      {/* Currency switcher */}
      {availableCurrencies.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {availableCurrencies.map((cur) => {
            const isSelected = cur === activeCurrency;
            return (
              <button
                key={cur}
                type="button"
                onClick={() => { triggerHaptic(); setSelectedCurrency(cur); }}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
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
          onClick={() => { triggerHaptic(); setSelectedType('expense'); }}
          style={tabBtnStyle(selectedType === 'expense', 'var(--accent-expense)')}
        >
          <ArrowUpRight size={15} strokeWidth={2} />
          <span>Расходы</span>
        </button>
        <button
          type="button"
          onClick={() => { triggerHaptic(); setSelectedType('income'); }}
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
              Нет данных по {selectedType === 'expense' ? 'расходам' : 'доходам'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '20rem', lineHeight: 1.5 }}>
              Для валюты {activeCurrency} пока нет записанных данных по категориям.
            </p>
          </div>
        ) : (
          <div>
            {/* Donut with centered total */}
            <div style={{ position: 'relative', height: '14rem', width: '100%' }}>
              {/* Center label */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', zIndex: 0,
                }}
              >
                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ВСЕГО
                </span>
                <span
                  className="font-mono-num"
                  style={{ fontWeight: 800, fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: typeColor, letterSpacing: '-0.025em', marginTop: '2px' }}
                >
                  {selectedType === 'expense' ? '−' : '+'}{formatJustNumber(totalPeriodAmount)}
                </span>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {activeCurrency}
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%" style={{ position: 'relative', zIndex: 10 }}>
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="transparent"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

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
              {chartData.map((item) => (
                <div
                  key={item.name}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
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
              return (
                <div
                  key={item.name}
                  className="card"
                  style={{ padding: '0.875rem 1rem' }}
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
                        style={{ fontWeight: 700, fontSize: '0.875rem', color: item.color }}
                      >
                        {selectedType === 'expense' ? '− ' : '+ '}
                        {formatAmount(item.value, activeCurrency)}
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
