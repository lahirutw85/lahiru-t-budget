// ============================================================
// DATA SYNC UTILITIES
// ============================================================
// Handles persisting data to:
//   1. localStorage           — always (instant, offline-safe)
//   2. Google Apps Script     — when VITE_GAS_URL is set (cloud sync)
//
// Set VITE_GAS_URL=<your-apps-script-web-app-url> in your .env file
// ============================================================

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

const hasGAS = () => Boolean(GAS_URL && GAS_URL.startsWith('https://'));

// ── Shared POST helper ───────────────────────────────────────
const gasPost = async (payload) => {
  if (!hasGAS()) return;
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[GAS sync] Failed:', err.message);
  }
};

// ── Shared GET helper ────────────────────────────────────────
const gasGet = async (sheet) => {
  if (!hasGAS()) return null;
  try {
    const res = await fetch(`${GAS_URL}?sheet=${sheet}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn(`[GAS fetch:${sheet}] Failed:`, err.message);
  }
  return null;
};

// ── EXPENSES ─────────────────────────────────────────────────
export const syncExpenses = async (updatedExpenses) => {
  localStorage.setItem('budget_expenses', JSON.stringify(updatedExpenses));
  await gasPost({ sheet: 'expenses', expenses: updatedExpenses });
};

export const fetchExpenses = async () => {
  const cloud = await gasGet('expenses');
  if (cloud) {
    localStorage.setItem('budget_expenses', JSON.stringify(cloud));
    return cloud;
  }
  const cached = localStorage.getItem('budget_expenses');
  return cached ? JSON.parse(cached) : [];
};

// ── INCOMES ──────────────────────────────────────────────────
export const syncIncomes = async (updatedIncomes) => {
  localStorage.setItem('budget_incomes', JSON.stringify(updatedIncomes));
  await gasPost({ sheet: 'incomes', incomes: updatedIncomes });
};

export const fetchIncomes = async () => {
  const cloud = await gasGet('incomes');
  if (cloud) {
    localStorage.setItem('budget_incomes', JSON.stringify(cloud));
    return cloud;
  }
  const cached = localStorage.getItem('budget_incomes');
  return cached ? JSON.parse(cached) : [];
};

// ── BANK ACCOUNTS ────────────────────────────────────────────
export const syncBankAccounts = async (updatedAccounts) => {
  localStorage.setItem('budget_bank_accounts', JSON.stringify(updatedAccounts));
  await gasPost({ sheet: 'bankaccounts', bankAccounts: updatedAccounts });
};

export const fetchBankAccounts = async () => {
  const cloud = await gasGet('bankaccounts');
  if (cloud) {
    localStorage.setItem('budget_bank_accounts', JSON.stringify(cloud));
    return cloud;
  }
  const cached = localStorage.getItem('budget_bank_accounts');
  return cached ? JSON.parse(cached) : null; // null = use defaults
};
