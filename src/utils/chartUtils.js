// ============================================================
// CHART DATA UTILITY FUNCTIONS
// ============================================================
// These helpers compute the data structures needed by the
// Recharts PieChart / Donut Chart components used across:
//   - Dashboard (mini donut)
//   - Expenses page (full donut)
//   - Income page (full donut)
//   - Per-currency breakdown donuts
// ============================================================

// Category → color mapping used when building donut slices
const EXPENSE_CATEGORY_COLORS = {
  'home/rent': '#4FD1F5',  // Sky blue
  'housing':   '#4FD1F5',
  'food':      '#A3ECC8',  // Green
  'utility':   '#A855F7',  // Purple
  'leisure':   '#EC8DF5',  // Pink
  'transport': '#F59E0B',  // Orange
};

const INCOME_CATEGORY_COLORS = {
  'salary':      '#A3ECC8', // Green
  'business':    '#4FD1F5', // Sky blue
  'investment':  '#A855F7', // Purple
  'gifts/grants':'#EC8DF5', // Pink
  'others':      '#FFE16A', // Yellow
};

const FALLBACK_COLOR = '#FFE16A'; // Yellow for unknown categories

/**
 * buildDonutData
 * ──────────────────────────────────────────────────────────
 * Builds an array of { name, value, color } for a PieChart/Donut
 * component, given a map of { categoryName: totalAmount }.
 *
 * @param {object}  categoryTotals - { 'Home/Rent': 1500, 'Food': 800, ... }
 * @param {string}  type           - 'income' | 'expense'
 * @param {string}  emptyColor     - Color to use when there's no data
 * @returns {Array}                - [{ name, value, color }, ...]
 */
export const buildDonutData = (categoryTotals, type = 'expense', emptyColor = '#1F2937') => {
  const colorMap = type === 'income' ? INCOME_CATEGORY_COLORS : EXPENSE_CATEGORY_COLORS;
  const label    = type === 'income' ? 'No Incomes' : 'No Expenses';

  const data = Object.keys(categoryTotals).map(cat => {
    const key   = cat.toLowerCase();
    const color = colorMap[key] || FALLBACK_COLOR;
    return { name: cat, value: categoryTotals[cat], color };
  });

  // Return a placeholder if no real data exists (prevents empty pie chart)
  return data.length > 0 ? data : [{ name: label, value: 1, color: emptyColor }];
};

/**
 * sumByCurrency
 * ──────────────────────────────────────────────────────────
 * Groups a list of transactions and sums amounts per currency.
 *
 * @param {Array} items - Array of expense/income objects with .amount and .currency
 * @returns {object}    - e.g. { 'LKR': 45000, 'AED': 2300 }
 */
export const sumByCurrency = (items) => {
  return items.reduce((acc, item) => {
    const cur = item.currency || 'AED';
    acc[cur] = (acc[cur] || 0) + (item.amount || 0);
    return acc;
  }, {});
};

/**
 * groupByCategory
 * ──────────────────────────────────────────────────────────
 * Groups transaction amounts by category AND currency.
 * Used to show "how much of each category was spent per currency".
 *
 * @param {Array} items - Transactions array
 * @returns {object}    - { 'Home/Rent': { 'LKR': 5000, 'AED': 200 }, ... }
 */
export const groupByCategory = (items) => {
  return items.reduce((acc, item) => {
    const cat = item.category || 'Other';
    const cur = item.currency || 'AED';
    if (!acc[cat]) acc[cat] = {};
    acc[cat][cur] = (acc[cat][cur] || 0) + item.amount;
    return acc;
  }, {});
};
