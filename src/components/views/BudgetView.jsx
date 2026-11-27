import { useState, useEffect } from 'react';
import { Folder, TrendingUp, CircleDollarSign, Wallet, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * BudgetView
 * ──────────────────────────────────────────────────────────
 * Lets the user configure their planned monthly income and
 * expense budgets. Persists via Dashboard settings (localStorage +
 * Google Sheets) and drives the Dashboard Monthly Comparison card.
 */
export const BudgetView = ({
  COLORS,
  plannedBudget,
  setPlannedBudget,
  currencies,
  selectedMonth,
  selectedYear,
  dashboardFilteredIncomes,
  dashboardFilteredExpenses,
}) => {
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencyCode = defaultCurrencyObj.code;

  const [incomeInput, setIncomeInput] = useState(String(plannedBudget?.income ?? 0));
  const [expenseInput, setExpenseInput] = useState(String(plannedBudget?.expenses ?? 0));
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setIncomeInput(String(plannedBudget?.income ?? 0));
    setExpenseInput(String(plannedBudget?.expenses ?? 0));
  }, [plannedBudget]);

  const parsedIncome = Math.max(0, parseFloat(incomeInput) || 0);
  const parsedExpenses = Math.max(0, parseFloat(expenseInput) || 0);
  const plannedNet = parsedIncome - parsedExpenses;

  const actualIncome = dashboardFilteredIncomes.totalInCurrency(currencyCode);
  const actualExpenses = dashboardFilteredExpenses.totalInCurrency(currencyCode);
  const actualNet = actualIncome - actualExpenses;

  const handleSave = (e) => {
    e.preventDefault();
    setPlannedBudget({
      income: parsedIncome,
      expenses: parsedExpenses,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.textPrimary }}>
            <Folder className="w-7 h-7" style={{ color: COLORS.orange }} />
            Planning Budget
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            Set your planned monthly targets in <span style={{ color: COLORS.textPrimary }}>{currencyCode}</span>. Dashboard Monthly Comparison projects from these values.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSave}
        className="p-6 lg:p-8 rounded-2xl border space-y-6"
        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Planned Monthly Income */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.green }}>
              <CircleDollarSign className="w-4 h-4" />
              Planned Monthly Income ({currencyCode})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
              style={{
                backgroundColor: COLORS.bgMain,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
              }}
            />
          </div>

          {/* Planned Monthly Expenses */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.red }}>
              <Wallet className="w-4 h-4" />
              Planned Monthly Expenses ({currencyCode})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={expenseInput}
              onChange={(e) => setExpenseInput(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
              style={{
                backgroundColor: COLORS.bgMain,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
              }}
            />
          </div>
        </div>

        {/* Planned Net Summary */}
        <div
          className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
            Planned Monthly Net Savings
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: plannedNet >= 0 ? COLORS.skyBlue : COLORS.red }}
          >
            {formatCurrency(plannedNet, currencyCode, currencies)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          {savedBanner ? (
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLORS.green }}>
              <CheckCircle2 className="w-4 h-4" />
              Planning budget saved!
            </span>
          ) : (
            <span className="text-xs" style={{ color: COLORS.textSecondary }}>
              For Full Year view on Dashboard, monthly targets are multiplied by 12.
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer shrink-0"
            style={{ backgroundColor: COLORS.skyBlue, color: '#0B0F19' }}
          >
            Save Budget Plan
          </button>
        </div>
      </form>

      {/* Current Period Snapshot */}
      <div
        className="p-6 rounded-2xl border"
        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
      >
        <h2 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.textPrimary }}>
          <TrendingUp className="w-4 h-4" style={{ color: COLORS.skyBlue }} />
          Current Period Snapshot ({selectedMonth} {selectedYear})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgMain }}>
            <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Actual Income (to date)</div>
            <div className="text-lg font-bold" style={{ color: COLORS.green }}>
              {formatCurrency(actualIncome, currencyCode, currencies)}
            </div>
          </div>
          <div className="p-4 rounded-xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgMain }}>
            <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Actual Expenses (to date)</div>
            <div className="text-lg font-bold" style={{ color: COLORS.red }}>
              {formatCurrency(actualExpenses, currencyCode, currencies)}
            </div>
          </div>
          <div className="p-4 rounded-xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgMain }}>
            <div className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Actual Net (to date)</div>
            <div className="text-lg font-bold" style={{ color: actualNet >= 0 ? COLORS.skyBlue : COLORS.red }}>
              {formatCurrency(actualNet, currencyCode, currencies)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
