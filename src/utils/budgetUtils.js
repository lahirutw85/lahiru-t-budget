/**
 * budgetUtils.js
 * ──────────────────────────────────────────────────────────
 * Pure helpers for resolving monthly budget category/sub-category
 * amounts with support for:
 *  - Per-month overrides (`monthlyOverrides['YYYY-MM']`)
 *  - Forward-continuing changes (`forwardChanges['YYYY-MM']`)
 *  - Active date ranges (`startPeriod` .. `endPeriod` in 'YYYY-MM', e.g. for Loans)
 */

const makeSub = (id, name, defaultAmount = 0, bankAccount = '') => ({
  id,
  name,
  defaultAmount,
  monthlyOverrides: {},
  forwardChanges: {},
  bankAccount,
  startPeriod: '',
  endPeriod: '',
});

export const DEFAULT_BUDGET_CATEGORIES = [
  { id: 'cat-food', name: 'Food', defaultAmount: 0, monthlyOverrides: {}, forwardChanges: {}, bankAccount: '', startPeriod: '', endPeriod: '', subCategories: [] },
  { id: 'cat-ai', name: 'AI', defaultAmount: 0, monthlyOverrides: {}, forwardChanges: {}, bankAccount: '', startPeriod: '', endPeriod: '', subCategories: [] },
  {
    id: 'cat-transportation',
    name: 'Transportation',
    defaultAmount: 0,
    monthlyOverrides: {},
    forwardChanges: {},
    bankAccount: '',
    startPeriod: '',
    endPeriod: '',
    subCategories: [
      makeSub('sub-bus', 'Bus'),
      makeSub('sub-taxi', 'Taxi'),
      makeSub('sub-car', 'Car'),
    ],
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    defaultAmount: 0,
    monthlyOverrides: {},
    forwardChanges: {},
    bankAccount: '',
    startPeriod: '',
    endPeriod: '',
    subCategories: [
      makeSub('sub-appliances', 'Appliances'),
      makeSub('sub-furniture', 'Furniture'),
      makeSub('sub-kitchen', 'Kitchen'),
      makeSub('sub-toiletries', 'Toiletries'),
      makeSub('sub-cloth', 'Cloth'),
    ],
  },
  { id: 'cat-emergency-fund', name: 'Emergency Fund', defaultAmount: 0, monthlyOverrides: {}, forwardChanges: {}, bankAccount: '', startPeriod: '', endPeriod: '', subCategories: [] },
  {
    id: 'cat-give',
    name: 'Give',
    defaultAmount: 0,
    monthlyOverrides: {},
    forwardChanges: {},
    bankAccount: '',
    startPeriod: '',
    endPeriod: '',
    subCategories: [
      makeSub('sub-tithe', 'Tithe'),
      makeSub('sub-donation', 'Donation'),
      makeSub('sub-family', 'Family'),
      makeSub('sub-naomi', 'Naomi'),
    ],
  },
  { id: 'cat-mobile', name: 'Mobile', defaultAmount: 0, monthlyOverrides: {}, forwardChanges: {}, bankAccount: '', startPeriod: '', endPeriod: '', subCategories: [] },
  { id: 'cat-investment', name: 'Investment', defaultAmount: 0, monthlyOverrides: {}, forwardChanges: {}, bankAccount: '', startPeriod: '', endPeriod: '', subCategories: [] },
  {
    id: 'cat-loan',
    name: 'Loan',
    defaultAmount: 0,
    monthlyOverrides: {},
    forwardChanges: {},
    bankAccount: '',
    startPeriod: '',
    endPeriod: '',
    subCategories: [
      makeSub('sub-dib-loan', 'DIB Loan'),
      makeSub('sub-endb-card', 'ENDB CARD'),
      makeSub('sub-dib-card', 'DIB CARD'),
    ],
  },
  { id: 'cat-house-rent', name: 'House Rent', defaultAmount: 0, monthlyOverrides: {}, forwardChanges: {}, bankAccount: '', startPeriod: '', endPeriod: '', subCategories: [] },
];

/**
 * Normalizes raw budget categories (supporting legacy `amount` / `details` fields).
 */
