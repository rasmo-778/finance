export type TransactionType = 'expense' | 'income' | string;

export interface Transaction {
  id: number | string;
  amount: number;
  currency: string;
  category: string;
  type: TransactionType;
  note?: string;
  date: string; // YYYY-MM-DD or timestamp
}

export interface StatItem {
  category: string;
  type: TransactionType;
  currency: string;
  total_amount: number;
}

export interface BalanceSummary {
  currency: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export type ActiveTab = 'home' | 'calendar' | 'analysis';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: TelegramUser;
          auth_date?: string;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams?: Record<string, string>;
        colorScheme?: 'light' | 'dark';
      };
    };
  }
}
