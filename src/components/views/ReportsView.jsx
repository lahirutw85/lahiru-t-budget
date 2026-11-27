import { useState, useMemo } from 'react';
import {
  Calendar, ChevronDown, FileText, Download, TrendingUp, Wallet,
  CircleDollarSign, Landmark, ArrowUpRight, Search, CheckCircle2, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { convertCurrency, formatCurrency, formatExpenseDate, getTodayDateString } from '../../utils/currencyUtils';
import {
  normalizeBudgetCategories,
  resolveCategoryTotalForPeriod,
  resolveExpensesBudgetForSelection,
  DEFAULT_BILLS,
  getBillAmountForPeriodKey,
  resolveBillsTotalForSelection,
  getRecurringIncomeAmountForPeriod,
  resolveRecurringIncomeForSelection,
} from '../../utils/budgetUtils';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ReportsView
 * ──────────────────────────────────────────────────────────
 * Comprehensive financial report aggregating Dashboard, Income,
 * Expenses, Accounts, Bills, and Budget with Monthly/Yearly modes,
 * interactive Recharts, comparison metrics, PDF print, and CSV export.
 */
export const ReportsView = ({
  COLORS,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  years = [],
  ALL_MONTHS = [],
  currencies = [],
  expenses = [],
  incomes = [],
  computedBankAccounts = [],
  balancesByCurrency = {},
  plannedBudget = {},
  bills = [],
  recurringIncomes = [],
}) => {
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencyCode = defaultCurrencyObj.code;

  const formatLocal = (amount, cur = currencyCode) => formatCurrency(amount, cur, currencies);

  // Report filter state
  const [reportMode, setReportMode] = useState(selectedMonth === 'Full Year' ? 'yearly' : 'monthly');
  const [periodMode, setPeriodMode] = useState('Full Month'); // 'Full Month' | 'Custom Range'
  const [customStartDate, setCustomStartDate] = useState(`${selectedYear}-01-01`);
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('All'); // 'All' | 'Income' | 'Expense'

  const effectiveMonth = reportMode === 'yearly'
    ? 'Full Year'
    : (selectedMonth === 'Full Year' ? ALL_MONTHS[new Date().getMonth()] : selectedMonth);
  const monthIdx = ALL_MONTHS.indexOf(effectiveMonth);
  const periodKey = `${selectedYear}-${String((monthIdx >= 0 ? monthIdx : new Date().getMonth()) + 1).padStart(2, '0')}`;

  const handleModeSwitch = (mode) => {
    setReportMode(mode);
    if (mode === 'yearly') {
      setSelectedMonth('Full Year');
    } else if (selectedMonth === 'Full Year') {
      setSelectedMonth(ALL_MONTHS[new Date().getMonth()]);
    }
  };

  // Filter transactions for active period
  const { periodExpenses, periodIncomes } = useMemo(() => {
    const matches = (tx) => {
      if (!tx?.date) return false;
      if (periodMode === 'Custom Range') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
        return true;
      }
      const parts = tx.date.split('-');
      if (parts.length !== 3) return false;
      if (parts[0] !== selectedYear) return false;
      if (effectiveMonth === 'Full Year') return true;
      return ALL_MONTHS[parseInt(parts[1], 10) - 1] === effectiveMonth;
    };
    return {
      periodExpenses: expenses.filter(matches),
      periodIncomes: incomes.filter(matches),
    };
  }, [expenses, incomes, selectedYear, effectiveMonth, periodMode, customStartDate, customEndDate, ALL_MONTHS]);

  // ── 1. KPI AGGREGATIONS ──────────────────────────────────
  const actualIncome = useMemo(
    () => periodIncomes.reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0),
    [periodIncomes, currencyCode]
  );
  const scheduledIncome = useMemo(
    () => resolveRecurringIncomeForSelection(recurringIncomes, selectedYear, effectiveMonth, ALL_MONTHS),
    [recurringIncomes, selectedYear, effectiveMonth, ALL_MONTHS]
  );
  const incomeVariancePct = scheduledIncome > 0
    ? Math.round(((actualIncome - scheduledIncome) / scheduledIncome) * 100)
    : (actualIncome > 0 ? 100 : 0);

  const actualExpenses = useMemo(
    () => periodExpenses.reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0),
    [periodExpenses, currencyCode]
  );
  const plannedCategoryBudget = useMemo(
    () => resolveExpensesBudgetForSelection(plannedBudget, selectedYear, effectiveMonth, ALL_MONTHS),
    [plannedBudget, selectedYear, effectiveMonth, ALL_MONTHS]
  );
  const plannedBillsTotal = useMemo(
    () => resolveBillsTotalForSelection(bills, selectedYear, effectiveMonth, ALL_MONTHS),
    [bills, selectedYear, effectiveMonth, ALL_MONTHS]
  );
  const totalPlannedOutgoing = plannedCategoryBudget + plannedBillsTotal;

  // Add unpaid recurring bills to projected outgoing if viewing full plan comparison
  const netCashFlow = actualIncome - actualExpenses;
  const savingsRatePct = actualIncome > 0 ? Math.round((netCashFlow / actualIncome) * 100) : 0;

  // Liquid balances grouped by currency (never mixing currencies)
  const liquidBalancesList = useMemo(() => {
    const map = {};
    computedBankAccounts.forEach(acc => {
      if (acc.accountType !== 'Credit Card') {
        const cur = acc.currency || 'AED';
        map[cur] = (map[cur] || 0) + (parseFloat(acc.balance) || 0);
      }
    });
    Object.entries(balancesByCurrency).forEach(([cur, val]) => {
      if (map[cur] === undefined) map[cur] = val;
    });
    return Object.entries(map);
  }, [computedBankAccounts, balancesByCurrency]);

  // ── Monthly vs Yearly Comparison ─────────────────────────
  const compareMonthName = selectedMonth === 'Full Year' ? ALL_MONTHS[new Date().getMonth()] : selectedMonth;
  const compareMonthIdx = ALL_MONTHS.indexOf(compareMonthName);
  const compareMonthPrefix = `${selectedYear}-${String((compareMonthIdx >= 0 ? compareMonthIdx : 0) + 1).padStart(2, '0')}`;

  const monthlyTotals = useMemo(() => {
    const mInc = incomes
      .filter(i => i.date?.startsWith(compareMonthPrefix))
      .reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0);
    const mExp = expenses
      .filter(e => e.date?.startsWith(compareMonthPrefix))
      .reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0);
    const mBudget = resolveExpensesBudgetForSelection(plannedBudget, selectedYear, compareMonthName, ALL_MONTHS)
      + resolveBillsTotalForSelection(bills, selectedYear, compareMonthName, ALL_MONTHS);
    return { income: mInc, expenses: mExp, net: mInc - mExp, budget: mBudget };
  }, [incomes, expenses, compareMonthPrefix, currencyCode, plannedBudget, bills, selectedYear, compareMonthName, ALL_MONTHS]);

  const yearlyTotals = useMemo(() => {
    const yInc = incomes
      .filter(i => i.date?.startsWith(`${selectedYear}-`))
      .reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0);
    const yExp = expenses
      .filter(e => e.date?.startsWith(`${selectedYear}-`))
      .reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0);
    const yBudget = resolveExpensesBudgetForSelection(plannedBudget, selectedYear, 'Full Year', ALL_MONTHS)
      + resolveBillsTotalForSelection(bills, selectedYear, 'Full Year', ALL_MONTHS);
    return { income: yInc, expenses: yExp, net: yInc - yExp, budget: yBudget };
  }, [incomes, expenses, selectedYear, currencyCode, plannedBudget, bills, ALL_MONTHS]);

  // ── 2. CHARTS DATA ───────────────────────────────────────
  // Chart 1: Budget vs Actual Spending by Category (Horizontal Bar)
  const budgetVsActualData = useMemo(() => {
    const cats = normalizeBudgetCategories(plannedBudget?.categories);
    return cats.map(cat => {
      let planned = 0;
      if (effectiveMonth === 'Full Year') {
        for (let m = 1; m <= 12; m++) {
          planned += resolveCategoryTotalForPeriod(cat, `${selectedYear}-${String(m).padStart(2, '0')}`);
        }
      } else {
        planned = resolveCategoryTotalForPeriod(cat, periodKey);
      }
      const actual = periodExpenses
        .filter(e => (e.category || '').toLowerCase() === cat.name.toLowerCase())
        .reduce((s, e) => s + convertCurrency(parseFloat(e.amount) || 0, e.currency || 'AED', currencyCode), 0);
      const pct = planned > 0 ? Math.round((actual / planned) * 100) : (actual > 0 ? 101 : 0);
      return {
        name: cat.name,
        Planned: Number(planned.toFixed(2)),
        Actual: Number(actual.toFixed(2)),
        pct,
      };
    }).filter(r => r.Planned > 0 || r.Actual > 0);
  }, [plannedBudget, effectiveMonth, selectedYear, periodKey, periodExpenses, currencyCode]);

  // Chart 2: Total Outgoing Breakdown (Donut)
  const outgoingDonutData = useMemo(() => {
    const billsSource = Array.isArray(bills) && bills.length > 0 ? bills : DEFAULT_BILLS;
    const billNames = new Set(billsSource.map(b => b.name.toLowerCase()));
    let fixedBills = 0;
    let savingsInv = 0;
    let giving = 0;
    let variableLiving = 0;

    periodExpenses.forEach(e => {
      const amt = convertCurrency(parseFloat(e.amount) || 0, e.currency || 'AED', currencyCode);
      const catLower = (e.category || '').toLowerCase();
      if (billNames.has(catLower) || (e.subCategory || '').toLowerCase() === 'bill') {
        fixedBills += amt;
      } else if (catLower.includes('investment') || catLower.includes('emergency')) {
        savingsInv += amt;
      } else if (catLower.includes('give')) {
        giving += amt;
      } else {
        variableLiving += amt;
      }
    });

    const segments = [
      { name: 'Fixed Recurring Bills', value: Number(fixedBills.toFixed(2)), color: COLORS.purple },
      { name: 'Savings & Investments', value: Number(savingsInv.toFixed(2)), color: COLORS.skyBlue },
      { name: 'Giving', value: Number(giving.toFixed(2)), color: COLORS.green },
      { name: 'Variable Living', value: Number(variableLiving.toFixed(2)), color: COLORS.orange },
    ].filter(s => s.value > 0);

    return segments.length > 0 ? segments : [{ name: 'No Outgoing Yet', value: 1, color: '#1F2937' }];
  }, [periodExpenses, bills, currencyCode, COLORS]);

  // Chart 3: 12-Month Income vs Expenses & Net Trend
  const trendData = useMemo(() => {
    return SHORT_MONTHS.map((mLabel, idx) => {
      const prefix = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const inc = incomes
        .filter(i => i.date?.startsWith(prefix))
        .reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0);
      const exp = expenses
        .filter(e => e.date?.startsWith(prefix))
        .reduce((s, t) => s + convertCurrency(parseFloat(t.amount) || 0, t.currency || 'AED', currencyCode), 0);
      return {
        month: mLabel,
        Income: Number(inc.toFixed(2)),
        Expenses: Number(exp.toFixed(2)),
        Net: Number((inc - exp).toFixed(2)),
      };
    });
  }, [incomes, expenses, selectedYear, currencyCode]);

  // Chart 4: Account-Wise Cash Flow & Balance Distribution
  const accountFlowData = useMemo(() => {
    return computedBankAccounts.map(acc => {
      let detailVal = acc.accountType;
      if (acc.branch) detailVal += ` - ${acc.branch}`;
      const expectedBase = `${acc.bankName} (${detailVal}`.trim().toLowerCase();

      const inflows = periodIncomes
        .filter(i => i.bankName && i.bankName.trim().toLowerCase().startsWith(expectedBase))
        .reduce((s, i) => s + convertCurrency(parseFloat(i.amount) || 0, i.currency || acc.currency, acc.currency), 0);

      const outflows = periodExpenses
        .filter(e => e.bankName && e.bankName.trim().toLowerCase().startsWith(expectedBase))
        .reduce((s, e) => s + convertCurrency(parseFloat(e.amount) || 0, e.currency || acc.currency, acc.currency), 0);

      const balance = acc.accountType === 'Credit Card' ? (acc.remainingLimit || 0) : (acc.balance || 0);
      return {
        name: `${acc.bankName} (${acc.currency})`,
        Inflows: Number(inflows.toFixed(2)),
        Outflows: Number(outflows.toFixed(2)),
        Balance: Number(balance.toFixed(2)),
      };
    });
  }, [computedBankAccounts, periodIncomes, periodExpenses]);

  // ── 3. DETAILED TABLES ───────────────────────────────────
  const recurringTrackerRows = useMemo(() => {
    const billsSource = Array.isArray(bills) && bills.length > 0 ? bills : DEFAULT_BILLS;
    const incRows = (recurringIncomes || []).map(r => ({
      id: r.id,
      type: 'Income',
      name: r.name,
      amount: getRecurringIncomeAmountForPeriod(r, periodKey),
      currency: r.currency || currencyCode,
      day: r.receiveDay ? `Day ${r.receiveDay}` : r.frequency || 'Monthly',
      bankAccount: r.bankAccount || 'Cash',
      done: Boolean(r.confirmedMonths?.[periodKey]),
    }));
    const billRows = billsSource.map(b => ({
      id: b.id,
      type: 'Bill',
      name: b.name,
      amount: getBillAmountForPeriodKey(b, periodKey),
      currency: currencyCode,
      day: b.dueDay ? `Due Day ${b.dueDay}` : 'Monthly',
      bankAccount: b.bankAccount || 'Cash',
      done: Boolean(b.paidMonths?.[periodKey]),
    }));
    return [...incRows, ...billRows];
  }, [recurringIncomes, bills, periodKey, currencyCode]);

  const topSubcategories = useMemo(() => {
    const map = {};
    periodExpenses.forEach(e => {
      const sub = e.subCategory || e.category || 'General';
      const amt = convertCurrency(parseFloat(e.amount) || 0, e.currency || 'AED', currencyCode);
      if (!map[sub]) map[sub] = { name: sub, category: e.category, count: 0, total: 0, notes: e.notes || '' };
      map[sub].count += 1;
      map[sub].total += amt;
      if (!map[sub].notes && e.notes) map[sub].notes = e.notes;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [periodExpenses, currencyCode]);

  const fullLedger = useMemo(() => {
    const combined = [
      ...periodIncomes.map(i => ({ ...i, txType: 'Income' })),
      ...periodExpenses.map(e => ({ ...e, txType: 'Expense' })),
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return combined.filter(tx => {
      if (ledgerTypeFilter !== 'All' && tx.txType !== ledgerTypeFilter) return false;
      if (!ledgerSearch.trim()) return true;
      const q = ledgerSearch.toLowerCase();
      return (
        (tx.category || '').toLowerCase().includes(q) ||
        (tx.subCategory || '').toLowerCase().includes(q) ||
        (tx.notes || '').toLowerCase().includes(q) ||
        (tx.bankName || tx.account || '').toLowerCase().includes(q)
      );
    });
  }, [periodIncomes, periodExpenses, ledgerTypeFilter, ledgerSearch]);

  // ── EXPORTS ──────────────────────────────────────────────
  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['LT BUDGET MASTER - FINANCIAL REPORT', `${effectiveMonth} ${selectedYear}`],
      [],
      ['SUMMARY KPI', 'AMOUNT', 'CURRENCY'],
      ['Actual Income', actualIncome.toFixed(2), currencyCode],
      ['Scheduled Income', scheduledIncome.toFixed(2), currencyCode],
      ['Actual Outgoing', actualExpenses.toFixed(2), currencyCode],
      ['Planned Budget (Categories + Bills)', totalPlannedOutgoing.toFixed(2), currencyCode],
      ['Net Cash Flow', netCashFlow.toFixed(2), currencyCode],
      ['Savings Rate (%)', `${savingsRatePct}%`, ''],
      [],
      ['FULL LEDGER'],
      ['Date', 'Type', 'Category', 'SubCategory', 'Account', 'Notes', 'Amount', 'Currency'],
      ...fullLedger.map(tx => [
        tx.date || '',
        tx.txType,
        tx.category || '',
        tx.subCategory || '',
        tx.bankName || tx.account || 'Cash',
        (tx.notes || '').replace(/"/g, '""'),
        (parseFloat(tx.amount) || 0).toFixed(2),
        tx.currency || currencyCode,
      ]),
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell)}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LT-Budget-Report-${selectedYear}-${effectiveMonth.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Top Filter & Export Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            Comprehensive analytics for <span style={{ color: COLORS.textPrimary }}>{periodMode === 'Custom Range' ? `${customStartDate} to ${customEndDate}` : `${effectiveMonth} ${selectedYear}`}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Monthly / Yearly Report Toggle */}
          <div className="flex rounded-lg border p-0.5" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <button
              type="button"
              onClick={() => handleModeSwitch('monthly')}
              className="px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors"
              style={{
                backgroundColor: reportMode === 'monthly' ? COLORS.skyBlue : 'transparent',
                color: reportMode === 'monthly' ? '#0B0F19' : COLORS.textSecondary,
              }}
            >
              Monthly Report
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('yearly')}
              className="px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors"
              style={{
                backgroundColor: reportMode === 'yearly' ? COLORS.skyBlue : 'transparent',
                color: reportMode === 'yearly' ? '#0B0F19' : COLORS.textSecondary,
              }}
            >
              Yearly Report
            </button>
          </div>

          {/* Year */}
          <div className="flex items-center px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <Calendar className="w-4 h-4 mr-2" style={{ color: COLORS.skyBlue }} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-none outline-none font-medium appearance-none pr-4 cursor-pointer"
              style={{ color: COLORS.textPrimary }}
            >
              {years.map(y => (
                <option key={y} value={y} style={{ backgroundColor: COLORS.bgCard }}>{y}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }} />
          </div>

          {/* Month */}
          {reportMode === 'monthly' && (
            <div className="flex items-center px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
              <select
                value={effectiveMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none outline-none font-medium appearance-none pr-4 cursor-pointer"
                style={{ color: COLORS.textPrimary }}
              >
                {ALL_MONTHS.map(m => (
                  <option key={m} value={m} style={{ backgroundColor: COLORS.bgCard }}>{m}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }} />
            </div>
          )}

          {/* Period */}
          <div className="flex items-center px-3 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <select
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value)}
              className="bg-transparent border-none outline-none font-medium appearance-none pr-4 cursor-pointer"
              style={{ color: COLORS.textPrimary }}
            >
              <option value="Full Month" style={{ backgroundColor: COLORS.bgCard }}>Full Period</option>
              <option value="Custom Range" style={{ backgroundColor: COLORS.bgCard }}>Custom Range</option>
            </select>
            <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }} />
          </div>

          {periodMode === 'Custom Range' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border text-xs"
                style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard, color: COLORS.textPrimary }}
              />
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border text-xs"
                style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard, color: COLORS.textPrimary }}
              />
            </div>
          )}

          {/* Export Buttons */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer hover:opacity-90"
            style={{ backgroundColor: COLORS.red, color: '#FFFFFF' }}
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer hover:opacity-90"
            style={{ backgroundColor: COLORS.green, color: '#FFFFFF' }}
          >
            <Download className="w-4 h-4" />
            Export CSV/Excel
          </button>
        </div>
      </div>

      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div className="flex justify-between items-start mb-3">
            <CircleDollarSign className="w-5 h-5" style={{ color: COLORS.green }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10" style={{ color: COLORS.green }}>
              {incomeVariancePct >= 0 ? `+${incomeVariancePct}%` : `${incomeVariancePct}%`} vs Plan
            </span>
          </div>
          <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Total Income (Actual / Scheduled)</div>
          <div className="text-2xl font-bold" style={{ color: COLORS.green }}>{formatLocal(actualIncome)}</div>
          <div className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>Scheduled: {formatLocal(scheduledIncome)}</div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div className="flex justify-between items-start mb-3">
            <Wallet className="w-5 h-5" style={{ color: COLORS.red }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/10" style={{ color: COLORS.red }}>
              {totalPlannedOutgoing > 0 ? Math.round((actualExpenses / totalPlannedOutgoing) * 100) : 0}% of Plan
            </span>
          </div>
          <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Total Outgoing (Expenses + Bills)</div>
          <div className="text-2xl font-bold" style={{ color: COLORS.red }}>{formatLocal(actualExpenses)}</div>
          <div className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>Planned: {formatLocal(totalPlannedOutgoing)}</div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div className="flex justify-between items-start mb-3">
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.skyBlue }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-500/10" style={{ color: COLORS.skyBlue }}>
              Savings: {savingsRatePct}%
            </span>
          </div>
          <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Net Cash Flow</div>
          <div className="text-2xl font-bold" style={{ color: netCashFlow >= 0 ? COLORS.skyBlue : COLORS.red }}>
            {formatLocal(netCashFlow)}
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Planned Net: {formatLocal(scheduledIncome - totalPlannedOutgoing)}
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div className="flex justify-between items-start mb-3">
            <Landmark className="w-5 h-5" style={{ color: COLORS.yellow }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10" style={{ color: COLORS.yellow }}>
              {liquidBalancesList.length} Currencies
            </span>
          </div>
          <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Liquid Balance Across Accounts</div>
          <div className="space-y-1 mt-1">
            {liquidBalancesList.length === 0 ? (
              <div className="text-xl font-bold" style={{ color: COLORS.yellow }}>{formatLocal(0)}</div>
            ) : (
              liquidBalancesList.map(([cur, bal]) => (
                <div key={cur} className="flex justify-between text-sm font-bold" style={{ color: COLORS.yellow }}>
                  <span>{cur}:</span>
                  <span>{formatLocal(bal, cur)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly vs Yearly Comparison Card */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <h2 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.textPrimary }}>
          <ArrowUpRight className="w-4 h-4" style={{ color: COLORS.skyBlue }} />
          Monthly vs. Yearly Comparison ({compareMonthName} {selectedYear} vs. Full Year {selectedYear})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Income', mVal: monthlyTotals.income, yVal: yearlyTotals.income, color: COLORS.green },
            { label: 'Actual Outgoing', mVal: monthlyTotals.expenses, yVal: yearlyTotals.expenses, color: COLORS.red },
            { label: 'Planned Budget + Bills', mVal: monthlyTotals.budget, yVal: yearlyTotals.budget, color: COLORS.orange },
            { label: 'Net Balance', mVal: monthlyTotals.net, yVal: yearlyTotals.net, color: COLORS.skyBlue },
          ].map((row, idx) => {
            const sharePct = row.yVal !== 0 ? Math.round((row.mVal / row.yVal) * 100) : 0;
            return (
              <div key={idx} className="p-4 rounded-xl border" style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border }}>
                <div className="text-xs font-bold uppercase mb-2" style={{ color: COLORS.textSecondary }}>{row.label}</div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: COLORS.textSecondary }}>{compareMonthName}:</span>
                  <span className="font-bold" style={{ color: row.color }}>{formatLocal(row.mVal)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: COLORS.textSecondary }}>Full Year {selectedYear}:</span>
                  <span className="font-bold" style={{ color: COLORS.textPrimary }}>{formatLocal(row.yVal)}</span>
                </div>
                <div className="text-[11px] mt-1.5 pt-1.5 border-t" style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                  Month share of year: <strong style={{ color: COLORS.textPrimary }}>{sharePct}%</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Charts Row A: Budget vs Actual & Outgoing Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-base font-bold mb-1" style={{ color: COLORS.textPrimary }}>
            Budget vs. Actual Spending by Category
          </h2>
          <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>
            Amber &gt; 80% of budget • Red &gt; 100% of budget
          </p>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke={COLORS.textSecondary} fontSize={11} />
                <YAxis dataKey="name" type="category" width={110} stroke={COLORS.textSecondary} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: '8px', color: COLORS.textPrimary }}
                  formatter={(val) => formatLocal(val)}
                />
                <Legend />
                <Bar dataKey="Planned" fill={COLORS.skyBlue} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Actual" radius={[0, 4, 4, 0]}>
                  {budgetVsActualData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.pct > 100 ? COLORS.red : entry.pct > 80 ? COLORS.orange : COLORS.green}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl border flex flex-col" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-base font-bold mb-1" style={{ color: COLORS.textPrimary }}>
            Total Outgoing Breakdown
          </h2>
          <p className="text-xs mb-4" style={{ color: COLORS.textSecondary }}>
            Share across Fixed Bills, Savings &amp; Investments, Giving, and Variable Living
          </p>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={outgoingDonutData} innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                  {outgoingDonutData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: '8px', color: COLORS.textPrimary }}
                  formatter={(val) => formatLocal(val)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {outgoingDonutData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs px-2 py-1 rounded" style={{ backgroundColor: COLORS.bgMain }}>
                <span className="flex items-center gap-1.5 truncate" style={{ color: COLORS.textPrimary }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold ml-2 shrink-0" style={{ color: COLORS.textSecondary }}>
                  {item.name === 'No Outgoing Yet' ? formatLocal(0) : formatLocal(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Charts Row B: 12-Month Trend & Account Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-base font-bold mb-4" style={{ color: COLORS.textPrimary }}>
            Income vs. Expenses &amp; Net Savings Trend ({selectedYear})
          </h2>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke={COLORS.textSecondary} fontSize={11} />
                <YAxis stroke={COLORS.textSecondary} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: '8px', color: COLORS.textPrimary }}
                  formatter={(val) => formatLocal(val)}
                />
                <Legend />
                <Area type="monotone" dataKey="Income" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.18} />
                <Area type="monotone" dataKey="Expenses" stroke={COLORS.red} fill={COLORS.red} fillOpacity={0.18} />
                <Area type="monotone" dataKey="Net" stroke={COLORS.skyBlue} fill={COLORS.skyBlue} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-base font-bold mb-4" style={{ color: COLORS.textPrimary }}>
            Account-Wise Cash Flow &amp; Balance Distribution
          </h2>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke={COLORS.textSecondary} fontSize={10} />
                <YAxis stroke={COLORS.textSecondary} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: '8px', color: COLORS.textPrimary }} />
                <Legend />
                <Bar dataKey="Inflows" stackId="a" fill={COLORS.green} />
                <Bar dataKey="Outflows" stackId="a" fill={COLORS.red} />
                <Bar dataKey="Balance" fill={COLORS.skyBlue} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Bills & Income Status Tracker */}
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-base font-bold mb-4" style={{ color: COLORS.textPrimary }}>
            Recurring Bills &amp; Income Status Tracker
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                  <th className="pb-2.5 pr-3">Item</th>
                  <th className="pb-2.5 pr-3">Schedule</th>
                  <th className="pb-2.5 pr-3">Account</th>
                  <th className="pb-2.5 pr-3 text-right">Amount</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                {recurringTrackerRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 pr-3 font-semibold" style={{ color: COLORS.textPrimary }}>
                      {row.name} <span className="opacity-60">({row.type})</span>
                    </td>
                    <td className="py-2.5 pr-3" style={{ color: COLORS.textSecondary }}>{row.day}</td>
                    <td className="py-2.5 pr-3 truncate max-w-[140px]" style={{ color: COLORS.textSecondary }}>{row.bankAccount}</td>
                    <td className="py-2.5 pr-3 text-right font-bold" style={{ color: row.type === 'Income' ? COLORS.green : COLORS.textPrimary }}>
                      {formatLocal(row.amount, row.currency)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: row.done ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: row.done ? COLORS.green : COLORS.orange,
                        }}
                      >
                        {row.done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {row.done ? (row.type === 'Income' ? 'Confirmed' : 'Paid') : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Subcategories Table */}
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-base font-bold mb-4" style={{ color: COLORS.textPrimary }}>
            Top Spending Subcategories
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                  <th className="pb-2.5 pr-3">SubCategory</th>
                  <th className="pb-2.5 pr-3 text-center">Txns</th>
                  <th className="pb-2.5 pr-3 text-right">Total</th>
                  <th className="pb-2.5 text-right">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                {topSubcategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center" style={{ color: COLORS.textSecondary }}>
                      No spending recorded in this period.
                    </td>
                  </tr>
                ) : (
                  topSubcategories.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-3 font-semibold" style={{ color: COLORS.textPrimary }}>
                        {row.name} <span className="opacity-60 font-normal">({row.category})</span>
                      </td>
                      <td className="py-2.5 pr-3 text-center" style={{ color: COLORS.textSecondary }}>{row.count}</td>
                      <td className="py-2.5 pr-3 text-right font-bold" style={{ color: COLORS.red }}>{formatLocal(row.total)}</td>
                      <td className="py-2.5 text-right" style={{ color: COLORS.textSecondary }}>
                        {actualExpenses > 0 ? Math.round((row.total / actualExpenses) * 100) : 0}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Ledger Summary */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold" style={{ color: COLORS.textPrimary }}>
            Full Ledger Summary ({fullLedger.length} transactions)
          </h2>
          <div className="flex items-center gap-2 no-print">
            <div className="flex items-center px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgMain }}>
              <Search className="w-3.5 h-3.5 mr-2" style={{ color: COLORS.textSecondary }} />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Filter category, account, notes..."
                className="bg-transparent focus:outline-none w-44"
                style={{ color: COLORS.textPrimary }}
              />
            </div>
            <select
              value={ledgerTypeFilter}
              onChange={(e) => setLedgerTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgMain, color: COLORS.textPrimary }}
            >
              <option value="All">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                <th className="pb-2.5 px-3">Date</th>
                <th className="pb-2.5 px-3">Type</th>
                <th className="pb-2.5 px-3">Category</th>
                <th className="pb-2.5 px-3">SubCategory</th>
                <th className="pb-2.5 px-3">Account</th>
                <th className="pb-2.5 px-3">Notes</th>
                <th className="pb-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {fullLedger.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center" style={{ color: COLORS.textSecondary }}>
                    No transactions match the current filter.
                  </td>
                </tr>
              ) : (
                fullLedger.map((tx) => (
                  <tr key={`${tx.txType}-${tx.id}`}>
                    <td className="py-2.5 px-3" style={{ color: COLORS.textPrimary }}>{formatExpenseDate(tx.date)}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: tx.txType === 'Income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: tx.txType === 'Income' ? COLORS.green : COLORS.red,
                        }}
                      >
                        {tx.txType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3" style={{ color: COLORS.textPrimary }}>{tx.category}</td>
                    <td className="py-2.5 px-3" style={{ color: COLORS.textSecondary }}>{tx.subCategory}</td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate" style={{ color: COLORS.textSecondary }}>
                      {tx.bankName || tx.account || 'Cash'}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate" style={{ color: COLORS.textSecondary }}>{tx.notes}</td>
                    <td
                      className="py-2.5 px-3 text-right font-bold"
                      style={{ color: tx.txType === 'Income' ? COLORS.green : COLORS.red }}
                    >
                      {tx.txType === 'Income' ? '+' : '-'} {formatLocal(tx.amount, tx.currency || currencyCode)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