export const normalizeBudgetCategories = (rawCategories) => {
  const raw = Array.isArray(rawCategories) && rawCategories.length > 0
    ? rawCategories
    : DEFAULT_BUDGET_CATEGORIES;

  return raw.map(cat => {
    const baseAmount = parseFloat(cat.defaultAmount ?? cat.amount ?? 0) || 0;
    let subs = Array.isArray(cat.subCategories) ? cat.subCategories : null;

    if (!subs) {
      const defaultMatch = DEFAULT_BUDGET_CATEGORIES.find(d => d.id === cat.id || d.name === cat.name);
      if (defaultMatch && defaultMatch.subCategories.length > 0) {
        subs = defaultMatch.subCategories;
      } else if (cat.details && cat.details.trim()) {
        subs = cat.details.trim().split(/\s+/).map((p, idx) => makeSub(`${cat.id}-sub-${idx}`, p));
      } else {
        subs = [];
      }
    }

    return {
      ...cat,
      defaultAmount: baseAmount,
      monthlyOverrides: cat.monthlyOverrides || {},
      forwardChanges: cat.forwardChanges || {},
      startPeriod: cat.startPeriod || '',
      endPeriod: cat.endPeriod || '',
      loanTotalAmount: parseFloat(cat.loanTotalAmount || 0) || 0,
      loanTotalMonths: parseInt(cat.loanTotalMonths || 0, 10) || 0,
      subCategories: subs.map(s => ({
        ...s,
        defaultAmount: parseFloat(s.defaultAmount ?? s.amount ?? 0) || 0,
        monthlyOverrides: s.monthlyOverrides || {},
        forwardChanges: s.forwardChanges || {},
        startPeriod: s.startPeriod || '',
        endPeriod: s.endPeriod || '',
        loanTotalAmount: parseFloat(s.loanTotalAmount || 0) || 0,
        loanTotalMonths: parseInt(s.loanTotalMonths || 0, 10) || 0,
      })),
    };
  });
};

/**
 * Resolves the active amount for a single budget item (category or sub-category)
 * in the given `periodKey` ('YYYY-MM').
 */
export const resolveItemAmountForPeriod = (item, periodKey) => {
  if (!item) return 0;
  if (item.startPeriod && periodKey < item.startPeriod) return 0;
  if (item.endPeriod && periodKey > item.endPeriod) return 0;

  if (item.monthlyOverrides && Object.prototype.hasOwnProperty.call(item.monthlyOverrides, periodKey)) {
    return parseFloat(item.monthlyOverrides[periodKey]) || 0;
  }

  if (item.forwardChanges && typeof item.forwardChanges === 'object') {
    const keys = Object.keys(item.forwardChanges)
      .filter(k => k <= periodKey)
      .sort();
    if (keys.length > 0) {
      return parseFloat(item.forwardChanges[keys[keys.length - 1]]) || 0;
    }
  }

  return parseFloat(item.defaultAmount ?? item.amount ?? 0) || 0;
};

/**
 * Resolves the total amount for a category in `periodKey` ('YYYY-MM').
 * If the category has sub-categories, sums the sub-categories (also respecting
 * any parent-level startPeriod/endPeriod if set).
 */
export const resolveCategoryTotalForPeriod = (cat, periodKey) => {
  if (!cat) return 0;
  if (cat.startPeriod && periodKey < cat.startPeriod) return 0;
  if (cat.endPeriod && periodKey > cat.endPeriod) return 0;

  if (Array.isArray(cat.subCategories) && cat.subCategories.length > 0) {
    return cat.subCategories.reduce((sum, sub) => sum + resolveItemAmountForPeriod(sub, periodKey), 0);
  }
  return resolveItemAmountForPeriod(cat, periodKey);
};

/**
 * Computes total planned expenses for a given year + month (or 'Full Year').
 */
export const resolveExpensesBudgetForSelection = (plannedBudget, selectedYear, selectedMonth, allMonths) => {
  const categories = normalizeBudgetCategories(plannedBudget?.categories);
  if (selectedMonth === 'Full Year') {
    let yearTotal = 0;
    for (let m = 1; m <= 12; m++) {
      const pk = `${selectedYear}-${String(m).padStart(2, '0')}`;
      yearTotal += categories.reduce((sum, cat) => sum + resolveCategoryTotalForPeriod(cat, pk), 0);
    }
    return yearTotal;
  }
  const monthIdx = allMonths.indexOf(selectedMonth);
  const pk = `${selectedYear}-${String((monthIdx >= 0 ? monthIdx : new Date().getMonth()) + 1).padStart(2, '0')}`;
  return categories.reduce((sum, cat) => sum + resolveCategoryTotalForPeriod(cat, pk), 0);
};

