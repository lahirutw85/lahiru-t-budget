import { useState, useMemo } from 'react';
import { Folder, TrendingUp, Plus, X, Landmark, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

export const DEFAULT_BUDGET_CATEGORIES = [
  { id: 'cat-food', name: 'Food', details: '', amount: 0, bankAccount: '' },
  { id: 'cat-ai', name: 'AI', details: '', amount: 0, bankAccount: '' },
  { id: 'cat-transportation', name: 'Transportation', details: 'Bus Taxi Car', amount: 0, bankAccount: '' },
  { id: 'cat-shopping', name: 'Shopping', details: 'Appliances Furniture Kitchen Toiletries Cloth', amount: 0, bankAccount: '' },
  { id: 'cat-emergency-fund', name: 'Emergency Fund', details: '', amount: 0, bankAccount: '' },
  { id: 'cat-give', name: 'Give', details: 'Tithe Donation Family Naomi', amount: 0, bankAccount: '' },
  { id: 'cat-mobile', name: 'Mobile', details: '', amount: 0, bankAccount: '' },
  { id: 'cat-investment', name: 'Investment', details: '', amount: 0, bankAccount: '' },
  { id: 'cat-loan', name: 'Loan', details: 'DIB Loan ENDB CARD DIB CARD', amount: 0, bankAccount: '' },
  { id: 'cat-house-rent', name: 'House Rent', details: '', amount: 0, bankAccount: '' },
];

/**
 * BudgetView
 * ──────────────────────────────────────────────────────────
 * Lets the user configure their planned monthly income, expenses,
 * and itemized budget categories (with amount + bank account).
 * Double-clicking any category row opens it for editing.
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
  computedBankAccounts = [],
}) => {
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencyCode = defaultCurrencyObj.code;

  const categories = useMemo(() => {
    if (Array.isArray(plannedBudget?.categories) && plannedBudget.categories.length > 0) {
      return plannedBudget.categories;
    }
    return DEFAULT_BUDGET_CATEGORIES;
  }, [plannedBudget]);

  // Build flat list of bank account options from existing computedBankAccounts
  const bankAccountOptions = useMemo(() => {
    const options = [];
    computedBankAccounts.forEach(acc => {
      let base = `${acc.bankName} (${acc.accountType}`;
      if (acc.branch) base += ` - ${acc.branch}`;

      if (acc.accountType !== 'Credit Card' && Array.isArray(acc.accountNumbers) && acc.accountNumbers.length > 0) {
        const validNums = acc.accountNumbers.filter(n => n && n.trim());
        if (validNums.length > 0) {
          validNums.forEach(accNo => {
            options.push(`${base} - Acc: ${accNo})`);
          });
          return;
        }
      }
      options.push(`${base})`);
    });
    return options;
  }, [computedBankAccounts]);

  // Modal state for adding or editing (on double-click) a budget category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catName, setCatName] = useState('');
  const [catDetails, setCatDetails] = useState('');
  const [catAmount, setCatAmount] = useState('0');
  const [catBankAccount, setCatBankAccount] = useState('');

  const totalCategoryBudget = categories.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  const actualIncome = dashboardFilteredIncomes.totalInCurrency(currencyCode);
  const actualExpenses = dashboardFilteredExpenses.totalInCurrency(currencyCode);
  const actualNet = actualIncome - actualExpenses;

  const openNewCategoryModal = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDetails('');
    setCatAmount('0');
    setCatBankAccount('');
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name || '');
    setCatDetails(cat.details || '');
    setCatAmount(String(cat.amount ?? 0));
    setCatBankAccount(cat.bankAccount || '');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const trimmedName = catName.trim();
    if (!trimmedName) {
      alert('Please enter a category name.');
      return;
    }
    const numericAmount = Math.max(0, parseFloat(catAmount) || 0);

    let updatedCategories;
    if (editingCatId) {
      updatedCategories = categories.map(c =>
        c.id === editingCatId
          ? { ...c, name: trimmedName, details: catDetails.trim(), amount: numericAmount, bankAccount: catBankAccount }
          : c
      );
    } else {
      updatedCategories = [
        ...categories,
        {
          id: `cat-${Date.now()}`,
          name: trimmedName,
          details: catDetails.trim(),
          amount: numericAmount,
          bankAccount: catBankAccount,
        },
      ];
    }

    const newExpensesTotal = updatedCategories.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    setPlannedBudget({
      ...plannedBudget,
      expenses: newExpensesTotal,
      categories: updatedCategories,
    });
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (id) => {
    const updatedCategories = categories.filter(c => c.id !== id);
    const newExpensesTotal = updatedCategories.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    setPlannedBudget({
      ...plannedBudget,
      expenses: newExpensesTotal,
      categories: updatedCategories,
    });
    setIsCatModalOpen(false);
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
            Set your planned monthly category allocations in <span style={{ color: COLORS.textPrimary }}>{currencyCode}</span>.
          </p>
        </div>
      </div>

      {/* Budget Categories List */}
      <div
        className="p-6 rounded-2xl border"
        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Budget Categories
            </h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
              Double-click any category to edit its amount and linked bank account. Total: <span className="font-bold" style={{ color: COLORS.textPrimary }}>{formatCurrency(totalCategoryBudget, currencyCode, currencies)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={openNewCategoryModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer shrink-0"
            style={{ backgroundColor: COLORS.orange, color: '#0B0F19' }}
          >
            <Plus className="w-4 h-4" />
            Create New Category
          </button>
        </div>

        <div className="divide-y" style={{ borderColor: COLORS.border }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onDoubleClick={() => openEditCategoryModal(cat)}
              title="Double-click to edit category"
              className="py-3.5 px-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-white/5 select-none"
            >
              <div className="min-w-0">
                <div className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>
                  {cat.name}
                </div>
                {cat.details && (
                  <div className="text-xs mt-0.5 truncate" style={{ color: COLORS.textSecondary }}>
                    {cat.details}
                  </div>
                )}
                {cat.bankAccount && (
                  <div className="flex items-center gap-1.5 text-[11px] mt-1 font-medium" style={{ color: COLORS.skyBlue }}>
                    <Landmark className="w-3 h-3 shrink-0" />
                    <span className="truncate">{cat.bankAccount}</span>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0 font-bold text-base" style={{ color: COLORS.textPrimary }}>
                {formatCurrency(parseFloat(cat.amount) || 0, currencyCode, currencies)}
              </div>
            </div>
          ))}
        </div>
      </div>

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

      {/* Add / Edit Budget Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
          >
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: COLORS.border }}>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                {editingCatId ? 'Edit Budget Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                style={{ color: COLORS.textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Food, House Rent"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Sub-items / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={catDetails}
                  onChange={(e) => setCatDetails(e.target.value)}
                  placeholder="e.g. Bus Taxi Car"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Planned Amount ({currencyCode})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={catAmount}
                  onChange={(e) => setCatAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Bank Account
                </label>
                <select
                  value={catBankAccount}
                  onChange={(e) => setCatBankAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                >
                  <option value="">-- Select Bank Account --</option>
                  <option value="Cash">Cash</option>
                  {bankAccountOptions.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                {editingCatId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(editingCatId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500/10 cursor-pointer"
                    style={{ color: COLORS.red }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer hover:opacity-80"
                    style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: COLORS.skyBlue, color: '#0B0F19' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
