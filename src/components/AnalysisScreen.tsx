import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, PieChart as PieIcon } from 'lucide-react';
import { StatItem } from '../types';
import { formatAmount, formatJustNumber, getCategoryMeta, getCurrencySymbol, CHART_PALETTE } from '../utils/formatters';

interface AnalysisScreenProps {
  stats: StatItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({
  stats,
  isLoading,
  onRefresh,
}) => {
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // ignore
    }
  };

  // Extract unique currencies
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    stats.forEach((s) => {
      if (s.currency) set.add(s.currency);
    });
    return Array.from(set);
  }, [stats]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const activeCurrency = selectedCurrency || availableCurrencies[0] || 'UZS';

  // Filter stats by currency & type
  const filteredStats = useMemo(() => {
    return stats
      .filter((s) => {
        const matchCurrency = !s.currency || s.currency === activeCurrency;
        const inferredType = (s.total_amount || 0) < 0 ? 'expense' : 'income';
        const itemType = s.type || inferredType;
        const matchType = itemType === selectedType;
        
        return matchCurrency && matchType && Math.abs(s.total_amount) > 0;
      })
      .map((s) => ({
        ...s,
        total_amount: Math.abs(s.total_amount),
      }))
      .sort((a, b) => b.total_amount - a.total_amount);
  }, [stats, activeCurrency, selectedType]);

  // Total amount for active view
  const totalPeriodAmount = useMemo(() => {
    return filteredStats.reduce((acc, curr) => acc + curr.total_amount, 0);
  }, [filteredStats]);

  // Chart data with percentages & colors
  const chartData = useMemo(() => {
    return filteredStats.map((item, idx) => {
      const percentage = totalPeriodAmount > 0 ? (item.total_amount / totalPeriodAmount) * 100 : 0;
      return {
        name: item.category || 'Без категории',
        value: item.total_amount,
        percentage: percentage.toFixed(1),
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
      };
    });
  }, [filteredStats, totalPeriodAmount]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-2xl border border-[#2A3142] bg-[#161A23] shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-xs font-bold font-display text-white">
              {data.name}
            </span>
          </div>
          <div
            className="text-sm font-bold font-mono-num"
            style={{
              color: selectedType === 'expense' ? '#FF5252' : '#00E676',
            }}
          >
            {selectedType === 'expense' ? '− ' : '+ '}
            {formatAmount(data.value, activeCurrency)}
          </div>
          <div className="text-[10px] font-mono font-semibold text-[#8A94A6]">
            {data.percentage}% от общей суммы
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-bold font-display tracking-tight text-white">
            Анализ
          </h1>
          <p className="text-xs font-mono text-[11px] text-[#8A94A6]">
            Структура доходов и расходов
          </p>
        </div>

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
          title="Обновить"
          aria-label="Обновить"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Currency Selector (if multiple currencies exist) */}
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
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#0E1117] shadow-md scale-105'
                    : 'bg-[#1E2330] text-[#8A94A6] hover:text-white border border-[#2A3142] active:scale-95'
                }`}
              >
                {cur} • {getCurrencySymbol(cur)}
              </button>
            );
          })}
        </div>
      )}

      {/* Type Toggle Tabs: Расходы vs Доходы */}
      <div className="grid grid-cols-2 p-1 rounded-[16px] bg-[#161A23] border border-[#222734]">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setSelectedType('expense');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-xs font-bold font-display transition-all cursor-pointer ${
            selectedType === 'expense'
              ? 'bg-[#1E2330] text-[#FF5252] shadow-sm border border-[rgba(255,82,82,0.2)]'
              : 'text-[#8A94A6] hover:text-white opacity-70 hover:opacity-100'
          }`}
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
          <span>Расходы</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setSelectedType('income');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-xs font-bold font-display transition-all cursor-pointer ${
            selectedType === 'income'
              ? 'bg-[#1E2330] text-[#00E676] shadow-sm border border-[rgba(0,230,118,0.2)]'
              : 'text-[#8A94A6] hover:text-white opacity-70 hover:opacity-100'
          }`}
        >
          <ArrowDownRight size={16} strokeWidth={2.5} />
          <span>Доходы</span>
        </button>
      </div>

      {/* Donut Chart Card */}
      <div
        id="analysis-chart-card"
        className="relative overflow-hidden rounded-[20px] p-5 border border-[#222734] bg-[#161A23] card-glow transition-all"
      >
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-white" />
            <p className="text-xs font-mono text-[#8A94A6]">
              Загрузка статистики...
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#1E2330] text-[#555F73]">
              <PieIcon size={24} />
            </div>
            <div className="text-sm font-bold font-display text-white">
              Нет данных по {selectedType === 'expense' ? 'расходам' : 'доходам'}
            </div>
            <p className="text-xs max-w-xs leading-relaxed text-[#8A94A6]">
              Для валюты {activeCurrency} пока нет записанных данных по категориям.
            </p>
          </div>
        ) : (
          <div>
            {/* Donut Chart with Center Display */}
            <div className="relative h-60 w-full">
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8A94A6]">
                  ВСЕГО
                </span>
                <span
                  className="text-lg sm:text-xl font-bold font-mono-num tracking-tight"
                  style={{
                    color: selectedType === 'expense' ? '#FF5252' : '#00E676',
                  }}
                >
                  {selectedType === 'expense' ? '−' : '+'}
                  {formatJustNumber(totalPeriodAmount)}
                </span>
                <span className="text-xs font-mono font-semibold text-[#8A94A6]">
                  {activeCurrency}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={96}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="transparent"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown Progress Bars List */}
      {chartData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-[#8A94A6]">
              Категории ({chartData.length})
            </h2>
            <span className="text-xs font-mono font-semibold text-[#8A94A6]">
              Доля в бюджете
            </span>
          </div>

          <div className="space-y-2.5">
            {chartData.map((item) => {
              const meta = getCategoryMeta(item.name, selectedType);
              const CategoryIcon = meta.icon;

              return (
                <div
                  key={item.name}
                  className="p-4 rounded-[20px] border border-[#222734] bg-[#161A23] transition-all"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-[#2A3142]"
                        style={{
                          backgroundColor: '#1E2330',
                          color: item.color,
                        }}
                      >
                        <CategoryIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold font-display truncate text-white">
                          {item.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className="text-sm font-bold font-mono-num"
                        style={{
                          color: selectedType === 'expense' ? '#FF5252' : '#00E676',
                        }}
                      >
                        {selectedType === 'expense' ? '− ' : '+ '}
                        {formatAmount(item.value, activeCurrency)}
                      </div>
                      <div className="text-[11px] font-mono font-bold" style={{ color: item.color }}>
                        {item.percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar line track */}
                  <div className="w-full h-2 rounded-full overflow-hidden bg-[#1E2330]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
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
