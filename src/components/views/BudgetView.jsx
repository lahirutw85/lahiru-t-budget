import { useState, useMemo } from 'react';
import { Folder, Plus, X, Landmark, Trash2, Edit2, ChevronDown, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getTodayDateString } from '../../utils/currencyUtils';
import {
  normalizeBudgetCategories,
  resolveItemAmountForPeriod,
  resolveCategoryTotalForPeriod,
  formatPeriodLabel,
  computeEndPeriodFromMonths,
  computeLoanProgress,
} from '../../utils/budgetUtils';

const makeSub = (id, name) => ({
  id,
  name,
  defaultAmount: 0,
  monthlyOverrides: {},
  forwardChanges: {},
  bankAccount: '',
  startPeriod: '',
  endPeriod: '',
});

/**
 * Apply an amount change to an item (category or sub-category) using either:
 *  - 'single': only for `periodKey`
 *  - 'forward': starting at `periodKey` and continuing every month forward
 */
const applyItemAmountUpdate = (item, periodKey, numericAmount, applyMode) => {
  const nextOverrides = { ...(item.monthlyOverrides || {}) };
  const nextForward = { ...(item.forwardChanges || {}) };

  if (applyMode === 'single') {
    nextOverrides[periodKey] = numericAmount;
  } else {
    // Remove single-month override for this month so forward change takes effect cleanly
    delete nextOverrides[periodKey];
    nextForward[periodKey] = numericAmount;
  }

  return {
    ...item,
    monthlyOverrides: nextOverrides,
    forwardChanges: nextForward,
  };
};

/**
 * BudgetView
 * ──────────────────────────────────────────────────────────
 * Monthly planning budget with categories & sub-categories.
 * - Amounts continue every month forward until changed for a single month
 *   or changed from a future month forward.
 * - Supports Start Month/Year & End Month/Year (e.g. for Loan items).
 * - Single-click a category with sub-categories to expand/collapse.
 * - Double-click any category or sub-category row to edit.
 */
