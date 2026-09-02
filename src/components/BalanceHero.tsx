import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BalanceSummary } from '../types';
import { formatJustNumber, getCurrencySymbol } from '../utils/formatters';

interface BalanceHeroProps {
  balances: BalanceSummary[];
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
}

export const BalanceHero: React.FC<BalanceHeroProps> = ({
  balances,
  selectedCurrency,
  onSelectCurrency,
}) => {
  const currentSummary =
    balances.find((b) => b.currency === selectedCurrency) ||
    balances[0] || {
      currency: 'UZS',
      income: 0,
      expense: 0,
      balance: 0,
      count: 0,
    };

  const currencySymbol = getCurrencySymbol(currentSummary.currency);
  const isPositive = currentSummary.balance >= 0;

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      {/* Multi-Currency Switcher (if user has transactions in multiple currencies) */}
      {balances.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {balances.map((b) => {
            const isActive = b.currency === currentSummary.currency;
            return (
              <button
                key={b.currency}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onSelectCurrency(b.currency);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#0E1117] shadow-md scale-105'
                    : 'bg-[#1E2330] text-[#8A94A6] hover:text-white border border-[#2A3142] active:scale-95'
                }`}
              >
                {b.currency} • {getCurrencySymbol(b.currency)}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Balance Card */}
      <div
        id="balance-hero-card"
        className="relative overflow-hidden rounded-[20px] p-5 sm:p-6 border border-[#222734] bg-[#161A23] card-glow transition-all"
      >
        {/* Card Header: Label & Currency Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isPositive ? '#00E676' : '#FF5252',
                boxShadow: isPositive
                  ? '0 0 8px rgba(0, 230, 118, 0.4)'
                  : '0 0 8px rgba(255, 82, 82, 0.4)',
              }}
            />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8A94A6]">
              ТЕКУЩИЙ БАЛАНС
            </span>
          </div>

          <div className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#1E2330] text-[#8A94A6] border border-[#2A3142]">
            {currentSummary.currency}
          </div>
        </div>

        {/* Dynamic Font Scaling Balance Number */}
        <div className="my-2 overflow-hidden">
          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0">
            <span
              className="font-bold font-mono-num tracking-tight text-white select-text"
              style={{
                fontSize: 'clamp(24px, 7vw, 36px)',
                lineHeight: 1.15,
              }}
            >
              {formatJustNumber(currentSummary.balance)}
            </span>
            <span className="text-xl sm:text-2xl font-bold font-display text-[#8A94A6]">
              {currencySymbol}
            </span>
          </div>
        </div>

        {/* Income & Expense Quick Action Pills (Two Equal-Width Flex Columns) */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#222734]">
          {/* Income Pill */}
          <div
            className="flex items-center gap-2.5 p-3 rounded-[16px] transition-all bg-[rgba(0,230,118,0.12)] border border-[rgba(0,230,118,0.15)]"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[rgba(0,230,118,0.2)] text-[#00E676]">
              <ArrowDownRight size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider font-medium text-[#8A94A6]">
                Доходы
              </div>
              <div
                className="text-xs sm:text-sm font-bold font-mono-num truncate text-[#00E676]"
                title={`+${formatJustNumber(currentSummary.income)} ${currencySymbol}`}
              >
                +{formatJustNumber(currentSummary.income)} {currencySymbol}
              </div>
            </div>
          </div>

          {/* Expense Pill */}
          <div
            className="flex items-center gap-2.5 p-3 rounded-[16px] transition-all bg-[rgba(255,82,82,0.12)] border border-[rgba(255,82,82,0.15)]"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[rgba(255,82,82,0.2)] text-[#FF5252]">
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider font-medium text-[#8A94A6]">
                Расходы
              </div>
              <div
                className="text-xs sm:text-sm font-bold font-mono-num truncate text-[#FF5252]"
                title={`−${formatJustNumber(currentSummary.expense)} ${currencySymbol}`}
              >
                −{formatJustNumber(currentSummary.expense)} {currencySymbol}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