/**
 * Formats 'YYYY-MM' into a short readable label like 'Nov 2026'.
 */
export const formatPeriodLabel = (periodKey) => {
  if (!periodKey || !periodKey.includes('-')) return '';
  const [y, m] = periodKey.split('-');
  const idx = parseInt(m, 10) - 1;
  const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return idx >= 0 && idx < 12 ? `${SHORT[idx]} ${y}` : periodKey;
};

export const DEFAULT_BILLS = [
  { id: 'bill-mobile', name: 'Mobile', defaultAmount: 0, monthlyOverrides: {}, bankAccount: '', dueDay: '' },
  { id: 'bill-house-rent', name: 'House Rent', defaultAmount: 0, monthlyOverrides: {}, bankAccount: '', dueDay: '' },
];

/**
 * Given a startPeriod ('YYYY-MM') and total months to pay (>= 1),
 * returns the inclusive endPeriod ('YYYY-MM').
 * Example: start '2026-11', months 12 -> '2027-10'.
 */
export const computeEndPeriodFromMonths = (startPeriod, totalMonths) => {
  const months = parseInt(totalMonths, 10);
  if (!startPeriod || !startPeriod.includes('-') || !months || months < 1) return '';
  const [y, m] = startPeriod.split('-').map(Number);
  if (!y || !m) return '';
  const totalIndex = (y * 12 + (m - 1)) + (months - 1);
  const endY = Math.floor(totalIndex / 12);
  const endM = (totalIndex % 12) + 1;
  return `${endY}-${String(endM).padStart(2, '0')}`;
};

/**
 * Computes loan progress as of `periodKey` ('YYYY-MM'):
 *  - paidSoFar: sum of resolved monthly payments from startPeriod through min(periodKey, endPeriod)
 *  - remainingAmount: max(0, loanTotalAmount - paidSoFar)
 *  - monthsElapsed: number of months elapsed up to periodKey
 *  - monthsRemaining: max(0, loanTotalMonths - monthsElapsed)
 */
export const computeLoanProgress = (item, periodKey) => {
  const fullAmount = parseFloat(item?.loanTotalAmount || 0) || 0;
  const totalMonths = parseInt(item?.loanTotalMonths || 0, 10) || 0;
  const start = item?.startPeriod || '';
  const end = item?.endPeriod || computeEndPeriodFromMonths(start, totalMonths);

  if (fullAmount <= 0 || totalMonths <= 0 || !start) {
    return { fullAmount, totalMonths, paidSoFar: 0, remainingAmount: fullAmount, monthsElapsed: 0, monthsRemaining: totalMonths };
  }

  const toIndex = (pk) => {
    const [y, m] = pk.split('-').map(Number);
    return y * 12 + (m - 1);
  };

  const startIdx = toIndex(start);
  const currentIdx = toIndex(periodKey);
  const endIdx = end ? toIndex(end) : startIdx + totalMonths - 1;

  if (currentIdx < startIdx) {
    return { fullAmount, totalMonths, paidSoFar: 0, remainingAmount: fullAmount, monthsElapsed: 0, monthsRemaining: totalMonths };
  }

  const effectiveEndIdx = Math.min(currentIdx, endIdx);
  const monthsElapsed = Math.min(totalMonths, Math.max(0, effectiveEndIdx - startIdx + 1));

  let paidSoFar = 0;
  for (let idx = startIdx; idx <= effectiveEndIdx; idx++) {
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    const pk = `${y}-${String(m).padStart(2, '0')}`;
    paidSoFar += resolveItemAmountForPeriod(item, pk);
  }

  const remainingAmount = Math.max(0, fullAmount - paidSoFar);
  const monthsRemaining = Math.max(0, totalMonths - monthsElapsed);

  return { fullAmount, totalMonths, paidSoFar, remainingAmount, monthsElapsed, monthsRemaining };
};
