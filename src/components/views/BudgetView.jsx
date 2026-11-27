import { useState, useMemo } from 'react';
import { Folder, TrendingUp, Plus, X, Landmark, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const makeSub = (id, name, amount = 0, bankAccount = '') => ({
  id,
  name,
  amount,
  bankAccount,
});

export const DEFAULT_BUDGET_CATEGORIES = [
  { id: 'cat-food', name: 'Food', amount: 0, bankAccount: '', subCategories: [] },
  { id: 'cat-ai', name: 'AI', amount: 0, bankAccount: '', subCategories: [] },
  {
    id: 'cat-transportation',
    name: 'Transportation',
    amount: 0,
    bankAccount: '',
    subCategories: [
      makeSub('sub-bus', 'Bus'),
      makeSub('sub-taxi', 'Taxi'),
      makeSub('sub-car', 'Car'),
    ],
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    amount: 0,
    bankAccount: '',
    subCategories: [
      makeSub('sub-appliances', 'Appliances'),
      makeSub('sub-furniture', 'Furniture'),
      makeSub('sub-kitchen', 'Kitchen'),
      makeSub('sub-toiletries', 'Toiletries'),
      makeSub('sub-cloth', 'Cloth'),
    ],
  },
  { id: 'cat-emergency-fund', name: 'Emergency Fund', amount: 0, bankAccount: '', subCategories: [] },
  {
    id: 'cat-give',
    name: 'Give',
    amount: 0,
    bankAccount: '',
    subCategories: [
      makeSub('sub-tithe', 'Tithe'),
      makeSub('sub-donation', 'Donation'),
      makeSub('sub-family', 'Family'),
      makeSub('sub-naomi', 'Naomi'),
    ],
  },
  { id: 'cat-mobile', name: 'Mobile', amount: 0, bankAccount: '', subCategories: [] },
  { id: 'cat-investment', name: 'Investment', amount: 0, bankAccount: '', subCategories: [] },
  {
    id: 'cat-loan',
    name: 'Loan',
    amount: 0,
    bankAccount: '',
    subCategories: [
      makeSub('sub-dib-loan', 'DIB Loan'),
      makeSub('sub-endb-card', 'ENDB CARD'),
      makeSub('sub-dib-card', 'DIB CARD'),
    ],
  },
  { id: 'cat-house-rent', name: 'House Rent', amount: 0, bankAccount: '', subCategories: [] },
];

const getCategoryTotal = (cat) => {
  if (Array.isArray(cat.subCategories) && cat.subCategories.length > 0) {
    return cat.subCategories.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }
  return parseFloat(cat.amount) || 0;
};

/**
 * BudgetView
 * ──────────────────────────────────────────────────────────
 * Lets the user configure planned monthly budget categories
 * and sub-categories (with amount + bank account).
 * - Single-click a category with sub-categories to expand/collapse.
 * - Double-click any category or sub-category row to edit it.
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
    const raw = Array.isArray(plannedBudget?.categories) && plannedBudget.categories.length > 0
      ? plannedBudget.categories
      : DEFAULT_BUDGET_CATEGORIES;

    // Normalize legacy entries that had `details` string instead of `subCategories`
    return raw.map(cat => {
      if (Array.isArray(cat.subCategories)) return cat;
      const defaultMatch = DEFAULT_BUDGET_CATEGORIES.find(d => d.id === cat.id || d.name === cat.name);
      if (defaultMatch && defaultMatch.subCategories.length > 0) {
        return { ...cat, subCategories: defaultMatch.subCategories };
      }
      if (cat.details && cat.details.trim()) {
        const parts = cat.details.trim().split(/\s+/);
        return {
          ...cat,
          subCategories: parts.map((p, idx) => makeSub(`${cat.id}-sub-${idx}`, p)),
        };
      }
      return { ...cat, subCategories: [] };
    });
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

  // Expanded categories map
  const [expandedCatIds, setExpandedCatIds] = useState({});

  // Modal state for adding/editing a category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catName, setCatName] = useState('');
  const [catAmount, setCatAmount] = useState('0');
  const [catBankAccount, setCatBankAccount] = useState('');
  const [catSubList, setCatSubList] = useState([]);
  const [newSubInput, setNewSubInput] = useState('');

  // Modal state for editing a sub-category (on double-click)
  const [editingSubTarget, setEditingSubTarget] = useState(null); // { catId, subId }
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('0');
  const [subBankAccount, setSubBankAccount] = useState('');

  const totalCategoryBudget = categories.reduce((sum, c) => sum + getCategoryTotal(c), 0);

  const actualIncome = dashboardFilteredIncomes.totalInCurrency(currencyCode);
  const actualExpenses = dashboardFilteredExpenses.totalInCurrency(currencyCode);
  const actualNet = actualIncome - actualExpenses;

  const persistCategories = (updatedCategories) => {
    const newExpensesTotal = updatedCategories.reduce((sum, c) => sum + getCategoryTotal(c), 0);
    setPlannedBudget({
      ...plannedBudget,
      expenses: newExpensesTotal,
      categories: updatedCategories,
    });
  };

  const toggleExpand = (catId) => {
    setExpandedCatIds(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const openNewCategoryModal = () => {
    setEditingCatId(null);
    setCatName('');
    setCatAmount('0');
    setCatBankAccount('');
    setCatSubList([]);
    setNewSubInput('');
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name || '');
    setCatAmount(String(cat.amount ?? 0));
    setCatBankAccount(cat.bankAccount || '');
    setCatSubList(Array.isArray(cat.subCategories) ? [...cat.subCategories] : []);
    setNewSubInput('');
    setIsCatModalOpen(true);
  };

  const handleAddSubInModal = () => {
    const trimmed = newSubInput.trim();
    if (!trimmed) return;
    setCatSubList(prev => [
      ...prev,
      makeSub(`sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, trimmed),
    ]);
    setNewSubInput('');
  };

  const handleRemoveSubInModal = (subId) => {
    setCatSubList(prev => prev.filter(s => s.id !== subId));
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const trimmedName = catName.trim();
    if (!trimmedName) {
      alert('Please enter a category name.');
      return;
    }
    const numericAmount = Math.max(0, parseFloat(catAmount) || 0);
    const pendingSub = newSubInput.trim();
    const finalSubList = pendingSub
      ? [...catSubList, makeSub(`sub-${Date.now()}`, pendingSub)]
      : catSubList;

    let updatedCategories;
    if (editingCatId) {
      updatedCategories = categories.map(c =>
        c.id === editingCatId
          ? {
              ...c,
              name: trimmedName,
              amount: finalSubList.length > 0 ? 0 : numericAmount,
              bankAccount: finalSubList.length > 0 ? '' : catBankAccount,
              subCategories: finalSubList,
            }
          : c
      );
    } else {
      const newId = `cat-${Date.now()}`;
      updatedCategories = [
        ...categories,
        {
          id: newId,
          name: trimmedName,
          amount: finalSubList.length > 0 ? 0 : numericAmount,
          bankAccount: finalSubList.length > 0 ? '' : catBankAccount,
          subCategories: finalSubList,
        },
      ];
      if (finalSubList.length > 0) {
        setExpandedCatIds(prev => ({ ...prev, [newId]: true }));
      }
    }

    persistCategories(updatedCategories);
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (id) => {
    const updatedCategories = categories.filter(c => c.id !== id);
    persistCategories(updatedCategories);
    setIsCatModalOpen(false);
  };

  const openEditSubModal = (catId, sub) => {
    setEditingSubTarget({ catId, subId: sub.id });
    setSubName(sub.name || '');
    setSubAmount(String(sub.amount ?? 0));
    setSubBankAccount(sub.bankAccount || '');
  };

  const handleSaveSubCategory = (e) => {
    e.preventDefault();
    if (!editingSubTarget) return;
    const trimmed = subName.trim();
    if (!trimmed) {
      alert('Please enter a sub-category name.');
      return;
    }
    const numericAmount = Math.max(0, parseFloat(subAmount) || 0);
    const updatedCategories = categories.map(c => {
      if (c.id !== editingSubTarget.catId) return c;
      return {
        ...c,
        subCategories: (c.subCategories || []).map(s =>
          s.id === editingSubTarget.subId
            ? { ...s, name: trimmed, amount: numericAmount, bankAccount: subBankAccount }
            : s
        ),
      };
    });
    persistCategories(updatedCategories);
    setEditingSubTarget(null);
  };

  const handleDeleteSubCategory = () => {
    if (!editingSubTarget) return;
    const updatedCategories = categories.map(c => {
      if (c.id !== editingSubTarget.catId) return c;
      return {
        ...c,
        subCategories: (c.subCategories || []).filter(s => s.id !== editingSubTarget.subId),
      };
    });
    persistCategories(updatedCategories);
    setEditingSubTarget(null);
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
              Click a category to expand sub-categories. Double-click any item to edit amount &amp; bank account. Total:{' '}
              <span className="font-bold" style={{ color: COLORS.textPrimary }}>
                {formatCurrency(totalCategoryBudget, currencyCode, currencies)}
              </span>
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
          {categories.map((cat) => {
            const subs = Array.isArray(cat.subCategories) ? cat.subCategories : [];
            const hasSubs = subs.length > 0;
            const isExpanded = !!expandedCatIds[cat.id];
            const catTotal = getCategoryTotal(cat);

            return (
              <div key={cat.id}>
                {/* Parent Category Row */}
                <div
                  onClick={() => hasSubs && toggleExpand(cat.id)}
                  onDoubleClick={() => openEditCategoryModal(cat)}
                  title={hasSubs ? 'Click to expand • Double-click to edit' : 'Double-click to edit'}
                  className="py-3.5 px-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-white/5 select-none"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {hasSubs ? (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 mt-1 shrink-0" style={{ color: COLORS.textSecondary }} />
                      ) : (
                        <ChevronRight className="w-4 h-4 mt-1 shrink-0" style={{ color: COLORS.textSecondary }} />
                      )
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>
                        {cat.name}
                      </div>
                      {hasSubs && (
                        <div className="text-xs mt-0.5 truncate" style={{ color: COLORS.textSecondary }}>
                          {subs.map(s => s.name).join(' ')}
                        </div>
                      )}
                      {!hasSubs && cat.bankAccount && (
                        <div className="flex items-center gap-1.5 text-[11px] mt-1 font-medium" style={{ color: COLORS.skyBlue }}>
                          <Landmark className="w-3 h-3 shrink-0" />
                          <span className="truncate">{cat.bankAccount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-bold text-base" style={{ color: COLORS.textPrimary }}>
                    {formatCurrency(catTotal, currencyCode, currencies)}
                  </div>
                </div>

                {/* Expanded Sub-Categories */}
                {hasSubs && isExpanded && (
                  <div className="divide-y border-t" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgMain }}>
                    <div className="py-2.5 pl-10 pr-3 flex items-center justify-between text-sm">
                      <span className="font-semibold" style={{ color: COLORS.textPrimary }}>
                        {cat.name} (Total)
                      </span>
                      <span className="font-bold" style={{ color: COLORS.skyBlue }}>
                        {formatCurrency(catTotal, currencyCode, currencies)}
                      </span>
                    </div>

                    {subs.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          openEditSubModal(cat.id, sub);
                        }}
                        title="Double-click to edit sub-category"
                        className="py-2.5 pl-10 pr-3 flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-white/5 select-none"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                            {sub.name}
                          </div>
                          {sub.bankAccount && (
                            <div className="flex items-center gap-1.5 text-[11px] mt-0.5 font-medium" style={{ color: COLORS.skyBlue }}>
                              <Landmark className="w-3 h-3 shrink-0" />
                              <span className="truncate">{sub.bankAccount}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                          {formatCurrency(parseFloat(sub.amount) || 0, currencyCode, currencies)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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

              {/* Sub-categories builder */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Sub-categories (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubInput}
                    onChange={(e) => setNewSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubInModal();
                      }
                    }}
                    placeholder="Add sub-category name"
                    className="flex-1 px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubInModal}
                    className="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 shrink-0"
                    style={{ backgroundColor: COLORS.orange, color: '#0B0F19' }}
                  >
                    + Add
                  </button>
                </div>

                {catSubList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {catSubList.map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                        style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                      >
                        {sub.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubInModal(sub.id)}
                          className="hover:text-red-400 cursor-pointer"
                          title="Remove sub-category"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {catSubList.length === 0 ? (
                <>
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
                </>
              ) : (
                <p className="text-xs p-3 rounded-xl border" style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textSecondary }}>
                  Double-click each sub-category in the list after saving to set its individual amount and bank account.
                </p>
              )}

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

      {/* Edit Sub-Category Modal */}
      {editingSubTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
          >
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: COLORS.border }}>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                Edit Sub-category
              </h3>
              <button
                type="button"
                onClick={() => setEditingSubTarget(null)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                style={{ color: COLORS.textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Sub-category Name
                </label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
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
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
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
                  value={subBankAccount}
                  onChange={(e) => setSubBankAccount(e.target.value)}
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
                <button
                  type="button"
                  onClick={handleDeleteSubCategory}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500/10 cursor-pointer"
                  style={{ color: COLORS.red }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSubTarget(null)}
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
