import { Transaction, StatItem } from '../types';

const BASE_URL = 'https://rasmo-778.alwaysdata.net';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch transactions with optional date filters and category
 */
export async function fetchTransactions(
  initData: string,
  params?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    limit?: number;
  }
): Promise<Transaction[]> {
  const queryParams = new URLSearchParams();
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.category && params.category !== 'all') {
    queryParams.append('category', params.category);
  }

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/transactions${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Telegram-Init-Data': initData,
    },
  });

  if (!response.ok) {
    let errorMsg = `Ошибка сервера (${response.status})`;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errData.error || errorMsg;
    } catch {
      const text = await response.text();
      if (text) errorMsg = text;
    }
    throw new ApiError(errorMsg, response.status);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch aggregated stats
 */
export async function fetchStats(initData: string): Promise<StatItem[]> {
  const url = `${BASE_URL}/stats`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Telegram-Init-Data': initData,
    },
  });

  if (!response.ok) {
    let errorMsg = `Ошибка сервера (${response.status})`;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errData.error || errorMsg;
    } catch {
      const text = await response.text();
      if (text) errorMsg = text;
    }
    throw new ApiError(errorMsg, response.status);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Delete a transaction by ID
 */
export async function deleteTransaction(
  initData: string,
  id: number | string
): Promise<{ status: string; id?: number | string }> {
  const url = `${BASE_URL}/transactions/${encodeURIComponent(String(id))}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'X-Telegram-Init-Data': initData,
    },
  });

  if (!response.ok) {
    let errorMsg = `Не удалось удалить операцию (${response.status})`;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errData.error || errorMsg;
    } catch {
      const text = await response.text();
      if (text) errorMsg = text;
    }
    throw new ApiError(errorMsg, response.status);
  }

  try {
    return await response.json();
  } catch {
    return { status: 'success', id };
  }
}
