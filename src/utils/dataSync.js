// ============================================================
// DATA SYNC UTILITIES
// ============================================================
// Handles persisting data to:
//   1. localStorage  — always (instant, offline-safe)
//   2. Backend API   — when server is available (optional sync)
//
// The backend is a local Express server at http://localhost:5000.
// If it's unreachable, the app continues working from localStorage.
// ============================================================

const API_BASE = 'http://localhost:5000/api';

/**
 * syncExpenses
 * ──────────────────────────────────────────────────────────
 * Saves expenses to localStorage immediately, then tries to
 * sync to the backend API (Google Sheets integration).
 *
 * @param {Array} updatedExpenses - Full updated list of expense objects
 */
export const syncExpenses = async (updatedExpenses) => {
  // Step 1: Always save locally so UI reflects changes instantly
  localStorage.setItem('budget_expenses', JSON.stringify(updatedExpenses));

  // Step 2: Try to sync to backend (may fail silently if server is down)
  try {
    await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses: updatedExpenses }),
    });
  } catch (err) {
    console.warn('[syncExpenses] Backend unavailable, using local cache only:', err.message);
  }
};

/**
 * syncIncomes
 * ──────────────────────────────────────────────────────────
 * Same as syncExpenses but for the incomes list.
 *
 * @param {Array} updatedIncomes - Full updated list of income objects
 */
export const syncIncomes = async (updatedIncomes) => {
  localStorage.setItem('budget_incomes', JSON.stringify(updatedIncomes));

  try {
    await fetch(`${API_BASE}/incomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incomes: updatedIncomes }),
    });
  } catch (err) {
    console.warn('[syncIncomes] Backend unavailable, using local cache only:', err.message);
  }
};

/**
 * fetchExpenses
 * ──────────────────────────────────────────────────────────
 * Loads expenses from backend on app start.
 * Falls back to localStorage if the backend is not reachable.
 *
 * @returns {Array} - Array of expense objects, or [] if none saved
 */
export const fetchExpenses = async () => {
  try {
    const res = await fetch(`${API_BASE}/expenses`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('[fetchExpenses] Using localStorage fallback:', err.message);
  }

  // Fallback: parse from localStorage
  const cached = localStorage.getItem('budget_expenses');
  return cached ? JSON.parse(cached) : [];
};

/**
 * fetchIncomes
 * ──────────────────────────────────────────────────────────
 * Loads incomes from backend on app start.
 * Falls back to localStorage if the backend is not reachable.
 *
 * @returns {Array} - Array of income objects, or [] if none saved
 */
export const fetchIncomes = async () => {
  try {
    const res = await fetch(`${API_BASE}/incomes`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('[fetchIncomes] Using localStorage fallback:', err.message);
  }

  const cached = localStorage.getItem('budget_incomes');
  return cached ? JSON.parse(cached) : [];
};
