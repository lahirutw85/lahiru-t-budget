// ============================================================
// DATA SYNC UTILITIES
// ============================================================
// Handles persisting data to:
//   1. localStorage      — always (instant, offline-safe)
//   2. Google Apps Script Web App — when VITE_GAS_URL is set
//
// The Apps Script Web App is a free, serverless REST API that
// reads/writes directly to your Google Spreadsheet.
// It works from the deployed GitHub Pages site — no local server needed.
//
// To configure:
//   Set VITE_GAS_URL=<your-apps-script-web-app-url> in your .env file
// ============================================================

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

// ── Internal helper ──────────────────────────────────────────
const hasGAS = () => Boolean(GAS_URL && GAS_URL.startsWith('https://'));

/**
 * syncExpenses
 * ──────────────────────────────────────────────────────────
 * Saves expenses to localStorage immediately, then syncs to
 * the Google Apps Script Web App if VITE_GAS_URL is configured.
 *
 * @param {Array} updatedExpenses - Full updated list of expense objects
 */
export const syncExpenses = async (updatedExpenses) => {
  // Step 1: Always save locally so UI reflects changes instantly
  localStorage.setItem('budget_expenses', JSON.stringify(updatedExpenses));

  // Step 2: Sync to Google Sheets via Apps Script Web App
  if (!hasGAS()) {
    console.info('[syncExpenses] VITE_GAS_URL not set — using localStorage only.');
    return;
  }

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for POST
      body: JSON.stringify({ sheet: 'expenses', expenses: updatedExpenses }),
    });
  } catch (err) {
    console.warn('[syncExpenses] Cloud sync failed, local cache is still up-to-date:', err.message);
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
  // Step 1: Save locally
  localStorage.setItem('budget_incomes', JSON.stringify(updatedIncomes));

  // Step 2: Sync to Google Sheets via Apps Script Web App
  if (!hasGAS()) {
    console.info('[syncIncomes] VITE_GAS_URL not set — using localStorage only.');
    return;
  }

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ sheet: 'incomes', incomes: updatedIncomes }),
    });
  } catch (err) {
    console.warn('[syncIncomes] Cloud sync failed, local cache is still up-to-date:', err.message);
  }
};

/**
 * fetchExpenses
 * ──────────────────────────────────────────────────────────
 * Loads expenses from Google Apps Script Web App on app start.
 * Falls back to localStorage if the URL is not configured or unreachable.
 *
 * @returns {Array} - Array of expense objects, or [] if none saved
 */
export const fetchExpenses = async () => {
  if (hasGAS()) {
    try {
      const res = await fetch(`${GAS_URL}?sheet=expenses`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Refresh local cache with cloud data
          localStorage.setItem('budget_expenses', JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('[fetchExpenses] Cloud fetch failed, using localStorage fallback:', err.message);
    }
  }

  // Fallback: parse from localStorage
  const cached = localStorage.getItem('budget_expenses');
  return cached ? JSON.parse(cached) : [];
};

/**
 * fetchIncomes
 * ──────────────────────────────────────────────────────────
 * Loads incomes from Google Apps Script Web App on app start.
 * Falls back to localStorage if the URL is not configured or unreachable.
 *
 * @returns {Array} - Array of income objects, or [] if none saved
 */
export const fetchIncomes = async () => {
  if (hasGAS()) {
    try {
      const res = await fetch(`${GAS_URL}?sheet=incomes`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem('budget_incomes', JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('[fetchIncomes] Cloud fetch failed, using localStorage fallback:', err.message);
    }
  }

  const cached = localStorage.getItem('budget_incomes');
  return cached ? JSON.parse(cached) : [];
};