export const BudgetView = ({
  COLORS,
  plannedBudget,
  setPlannedBudget,
  currencies,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  years = [],
  ALL_MONTHS = [],
  computedBankAccounts = [],
  onRecordPaidExpense,
  onRemovePaidExpense,
}) => {
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencyCode = defaultCurrencyObj.code;

  const activeMonth = selectedMonth === 'Full Year'
    ? ALL_MONTHS[new Date().getMonth()]
    : selectedMonth;
  const monthIndex = ALL_MONTHS.indexOf(activeMonth);
  const periodKey = `${selectedYear}-${String((monthIndex >= 0 ? monthIndex : new Date().getMonth()) + 1).padStart(2, '0')}`;

  const categories = useMemo(
    () => normalizeBudgetCategories(plannedBudget?.categories),
    [plannedBudget]
  );

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

  const [expandedCatIds, setExpandedCatIds] = useState({});

  // Modal state for adding/editing a category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catName, setCatName] = useState('');
  const [catAmount, setCatAmount] = useState('0');
  const [catBankAccount, setCatBankAccount] = useState('');
  const [catApplyMode, setCatApplyMode] = useState('forward'); // 'forward' | 'single'
  const [catStartPeriod, setCatStartPeriod] = useState('');
  const [catEndPeriod, setCatEndPeriod] = useState('');
  const [catSubList, setCatSubList] = useState([]);
  const [newSubInput, setNewSubInput] = useState('');

  // Modal state for editing a sub-category (on double-click)
  const [editingSubTarget, setEditingSubTarget] = useState(null); // { catId, subId, isLoan }
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('0');
  const [subBankAccount, setSubBankAccount] = useState('');
  const [subApplyMode, setSubApplyMode] = useState('forward');
  const [subStartPeriod, setSubStartPeriod] = useState('');
  const [subEndPeriod, setSubEndPeriod] = useState('');
  const [subLoanTotalAmount, setSubLoanTotalAmount] = useState('');
  const [subLoanTotalMonths, setSubLoanTotalMonths] = useState('');

  const totalCategoryBudget = categories.reduce(
    (sum, c) => sum + resolveCategoryTotalForPeriod(c, periodKey),
    0
  );

  const persistCategories = (updatedCategories) => {
    const newExpensesTotal = updatedCategories.reduce(
      (sum, c) => sum + resolveCategoryTotalForPeriod(c, periodKey),
      0
    );
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
    setCatApplyMode('forward');
    setCatStartPeriod('');
    setCatEndPeriod('');
    setCatSubList([]);
    setNewSubInput('');
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    const hasOverride = cat.monthlyOverrides && Object.prototype.hasOwnProperty.call(cat.monthlyOverrides, periodKey);
    setEditingCatId(cat.id);
    setCatName(cat.name || '');
    setCatAmount(String(resolveItemAmountForPeriod(cat, periodKey)));
    setCatBankAccount(cat.bankAccount || '');
    setCatApplyMode(hasOverride ? 'single' : 'forward');
    setCatStartPeriod(cat.startPeriod || '');
    setCatEndPeriod(cat.endPeriod || '');
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
      updatedCategories = categories.map(c => {
        if (c.id !== editingCatId) return c;
        const baseUpdated = {
          ...c,
          name: trimmedName,
          bankAccount: finalSubList.length > 0 ? '' : catBankAccount,
          startPeriod: catStartPeriod,
          endPeriod: catEndPeriod,
          subCategories: finalSubList,
        };
        if (finalSubList.length > 0) return baseUpdated;
        return applyItemAmountUpdate(baseUpdated, periodKey, numericAmount, catApplyMode);
      });
    } else {
      const newId = `cat-${Date.now()}`;
      let newCat = {
        id: newId,
        name: trimmedName,
        defaultAmount: 0,
        monthlyOverrides: {},
        forwardChanges: {},
        bankAccount: finalSubList.length > 0 ? '' : catBankAccount,
        startPeriod: catStartPeriod,
        endPeriod: catEndPeriod,
        subCategories: finalSubList,
      };
      if (finalSubList.length === 0 && numericAmount > 0) {
        newCat = applyItemAmountUpdate(newCat, periodKey, numericAmount, catApplyMode);
      }
      updatedCategories = [...categories, newCat];
      if (finalSubList.length > 0) {
        setExpandedCatIds(prev => ({ ...prev, [newId]: true }));
      }
    }

    persistCategories(updatedCategories);
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (id) => {
    persistCategories(categories.filter(c => c.id !== id));
    setIsCatModalOpen(false);
  };

  const openEditSubModal = (cat, sub) => {
    const hasOverride = sub.monthlyOverrides && Object.prototype.hasOwnProperty.call(sub.monthlyOverrides, periodKey);
    const isLoan = cat.name?.toLowerCase().includes('loan');
    setEditingSubTarget({ catId: cat.id, subId: sub.id, isLoan });
    setSubName(sub.name || '');
    setSubAmount(String(resolveItemAmountForPeriod(sub, periodKey)));
    setSubBankAccount(sub.bankAccount || '');
    setSubApplyMode(hasOverride ? 'single' : 'forward');
    setSubStartPeriod(sub.startPeriod || (isLoan ? periodKey : ''));
    setSubEndPeriod(sub.endPeriod || '');
    setSubLoanTotalAmount(sub.loanTotalAmount ? String(sub.loanTotalAmount) : '');
    setSubLoanTotalMonths(sub.loanTotalMonths ? String(sub.loanTotalMonths) : '');
  };

  const recalcLoanFields = (nextFullStr, nextMonthsStr, nextStart) => {
    const full = parseFloat(nextFullStr);
    const months = parseInt(nextMonthsStr, 10);
    if (full > 0 && months > 0) {
      setSubAmount((full / months).toFixed(2));
    }
    if (nextStart && months > 0) {
      setSubEndPeriod(computeEndPeriodFromMonths(nextStart, months));
    }
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
    const numericLoanTotal = Math.max(0, parseFloat(subLoanTotalAmount) || 0);
    const numericLoanMonths = Math.max(0, parseInt(subLoanTotalMonths, 10) || 0);
    const computedEnd = subStartPeriod && numericLoanMonths > 0
      ? computeEndPeriodFromMonths(subStartPeriod, numericLoanMonths)
      : subEndPeriod;

    const updatedCategories = categories.map(c => {
      if (c.id !== editingSubTarget.catId) return c;
      return {
        ...c,
        subCategories: (c.subCategories || []).map(s => {
          if (s.id !== editingSubTarget.subId) return s;
          const updatedSub = {
            ...s,
            name: trimmed,
            bankAccount: subBankAccount,
            startPeriod: subStartPeriod,
            endPeriod: computedEnd,
            loanTotalAmount: numericLoanTotal,
            loanTotalMonths: numericLoanMonths,
          };
          return applyItemAmountUpdate(updatedSub, periodKey, numericAmount, subApplyMode);
        }),
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

  const getPaymentDateForPeriod = () => {
    const todayStr = getTodayDateString();
    return todayStr.startsWith(periodKey) ? todayStr : `${periodKey}-01`;
  };

  const handleTogglePaidCategory = (e, cat) => {
    e.stopPropagation();
    const amount = resolveCategoryTotalForPeriod(cat, periodKey);
    if (amount <= 0) return;

    const existingExpenseId = cat.paidMonths?.[periodKey];
    const nextPaidMonths = { ...(cat.paidMonths || {}) };

    if (existingExpenseId) {
      if (onRemovePaidExpense) onRemovePaidExpense(existingExpenseId);
      delete nextPaidMonths[periodKey];
    } else if (onRecordPaidExpense) {
      const expenseId = onRecordPaidExpense({
        date: getPaymentDateForPeriod(),
        category: cat.name,
        subCategory: cat.name,
        amount,
        bankAccount: cat.bankAccount || '',
        notes: `Budget payment (${activeMonth} ${selectedYear})`,
      });
      nextPaidMonths[periodKey] = expenseId;
    }

    persistCategories(
      categories.map(c => (c.id === cat.id ? { ...c, paidMonths: nextPaidMonths } : c))
    );
  };

  const handleTogglePaidSubCategory = (e, cat, sub) => {
    e.stopPropagation();
    const amount = resolveItemAmountForPeriod(sub, periodKey);
    if (amount <= 0) return;

    const existingExpenseId = sub.paidMonths?.[periodKey];
    const nextPaidMonths = { ...(sub.paidMonths || {}) };

    if (existingExpenseId) {
      if (onRemovePaidExpense) onRemovePaidExpense(existingExpenseId);
      delete nextPaidMonths[periodKey];
    } else if (onRecordPaidExpense) {
      const expenseId = onRecordPaidExpense({
        date: getPaymentDateForPeriod(),
        category: cat.name,
        subCategory: sub.name,
        amount,
        bankAccount: sub.bankAccount || '',
        notes: `Budget payment: ${sub.name} (${activeMonth} ${selectedYear})`,
      });
      nextPaidMonths[periodKey] = expenseId;
    }

    persistCategories(
      categories.map(c => {
        if (c.id !== cat.id) return c;
        return {
          ...c,
          subCategories: (c.subCategories || []).map(s =>
            s.id === sub.id ? { ...s, paidMonths: nextPaidMonths } : s
          ),
        };
      })
    );
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Header & Month/Year Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.textPrimary }}>
            <Folder className="w-7 h-7" style={{ color: COLORS.orange }} />
            Planning Budget
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            Monthly plan for <span style={{ color: COLORS.textPrimary }}>{activeMonth} {selectedYear}</span> in <span style={{ color: COLORS.textPrimary }}>{currencyCode}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center px-4 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
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

          <div className="flex items-center px-4 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <select
              value={activeMonth}
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

          <button
            type="button"
            onClick={openNewCategoryModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 ml-1 cursor-pointer"
            style={{ backgroundColor: COLORS.orange, color: '#0B0F19' }}
          >
            <Plus className="w-4 h-4" />
            Create New Category
          </button>
        </div>
      </div>

      {/* Budget Categories List */}
      <div
        className="p-6 rounded-2xl border"
        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
            Budget Categories
          </h2>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
            Amounts carry forward every month unless changed for one month or from a future month onwards. Total for {activeMonth} {selectedYear}:{' '}
            <span className="font-bold" style={{ color: COLORS.textPrimary }}>
              {formatCurrency(totalCategoryBudget, currencyCode, currencies)}
            </span>
          </p>
        </div>

        <div className="divide-y" style={{ borderColor: COLORS.border }}>
          {categories.map((cat) => {
            const subs = Array.isArray(cat.subCategories) ? cat.subCategories : [];
            const hasSubs = subs.length > 0;
            const isExpanded = !!expandedCatIds[cat.id];
            const catTotal = resolveCategoryTotalForPeriod(cat, periodKey);
            const hasRange = !!(cat.startPeriod || cat.endPeriod);

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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>
                          {cat.name}
                        </span>
                        {hasRange && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                            style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', color: COLORS.skyBlue }}
                          >
                            {cat.startPeriod ? formatPeriodLabel(cat.startPeriod) : 'Start'} → {cat.endPeriod ? formatPeriodLabel(cat.endPeriod) : 'Ongoing'}
                          </span>
                        )}
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

                  <div className="flex items-center gap-2.5 shrink-0">
                    {!hasSubs && catTotal > 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleTogglePaidCategory(e, cat)}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-opacity hover:opacity-85 cursor-pointer"
                        style={{
                          backgroundColor: cat.paidMonths?.[periodKey] ? 'rgba(16, 185, 129, 0.15)' : COLORS.bgMain,
                          borderColor: cat.paidMonths?.[periodKey] ? COLORS.green : COLORS.border,
                          color: cat.paidMonths?.[periodKey] ? COLORS.green : COLORS.textSecondary,
                        }}
                        title={cat.paidMonths?.[periodKey] ? 'Click to unmark paid' : 'Mark as paid & add to monthly spending'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {cat.paidMonths?.[periodKey] ? 'Paid' : 'Mark Paid'}
                      </button>
                    )}
                    <div className="text-right font-bold text-base min-w-[95px]" style={{ color: COLORS.textPrimary }}>
                      {formatCurrency(catTotal, currencyCode, currencies)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCategoryModal(cat);
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      style={{ color: COLORS.skyBlue }}
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${cat.name}" category?`)) {
                          handleDeleteCategory(cat.id);
                        }
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      style={{ color: COLORS.red }}
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

                    {subs.map((sub) => {
                      const subVal = resolveItemAmountForPeriod(sub, periodKey);
                      const subHasRange = !!(sub.startPeriod || sub.endPeriod);
                      const loanInfo = (sub.loanTotalAmount > 0 && sub.loanTotalMonths > 0)
                        ? computeLoanProgress(sub, periodKey)
                        : null;
                      return (
                        <div
                          key={sub.id}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            openEditSubModal(cat, sub);
                          }}
                          title="Double-click to edit sub-category"
                          className="py-2.5 pl-10 pr-3 flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-white/5 select-none"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                                {sub.name}
                              </span>
                              {subHasRange && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                  style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', color: COLORS.skyBlue }}
                                >
                                  {sub.startPeriod ? formatPeriodLabel(sub.startPeriod) : 'Start'} → {sub.endPeriod ? formatPeriodLabel(sub.endPeriod) : 'Ongoing'}
                                </span>
                              )}
                            </div>
                            {loanInfo && (
                              <div className="text-[11px] mt-0.5" style={{ color: COLORS.textSecondary }}>
                                Full: {formatCurrency(loanInfo.fullAmount, currencyCode, currencies)} • {loanInfo.totalMonths} mos •{' '}
                                <span style={{ color: COLORS.orange }}>
                                  Remaining: {formatCurrency(loanInfo.remainingAmount, currencyCode, currencies)} ({loanInfo.monthsRemaining} mos left)
                                </span>
                              </div>
                            )}
                            {sub.bankAccount && (
                              <div className="flex items-center gap-1.5 text-[11px] mt-0.5 font-medium" style={{ color: COLORS.skyBlue }}>
                                <Landmark className="w-3 h-3 shrink-0" />
                                <span className="truncate">{sub.bankAccount}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {subVal > 0 && (
                              <button
                                type="button"
                                onClick={(e) => handleTogglePaidSubCategory(e, cat, sub)}
                                onDoubleClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-opacity hover:opacity-85 cursor-pointer"
                                style={{
                                  backgroundColor: sub.paidMonths?.[periodKey] ? 'rgba(16, 185, 129, 0.15)' : COLORS.bgCard,
                                  borderColor: sub.paidMonths?.[periodKey] ? COLORS.green : COLORS.border,
                                  color: sub.paidMonths?.[periodKey] ? COLORS.green : COLORS.textSecondary,
                                }}
                                title={sub.paidMonths?.[periodKey] ? 'Click to unmark paid' : 'Mark as paid & add to monthly spending'}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {sub.paidMonths?.[periodKey] ? 'Paid' : 'Mark Paid'}
                              </button>
                            )}
                            <div className="text-right text-sm font-semibold min-w-[85px]" style={{ color: COLORS.textPrimary }}>
                              {formatCurrency(subVal, currencyCode, currencies)}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditSubModal(cat, sub);
                              }}
                              onDoubleClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                              style={{ color: COLORS.skyBlue }}
                              title="Edit Sub-category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete "${sub.name}" sub-category?`)) {
                                  persistCategories(
                                    categories.map(c =>
                                      c.id !== cat.id
                                        ? c
                                        : { ...c, subCategories: (c.subCategories || []).filter(s => s.id !== sub.id) }
                                    )
                                  );
                                }
                              }}
                              onDoubleClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              style={{ color: COLORS.red }}
                              title="Delete Sub-category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Food, House Rent, Loan"
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

              {/* Start & End Month/Year (for Loan or any time-bound category) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Start Month &amp; Year
                  </label>
                  <input
                    type="month"
                    value={catStartPeriod}
                    onChange={(e) => setCatStartPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    End Month &amp; Year
                  </label>
                  <input
                    type="month"
                    value={catEndPeriod}
                    onChange={(e) => setCatEndPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>
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
                      Apply Change
                    </label>
                    <select
                      value={catApplyMode}
                      onChange={(e) => setCatApplyMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                      style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                    >
                      <option value="forward">From {activeMonth} {selectedYear} onwards (every month)</option>
                      <option value="single">Only for {activeMonth} {selectedYear}</option>
                    </select>
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
                  Double-click each sub-category in the list to set its amount, start/end month, and bank account.
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

            <form onSubmit={handleSaveSubCategory} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
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

              {editingSubTarget.isLoan && (
                <div className="p-3.5 rounded-xl border space-y-3" style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border }}>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.skyBlue }}>
                    Loan Calculator
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textSecondary }}>
                        Full Amount ({currencyCode})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={subLoanTotalAmount}
                        onChange={(e) => {
                          setSubLoanTotalAmount(e.target.value);
                          recalcLoanFields(e.target.value, subLoanTotalMonths, subStartPeriod);
                        }}
                        placeholder="e.g. 24000"
                        className="w-full px-3 py-2 rounded-lg border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, color: COLORS.textPrimary }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.textSecondary }}>
                        Months to Pay
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={subLoanTotalMonths}
                        onChange={(e) => {
                          setSubLoanTotalMonths(e.target.value);
                          recalcLoanFields(subLoanTotalAmount, e.target.value, subStartPeriod);
                        }}
                        placeholder="e.g. 24"
                        className="w-full px-3 py-2 rounded-lg border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, color: COLORS.textPrimary }}
                      />
                    </div>
                  </div>
                  {parseFloat(subLoanTotalAmount) > 0 && parseInt(subLoanTotalMonths, 10) > 0 && (() => {
                    const previewItem = {
                      loanTotalAmount: parseFloat(subLoanTotalAmount) || 0,
                      loanTotalMonths: parseInt(subLoanTotalMonths, 10) || 0,
                      startPeriod: subStartPeriod,
                      endPeriod: subEndPeriod,
                      defaultAmount: parseFloat(subAmount) || 0,
                      forwardChanges: subStartPeriod ? { [subStartPeriod]: parseFloat(subAmount) || 0 } : {},
                      monthlyOverrides: {},
                    };
                    const prog = computeLoanProgress(previewItem, periodKey);
                    return (
                      <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: COLORS.border }}>
                        <span style={{ color: COLORS.textSecondary }}>
                          Remaining ({activeMonth} {selectedYear}):
                        </span>
                        <span className="font-bold" style={{ color: COLORS.orange }}>
                          {formatCurrency(prog.remainingAmount, currencyCode, currencies)} ({prog.monthsRemaining} mos left)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Monthly Amount ({currencyCode})
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
                  Apply Change
                </label>
                <select
                  value={subApplyMode}
                  onChange={(e) => setSubApplyMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                >
                  <option value="forward">From {activeMonth} {selectedYear} onwards (every month)</option>
                  <option value="single">Only for {activeMonth} {selectedYear}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Start Month &amp; Year
                  </label>
                  <input
                    type="month"
                    value={subStartPeriod}
                    onChange={(e) => {
                      setSubStartPeriod(e.target.value);
                      recalcLoanFields(subLoanTotalAmount, subLoanTotalMonths, e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    End Month &amp; Year {editingSubTarget.isLoan && subStartPeriod && parseInt(subLoanTotalMonths, 10) > 0 ? '(Auto)' : ''}
                  </label>
                  <input
                    type="month"
                    value={subEndPeriod}
                    onChange={(e) => setSubEndPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>
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
