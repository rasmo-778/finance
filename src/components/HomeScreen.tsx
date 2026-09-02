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

  const userName = tgUser?.first_name || 'Пользователь';
  const userPhoto = tgUser?.photo_url;
  const userInitials = (tgUser?.first_name?.[0] || 'U').toUpperCase();

  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // ignore
    }
  };

  // Filter recent transactions
  const recentTransactions = transactions.slice(0, 15);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header Bar: User Greeting & Avatar & Refresh */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm bg-[#1E2330] border border-[#2A3142] text-white shrink-0">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-[#8A94A6]">
              Добрый день,
            </div>
            <h1 className="text-base sm:text-lg font-bold font-display tracking-tight leading-tight text-white">
              {userName}
            </h1>
          </div>
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
          title="Обновить данные"
          aria-label="Обновить данные"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Balance Hero Card */}
      {isLoading && balances.length === 0 ? (
        <div className="rounded-[20px] p-6 border border-[#222734] bg-[#161A23] animate-pulse space-y-4">
          <div className="w-24 h-4 rounded bg-[#1E2330]" />
          <div className="w-48 h-10 rounded bg-[#1E2330]" />
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="h-14 rounded-2xl bg-[#1E2330]" />
            <div className="h-14 rounded-2xl bg-[#1E2330]" />
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
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History size={15} className="text-[#8A94A6]" />
            <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#8A94A6]">
              ПОСЛЕДНИЕ ОПЕРАЦИИ
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onGoToCalendar();
            }}
            className="text-xs font-bold font-display flex items-center gap-1 text-white transition-opacity hover:opacity-80 active:scale-95 cursor-pointer"
          >
            <span>Все</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Transactions List */}
        {isLoading && recentTransactions.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-[20px] border border-[#222734] bg-[#161A23] animate-pulse"
              />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-8 rounded-[20px] border border-[#222734] bg-[#161A23] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center bg-[#1E2330] text-[#555F73]">
              <Inbox size={24} />
            </div>
            <div className="text-sm font-bold font-display text-white">
              Нет операций
            </div>
            <p className="text-xs leading-relaxed max-w-xs mx-auto text-[#8A94A6]">
              Здесь появится история ваших последних доходов и расходов.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
