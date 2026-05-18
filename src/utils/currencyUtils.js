// ============================================================
// CURRENCY UTILITY FUNCTIONS
// ============================================================
// Pure functions — no React state, no side effects.
// Safe to call anywhere: in components, hooks, or other utils.
// ============================================================

import { EXCHANGE_RATES } from '../constants/currencies';

/**
 * convertCurrency
 * ──────────────────────────────────────────────────────────
 * Converts an amount from one currency to another using
 * the static EXCHANGE_RATES table (all relative to USD=1.0).
 *
 * @param {number} amount    - The monetary value to convert
 * @param {string} fromCode  - Source currency code (e.g. 'AED')
 * @param {string} toCode    - Target currency code (e.g. 'LKR')
 * @returns {number}         - Converted amount
 *
 * Example:
 *   convertCurrency(100, 'AED', 'LKR')
 *   → 100 / 3.6725 * 300 ≈ 8,168 LKR
 */
export const convertCurrency = (amount, fromCode, toCode) => {
  if (fromCode === toCode) return amount; // No conversion needed

  const rateFrom = EXCHANGE_RATES[fromCode] || 1.0; // USD rate of source
  const rateTo   = EXCHANGE_RATES[toCode]   || 1.0; // USD rate of target

  // Convert to USD first, then to target currency
  return (amount / rateFrom) * rateTo;
};

/**
 * formatCurrency
 * ──────────────────────────────────────────────────────────
 * Formats a numeric amount with currency code.
 * Always displays 2 decimal places, e.g. "5,000.00 LKR"
 *
 * Note: 'Rs.' is replaced with 'LKR' for consistency in the UI.
 *
 * @param {number} amount         - The value to display
 * @param {string} curCode        - ISO currency code
 * @param {Array}  activeCurrencies - Array of active currency objects {code, symbol}
 * @returns {string}              - e.g. "1,250.00 AED" or "-500.00 LKR"
 */
export const formatCurrency = (amount, curCode, activeCurrencies = []) => {
  // Find symbol from active list; fallback to code itself
  let curSymbol = activeCurrencies.find(c => c.code === curCode)?.symbol || curCode;

  // Replace 'Rs.' with 'LKR' (user preference for Sri Lankan Rupee display)
  if (curSymbol === 'Rs.') curSymbol = 'LKR';

  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}${absVal} ${curSymbol}`;
};

/**
 * getCurrencyRowStyle
 * ──────────────────────────────────────────────────────────
 * Returns a background-color style object for a table row
 * based on the currency of that transaction row.
 *
 * This creates subtle tinted rows so the user can visually
 * distinguish between LKR / AED / USD transactions at a glance.
 *
 * @param {string}  currencyCode - e.g. 'LKR', 'AED', 'USD'
 * @param {boolean} isDark       - whether dark mode is active
 * @returns {object}             - CSS style object: { backgroundColor: '...' }
 */
export const getCurrencyRowStyle = (currencyCode, isDark) => {
  const cur = currencyCode || 'AED';

  if (isDark) {
    if (cur === 'LKR') return { backgroundColor: 'rgba(16, 185, 129, 0.08)' }; // Soft emerald (LKR)
    if (cur === 'AED') return { backgroundColor: 'rgba(56, 189, 248, 0.05)' }; // Soft sky blue (AED)
    if (cur === 'USD') return { backgroundColor: 'rgba(245, 158, 11, 0.08)' }; // Soft amber (USD)
    return { backgroundColor: 'rgba(139, 92, 246, 0.06)' };                    // Soft purple (others)
  } else {
    if (cur === 'LKR') return { backgroundColor: 'rgba(16, 185, 129, 0.06)' };
    if (cur === 'AED') return { backgroundColor: 'rgba(56, 189, 248, 0.04)' };
    if (cur === 'USD') return { backgroundColor: 'rgba(245, 158, 11, 0.06)' };
    return { backgroundColor: 'rgba(139, 92, 246, 0.04)' };
  }
};

/**
 * formatExpenseDate
 * ──────────────────────────────────────────────────────────
 * Converts ISO date string (YYYY-MM-DD) into a readable format.
 *
 * @param {string} dateStr - e.g. '2026-05-18'
 * @returns {string}       - e.g. 'May 18, 2026'
 */
export const formatExpenseDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr; // fallback: return as-is

  const year     = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day      = parseInt(parts[2], 10);

  const MONTHS = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  return `${MONTHS[monthIdx]} ${day}, ${year}`;
};
