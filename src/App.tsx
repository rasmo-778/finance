import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Send, Smartphone } from 'lucide-react';
import { Transaction, StatItem, BalanceSummary, ActiveTab } from './types';
import { fetchTransactions, fetchStats, deleteTransaction } from './services/api';
import { HomeScreen } from './components/HomeScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { BottomNav } from './components/BottomNav';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Toast, ToastMessage } from './components/Toast';
import { parseDateSafe, toLocalISODate } from './utils/formatters';

export default function App() {
  // Telegram WebApp initData detection
  const [initData, setInitData] = useState<string>('');
  const [isTelegramReady, setIsTelegramReady] = useState(false);

  // Active Screen
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Core Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [calendarTransactions, setCalendarTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');

  // Calendar State (using local dates instead of UTC to avoid timezone shift)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return toLocalISODate(firstDay);
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return toLocalISODate(lastDay);
  });

  // UI / Status States
  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.('#0E1117');
        tg.setBackgroundColor?.('#0E1117');
        if (tg.initData) {
          setInitData(tg.initData);
        }
      }
    } catch (e) {
      console.error('Error initializing Telegram WebApp SDK:', e);
    }
    setIsTelegramReady(true);
  }, []);

  // Show toast helper
  const showToast = useCallback((text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({
      id: String(Date.now()),
      type,
      text,
    });
  }, []);

  // Fetch Main Transactions & Stats
  const loadMainData = useCallback(async () => {
    if (!initData) return;
    setIsLoadingMain(true);
    setIsLoadingStats(true);

    try {
      const [txList, statsList] = await Promise.all([
        fetchTransactions(initData, { limit: 200 }),
        fetchStats(initData).catch(() => [] as StatItem[]),
      ]);

      setTransactions(txList);
      setStats(statsList);

      // Auto-select primary currency if not set
      if (txList.length > 0) {
        setSelectedCurrency((prev) => prev || txList[0].currency || 'RUB');
      } else if (statsList.length > 0) {
        setSelectedCurrency((prev) => prev || statsList[0].currency || 'RUB');
      }
    } catch (err: any) {
      console.error('Failed to load main data:', err);
      showToast(err.message || 'Не удалось загрузить данные с сервера', 'error');
    } finally {
      setIsLoadingMain(false);
      setIsLoadingStats(false);
    }
  }, [initData, showToast]);

  // Fetch Calendar Transactions
  const loadCalendarData = useCallback(
    async (from: string, to: string) => {
      if (!initData) return;
      setIsLoadingCalendar(true);

      try {
        const list = await fetchTransactions(initData, {
          date_from: from || undefined,
          date_to: to || undefined,
        });
        setCalendarTransactions(list);
      } catch (err: any) {
        console.error('Failed to load calendar data:', err);
        showToast(err.message || 'Ошибка загрузки периода', 'error');
      } finally {
        setIsLoadingCalendar(false);
      }
    },
    [initData, showToast]
  );

  // Trigger initial data load when initData is ready
  useEffect(() => {
    if (initData) {
      loadMainData();
      loadCalendarData(dateFrom, dateTo);
    }
  }, [initData, loadMainData, loadCalendarData, dateFrom, dateTo]);

  // Handle Date Range Change in Calendar
  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    loadCalendarData(from, to);
  };

  // Combine all loaded transactions into a single unified deduplicated list
  const allUnifiedTransactions = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactions.forEach((t) => map.set(String(t.id), t));
    calendarTransactions.forEach((t) => map.set(String(t.id), t));
    return Array.from(map.values()).sort((a, b) => {
      const tA = parseDateSafe(a.date)?.getTime() || 0;
      const tB = parseDateSafe(b.date)?.getTime() || 0;
      return tB - tA; // newest first
    });
  }, [transactions, calendarTransactions]);

  // Compute Balance Summary separately for each currency
  const balances: BalanceSummary[] = useMemo(() => {
    const currencyMap = new Map<string, { income: number; expense: number; count: number }>();

    // Aggregate from unified transactions
    allUnifiedTransactions.forEach((tx) => {
      const curr = (tx.currency || 'RUB').toUpperCase();
      if (!currencyMap.has(curr)) {
        currencyMap.set(curr, { income: 0, expense: 0, count: 0 });
      }
      const entry = currencyMap.get(curr)!;
      entry.count += 1;

      if (tx.type === 'income') {
        entry.income += Math.abs(tx.amount);
      } else {
        entry.expense += Math.abs(tx.amount);
      }
    });

    // Also consider currencies in stats if not in transactions
    stats.forEach((st) => {
      const curr = (st.currency || 'RUB').toUpperCase();
      if (!currencyMap.has(curr)) {
        currencyMap.set(curr, { income: 0, expense: 0, count: 0 });
      }
    });

    if (currencyMap.size === 0) {
      return [
        {
          currency: 'RUB',
          income: 0,
          expense: 0,
          balance: 0,
          count: 0,
        },
      ];
    }

    const result: BalanceSummary[] = [];
    currencyMap.forEach((val, curr) => {
      result.push({
        currency: curr,
        income: val.income,
        expense: val.expense,
        balance: val.income - val.expense,
        count: val.count,
      });
    });

    return result;
  }, [allUnifiedTransactions, stats]);

  // Make sure selectedCurrency is valid
  useEffect(() => {
    if (balances.length > 0 && !balances.some((b) => b.currency === selectedCurrency)) {
      setSelectedCurrency(balances[0].currency);
    }
  }, [balances, selectedCurrency]);

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !initData) return;
    setIsDeleting(true);

    try {
      await deleteTransaction(initData, deleteTarget.id);

      // Remove from transactions state
      setTransactions((prev) => prev.filter((t) => String(t.id) !== String(deleteTarget.id)));
      setCalendarTransactions((prev) => prev.filter((t) => String(t.id) !== String(deleteTarget.id)));

      // Trigger haptic if available
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch {
        // ignore
      }

      showToast('Операция успешно удалена', 'success');
      setDeleteTarget(null);

      // Refresh stats
      fetchStats(initData).then(setStats).catch(() => {});
    } catch (err: any) {
      console.error('Delete error:', err);
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
      } catch {
        // ignore
      }
      showToast(err.message || 'Ошибка при удалении операции', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // If app is opened in a standard browser outside Telegram (no Telegram.WebApp.initData)
  if (isTelegramReady && !initData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[#0E1117] text-white">
        <div className="w-full max-w-sm rounded-[24px] p-8 border border-[#222734] bg-[#161A23] shadow-2xl text-center flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1E2330] border border-[#2A3142] flex items-center justify-center text-[#24A1DE] shadow-inner">
            <Send size={28} className="translate-x-[-1px] translate-y-[1px]" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight text-white mb-1.5">
              Telegram WebApp
            </h1>
            <p className="text-xs leading-relaxed text-[#8A94A6]">
              Откройте это приложение через Telegram
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-mono text-[#5A6478]">
            <Smartphone size={13} />
            <span>Требуется запуск внутри Telegram бота</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-safe pb-nav">
        {activeTab === 'home' && (
          <HomeScreen
            balances={balances}
            transactions={allUnifiedTransactions}
            selectedCurrency={selectedCurrency}
            onSelectCurrency={setSelectedCurrency}
            isLoading={isLoadingMain}
            onRefresh={() => {
              loadMainData();
              loadCalendarData(dateFrom, dateTo);
            }}
            onGoToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarScreen
            transactions={allUnifiedTransactions}
            isLoading={isLoadingCalendar}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChangeDateRange={handleDateRangeChange}
            onRefresh={() => {
              loadMainData();
              loadCalendarData(dateFrom, dateTo);
            }}
            onDeleteRequest={(tx) => setDeleteTarget(tx)}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisScreen
            stats={stats}
            isLoading={isLoadingStats}
            onRefresh={() => {
              setIsLoadingStats(true);
              fetchStats(initData)
                .then(setStats)
                .catch((e) => showToast(e.message, 'error'))
                .finally(() => setIsLoadingStats(false));
            }}
          />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        transaction={deleteTarget}
        isOpen={!!deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Bottom Navigation with 3 icons (Calendar, Home, Analysis) */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
