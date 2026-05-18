// ============================================================
// DATA SYNC — Google Apps Script as PRIMARY database
// ============================================================
// Google Apps Script (GAS) = source of truth for ALL data.
// localStorage = offline cache ONLY (read when GAS is unreachable).
//
// Data written here is saved to BOTH GAS (primary) and
// localStorage (cache). On load, GAS is always tried first.
// ============================================================

const GAS_URL = import.meta.env.VITE_GAS_URL || '';
const hasGAS  = () => Boolean(GAS_URL && GAS_URL.startsWith('https://'));

// ── Shared POST to GAS ───────────────────────────────────────
const gasPost = async (payload) => {
  if (!hasGAS()) return;
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[GAS POST]', err.message);
  }
};

// ── Shared GET from GAS ──────────────────────────────────────
const gasGet = async (sheet) => {
  if (!hasGAS()) return null;
  try {
    const res = await fetch(`${GAS_URL}?sheet=${sheet}`);
    if (res.ok) {
      const data = await res.json();
      // GAS returns [] for empty or data array; also returns {error:...} on failure
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn(`[GAS GET:${sheet}]`, err.message);
  }
  return null;
};

// ── EXPENSES ─────────────────────────────────────────────────
export const syncExpenses = async (data) => {
  localStorage.setItem('budget_expenses', JSON.stringify(data));
  await gasPost({ sheet: 'expenses', expenses: data });
};
export const fetchExpenses = async () => {
  const cloud = await gasGet('expenses');
  if (cloud !== null) {
    localStorage.setItem('budget_expenses', JSON.stringify(cloud));
    return cloud;
  }
  const cached = localStorage.getItem('budget_expenses');
  return cached ? JSON.parse(cached) : [];
};

// ── INCOMES ──────────────────────────────────────────────────
export const syncIncomes = async (data) => {
  localStorage.setItem('budget_incomes', JSON.stringify(data));
  await gasPost({ sheet: 'incomes', incomes: data });
};
export const fetchIncomes = async () => {
  const cloud = await gasGet('incomes');
  if (cloud !== null) {
    localStorage.setItem('budget_incomes', JSON.stringify(cloud));
    return cloud;
  }
  const cached = localStorage.getItem('budget_incomes');
  return cached ? JSON.parse(cached) : [];
};

// ── BANK ACCOUNTS ────────────────────────────────────────────
export const syncBankAccounts = async (data) => {
  localStorage.setItem('budget_bank_accounts', JSON.stringify(data));
  await gasPost({ sheet: 'bankaccounts', bankAccounts: data });
};
export const fetchBankAccounts = async () => {
  const cloud = await gasGet('bankaccounts');
  if (cloud !== null) {
    localStorage.setItem('budget_bank_accounts', JSON.stringify(cloud));
    return cloud; // may be [] (no accounts) or array of accounts
  }
  const cached = localStorage.getItem('budget_bank_accounts');
  return cached ? JSON.parse(cached) : null; // null = use app defaults
};

// ── CURRENCIES ───────────────────────────────────────────────
export const syncCurrencies = async (data) => {
  localStorage.setItem('budget_currencies', JSON.stringify(data));
  await gasPost({ sheet: 'currencies', currencies: data });
};
export const fetchCurrencies = async () => {
  const cloud = await gasGet('currencies');
  if (cloud !== null && cloud.length > 0) {
    localStorage.setItem('budget_currencies', JSON.stringify(cloud));
    return cloud;
  }
  const cached = localStorage.getItem('budget_currencies');
  return cached ? JSON.parse(cached) : null; // null = use app defaults
};

// ── APP SETTINGS (customBanks, customTypes, customBranches) ──
export const syncSettings = async (data) => {
  localStorage.setItem('budget_settings', JSON.stringify(data));
  await gasPost({ sheet: 'settings', settings: data });
};
export const fetchSettings = async () => {
  const cloud = await gasGet('settings');
  if (cloud !== null && cloud.length > 0) {
    // GAS returns array of [{key, value}] rows
    const obj = {};
    cloud.forEach(row => { if (row.key) obj[row.key] = JSON.parse(row.value || '[]'); });
    if (Object.keys(obj).length > 0) {
      localStorage.setItem('budget_settings', JSON.stringify(obj));
      return obj;
    }
  }
  const cached = localStorage.getItem('budget_settings');
  return cached ? JSON.parse(cached) : {};
};
