import React, { useMemo } from 'react';
import { RefreshCw, ArrowRight, History, Inbox } from 'lucide-react';
import { Transaction, BalanceSummary } from '../types';
import { BalanceHero } from './BalanceHero';
import { TransactionItem } from './TransactionItem';

interface HomeScreenProps {
  balances: BalanceSummary[];
  transactions: Transaction[];
  selectedCurrency: string;
  onSelectCurrency: (curr: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onGoToCalendar: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  balances,
  transactions,
  selectedCurrency,
  onSelectCurrency,
  isLoading,
  onRefresh,
  onGoToCalendar,
}) => {
  // Extract Telegram user info if available
  const tgUser = useMemo(() => {
    try {
      return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
    } catch {
      return null;
    }
  }, []);

  const userName     = tgUser?.first_name || 'Пользователь';
  const userPhoto    = tgUser?.photo_url;
  const userInitials = (tgUser?.first_name?.[0] || 'U').toUpperCase();

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch { /* ignore */ }
  };

  // Show only the most recent 15 transactions
  const recentTransactions = transactions.slice(0, 15);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header: Avatar + Greeting + Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Avatar */}
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            {userPhoto ? (
              <img src={userPhoto} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.2 }}>
              Добрый день,
            </div>
            <h1
              className="font-display"
              style={{ fontWeight: 800, fontSize: 'clamp(0.9rem, 4vw, 1.1rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}
            >
              {userName}
            </h1>
          </div>
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
          title="Обновить данные"
          aria-label="Обновить данные"
        >
          <RefreshCw size={15} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Balance Hero Card */}
      {isLoading && balances.length === 0 ? (
        <div
          className="card"
          style={{ padding: '1.25rem 1.375rem', animation: 'fade-in 0.3s ease both' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '6rem', height: '0.875rem', borderRadius: '6px', background: 'var(--bg-elevated)' }} />
            <div style={{ width: '12rem', height: '2.25rem', borderRadius: '8px', background: 'var(--bg-elevated)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', paddingTop: '0.75rem' }}>
              <div style={{ height: '4rem', borderRadius: '16px', background: 'var(--bg-elevated)' }} />
              <div style={{ height: '4rem', borderRadius: '16px', background: 'var(--bg-elevated)' }} />
            </div>
          </div>
        </div>
      ) : (
        <BalanceHero
          balances={balances}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={onSelectCurrency}
        />
      )}

      {/* Recent Transactions Section */}
      <div className="space-y-3">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={13} style={{ color: 'var(--text-muted)' }} />
            <h2
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
              }}
            >
              ПОСЛЕДНИЕ ОПЕРАЦИИ
            </h2>
          </div>

          <button
            type="button"
            onClick={() => { triggerHaptic(); onGoToCalendar(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: 0.8,
              transition: 'opacity 0.15s',
            }}
          >
            <span>Все</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Transactions list */}
        {isLoading && recentTransactions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: '4rem',
                  borderRadius: 'var(--radius-card)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
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
              Нет операций
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '20rem' }}>
              Здесь появится история ваших последних доходов и расходов.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
