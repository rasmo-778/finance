import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  HeartPulse,
  Gamepad2,
  Tv,
  Wallet,
  Landmark,
  TrendingUp,
  Fuel,
  GraduationCap,
  Plane,
  Briefcase,
  HelpCircle,
  Gift,
  Coffee,
  Smartphone,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';

export function getCurrencySymbol(currency: string): string {
  const normalized = (currency || '').toUpperCase().trim();
  switch (normalized) {
    case 'RUB':
    case 'RUR':
      return '₽';
    case 'KZT':
      return '₸';
    case 'UZS':
      return 'UZS';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'BYN':
      return 'Br';
    case 'GEL':
      return '₾';
    case 'TRY':
      return '₺';
    case 'UAH':
      return '₴';
    default:
      return currency || '₽';
  }
}

export function formatAmount(amount: number, currency: string, showPlus = false): string {
  const symbol = getCurrencySymbol(currency);
  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '− ' : (showPlus && amount > 0 ? '+ ' : '');
  return `${sign}${formattedNumber} ${symbol}`;
}

export function formatJustNumber(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Robust date parser supporting YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, ISO timestamps across all mobile browsers
 */
export function parseDateSafe(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  const str = String(dateString).trim();
  if (!str) return null;

  // Replace space with 'T' for iOS Safari compatibility if standard SQL timestamp
  const normalized = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;

  // Fallback manual regex match for YYYY-MM-DD
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = parseDateSafe(dateString);
    if (!d) return dateString;

    const now = new Date();
    if (isSameDay(d, now)) return 'Сегодня';

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(d, yesterday)) return 'Вчера';

    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatFullDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = parseDateSafe(dateString);
    if (!d) return dateString;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export interface CategoryMeta {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export function getCategoryMeta(categoryName: string = '', type: string = 'expense'): CategoryMeta {
  const cat = (categoryName || '').toLowerCase().trim();

  if (type === 'income' || cat.includes('зарплат') || cat.includes('доход') || cat.includes('перевод')) {
    return {
      icon: Wallet,
      color: '#4ECBA0',       // matches --accent-income
      bgColor: 'rgba(78,203,160,0.13)',
    };
  }

  if (cat.includes('продукт') || cat.includes('супермаркет') || cat.includes('еда') || cat.includes('food')) {
    return {
      icon: Utensils,
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.14)',
    };
  }

  if (cat.includes('кафе') || cat.includes('ресторан') || cat.includes('кофе') || cat.includes('бар')) {
    return {
      icon: Coffee,
      color: '#d97706',
      bgColor: 'rgba(217, 119, 6, 0.14)',
    };
  }

  if (cat.includes('такси') || cat.includes('транспорт') || cat.includes('авто') || cat.includes('бензин') || cat.includes('машин')) {
    return {
      icon: cat.includes('бензин') ? Fuel : Car,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.14)',
    };
  }

  if (cat.includes('покупк') || cat.includes('одежд') || cat.includes('шопинг') || cat.includes('маркет')) {
    return {
      icon: ShoppingBag,
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.14)',
    };
  }

  if (cat.includes('дом') || cat.includes('аренд') || cat.includes('жкх') || cat.includes('квартир')) {
    return {
      icon: Home,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.14)',
    };
  }

  if (cat.includes('здоров') || cat.includes('аптек') || cat.includes('врач') || cat.includes('спорт')) {
    return {
      icon: HeartPulse,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.14)',
    };
  }

  if (cat.includes('развлечен') || cat.includes('игр') || cat.includes('кино') || cat.includes('хобби')) {
    return {
      icon: Gamepad2,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.14)',
    };
  }

  if (cat.includes('подписк') || cat.includes('сервис') || cat.includes('связь') || cat.includes('интернет')) {
    return {
      icon: Smartphone,
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.14)',
    };
  }

  if (cat.includes('путешеств') || cat.includes('билет') || cat.includes('отель')) {
    return {
      icon: Plane,
      color: '#14b8a6',
      bgColor: 'rgba(20, 184, 166, 0.14)',
    };
  }

  if (cat.includes('подар')) {
    return {
      icon: Gift,
      color: '#f43f5e',
      bgColor: 'rgba(244, 63, 94, 0.14)',
    };
  }

  if (cat.includes('образ') || cat.includes('курс') || cat.includes('книг')) {
    return {
      icon: GraduationCap,
      color: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.14)',
    };
  }

  return {
    icon: HelpCircle,
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.14)',
  };
}

export const CHART_PALETTE = [
  '#4ECBA0',  // Muted emerald (income)
  '#7C7CF8',  // Soft indigo
  '#E07B6A',  // Muted terracotta (expense)
  '#5BA8E0',  // Steel blue
  '#D4A05A',  // Warm amber
  '#A87CF8',  // Lavender
  '#E87CA8',  // Dusty rose
  '#56C2B8',  // Muted teal
  '#A3B560',  // Sage green
  '#E8976A',  // Burnt sienna
];
