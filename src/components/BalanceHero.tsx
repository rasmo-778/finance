import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BalanceSummary } from '../types';
import { formatJustNumber, getCurrencySymbol } from '../utils/formatters';

interface BalanceHeroProps {
  balances: BalanceSummary[];
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
}

/** Scales font-size down if formatted number is long. */
function balanceFontSize(value: string | number): string {
  const len = String(value).replace(/[\s,]/g, '').length;
  if (len <= 7) return 'clamp(2rem, 8vw, 2.5rem)';
  if (len <= 10) return 'clamp(1.5rem, 6.5vw, 2rem)';
  return 'clamp(1.1rem, 5vw, 1.5rem)';
}

/** Scales font-size down for shorter income/expense number+symbol strings. */
function pillAmountFontSize(value: string): string {
  const len = value.replace(/[\s,]/g, '').length;
  if (len <= 9)  return '0.8rem';
  if (len <= 13) return '0.7rem';
  return '0.62rem';
}

export const BalanceHero: React.FC<BalanceHeroProps> = ({
  balances,
  selectedCurrency,
  onSelectCurrency,
}) => {
  const currentSummary =
    balances.find((b) => b.currency === selectedCurrency) ||
    balances[0] || { currency: 'RUB', income: 0, expense: 0, balance: 0, count: 0 };

  const currencySymbol = getCurrencySymbol(currentSummary.currency);
  const isPositive = currentSummary.balance >= 0;

  const formattedBalance  = formatJustNumber(currentSummary.balance);
  const formattedIncome   = `+${formatJustNumber(currentSummary.income)} ${currencySymbol}`;
  const formattedExpense  = `−${formatJustNumber(currentSummary.expense)} ${currencySymbol}`;

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-3">
      {/* Multi-currency switcher */}
      {balances.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {balances.map((b) => {
            const isActive = b.currency === currentSummary.currency;
            return (
              <button
                key={b.currency}
                type="button"
                onClick={() => { triggerHaptic(); onSelectCurrency(b.currency); }}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: isActive ? 'var(--text-primary)' : 'var(--bg-elevated)',
                  color: isActive ? 'var(--bg-page)' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--border-secondary)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {b.currency} • {getCurrencySymbol(b.currency)}
              </button>
            );
          })}
        </div>
      )}

      {/* Main balance card */}
      <div
        id="balance-hero-card"
        className="card"
        style={{ padding: '1.25rem 1.375rem' }}
      >
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isPositive ? 'var(--accent-income)' : 'var(--accent-expense)',
                boxShadow: isPositive
                  ? '0 0 6px var(--accent-income-glow)'
                  : '0 0 6px var(--accent-expense-glow)',
              }}
            />
            <span style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}>
              ТЕКУЩИЙ БАЛАНС
            </span>
          </div>

          <div style={{
            padding: '0.15rem 0.6rem',
            borderRadius: '999px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-secondary)',
          }}>
            {currentSummary.currency}
          </div>
        </div>

        {/* Balance number — auto-scales */}
        <div style={{ margin: '0.5rem 0 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.35rem 0.5rem' }}>
            <span
              className="font-mono-num"
              style={{
                fontWeight: 800,
                fontSize: balanceFontSize(formattedBalance),
                lineHeight: 1.1,
                color: 'var(--text-primary)',
                userSelect: 'text',
              }}
            >
              {formattedBalance}
            </span>
            <span
              className="font-display"
              style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.2,
              }}
            >
              {currencySymbol}
            </span>
          </div>
        </div>

        {/* Income & Expense pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* Income */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem',
              borderRadius: '16px',
              background: 'var(--accent-income-dim)',
              border: '1px solid var(--accent-income-glow)',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-income-glow)',
                color: 'var(--accent-income)',
              }}
            >
              <ArrowDownRight size={15} strokeWidth={2.5} />
            </div>

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '1px',
              }}>
                Доходы
              </div>
              <div
                className="font-mono-num"
                title={formattedIncome}
                style={{
                  fontSize: pillAmountFontSize(formattedIncome),
                  fontWeight: 700,
                  color: 'var(--accent-income)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formattedIncome}
              </div>
            </div>
          </div>

          {/* Expense */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem',
              borderRadius: '16px',
              background: 'var(--accent-expense-dim)',
              border: '1px solid var(--accent-expense-glow)',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-expense-glow)',
                color: 'var(--accent-expense)',
              }}
            >
              <ArrowUpRight size={15} strokeWidth={2.5} />
            </div>

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '1px',
              }}>
                Расходы
              </div>
              <div
                className="font-mono-num"
                title={formattedExpense}
                style={{
                  fontSize: pillAmountFontSize(formattedExpense),
                  fontWeight: 700,
                  color: 'var(--accent-expense)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formattedExpense}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
