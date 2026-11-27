import { useState, useMemo } from 'react';
import { Calendar, ChevronDown, Plus, CircleDollarSign, Edit2, Trash2, CheckCircle2, Landmark, Repeat, X } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency, getCurrencyRowStyle, formatExpenseDate, getTodayDateString } from '../../utils/currencyUtils';
import { buildDonutData } from '../../utils/chartUtils';
import { getRecurringIncomeAmountForPeriod, formatPeriodLabel } from '../../utils/budgetUtils';

export const IncomeView = ({
  COLORS,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedDay = 'Full Month',
  setSelectedDay,
  years,
  ALL_MONTHS,
  setFormType,
  setEditingExpenseId,
  setIsAddExpenseOpen,
  activeCurrencies,
  currencies,
  filteredIncomes,
  INCOME_CATEGORIES,
  isDarkMode,
  handleEditIncome,
  handleDeleteIncome,
  recurringIncomes = [],
  setRecurringIncomes,
  computedBankAccounts = [],
  onRecordConfirmedIncome,
  onRemoveConfirmedIncome,
}) => {
  // ─── 1. RESOLVED CURRENCY CODE & SYMBOLS ──────────────────
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencyCode   = defaultCurrencyObj.code;

  const formatCurrencyLocal = (amount, curCode) => {
    return formatCurrency(amount, curCode, currencies);
  };

  const getIconForCategory = (catName) => {
    const foundIncome = INCOME_CATEGORIES.find(c => c.name.toLowerCase() === catName?.toLowerCase());
    return foundIncome ? foundIncome.icon : CircleDollarSign;
  };

  // Local array conversion for mapping and array iteration
  const incomesArray = filteredIncomes.toArray();

  // ─── 2. DERIVED VALUES ────────────────────────────────────
  const incomesSumByCurrency = filteredIncomes.sumByCurrency();

  // Group by category converted to default currency
  const incomeCategoryTotals = filteredIncomes.categoryTotalsInCurrency(currencyCode);

  const incomeCategoryColors = {
    'salary': COLORS.green,
    'business': COLORS.skyBlue,
    'investment': COLORS.purple,
    'gifts/grants': COLORS.pink,
    'others': COLORS.yellow,
  };

  const finalIncomeDonutData = buildDonutData(incomeCategoryTotals, 'income', isDarkMode ? '#1F2937' : '#E5E7EB');

  // ─── 3. SUB-RENDER HELPER FUNCTIONS ───────────────────────
  const renderSubPageMultiCurrencySum = (sumMap, defaultColorStyle = {}) => {
    if (activeCurrencies.length <= 1) {
      const cur = activeCurrencies[0];
      const val = sumMap[cur] || 0;
      return (
        <div className="text-5xl font-bold" style={defaultColorStyle}>
          {formatCurrencyLocal(val, cur)}
        </div>
      );
    }
    return (
      <div className="space-y-2 mt-2 max-h-[180px] overflow-y-auto pr-1">
        {activeCurrencies.map(cur => {
          const val = sumMap[cur] || 0;
          return (
            <div key={cur} className="flex justify-between items-center text-2xl font-bold border-b border-white/5 pb-1" style={defaultColorStyle}>
              <span className="text-sm opacity-75 font-bold uppercase tracking-wider">{cur}:</span>
              <span>{formatCurrencyLocal(val, cur)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderIncomesDonutCenterMultiCurrency = (sumMap) => {
    if (activeCurrencies.length <= 1) {
      const cur = activeCurrencies[0];
      const val = sumMap[cur] || 0;
      return (
        <span className="text-2xl font-bold" style={{ color: COLORS.green }}>
          {formatCurrencyLocal(val, cur)}
        </span>
      );
    }
    return (
      <div className="text-center space-y-1 max-h-[85px] overflow-y-auto px-4">
        {activeCurrencies.map(cur => {
          const val = sumMap[cur] || 0;
          return (
            <div key={cur} className="text-sm font-bold leading-tight" style={{ color: COLORS.green }}>
              {formatCurrencyLocal(val, cur)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSingleDonutChart = (cur) => {
    const categoryTotalsForCurrency = {};
    incomesArray.forEach(item => {
      const txCurrency = item.currency || 'AED';
      if (txCurrency === cur) {
        const cat = item.category || 'Other';
        categoryTotalsForCurrency[cat] = (categoryTotalsForCurrency[cat] || 0) + item.amount;
      }
    });

    const dynamicDonutDataForCurrency = Object.keys(categoryTotalsForCurrency).map(cat => {
      const key = cat.toLowerCase();
      const color = incomeCategoryColors[key] || COLORS.yellow;
      return {
        name: cat,
        value: categoryTotalsForCurrency[cat],
        color: color
      };
    });

    const finalDonutDataForCurrency = dynamicDonutDataForCurrency.length > 0 ? dynamicDonutDataForCurrency : [
      { name: 'No Incomes', value: 1, color: isDarkMode ? '#1F2937' : '#E5E7EB' }
    ];

    const currencyTotalAmount = Object.values(categoryTotalsForCurrency).reduce((sum, val) => sum + val, 0);

    return (
      <div key={cur} className="flex flex-col border rounded-xl p-4 relative" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <h4 className="text-xs font-bold text-center uppercase tracking-wider mb-2" style={{ color: COLORS.green }}>
          {cur} Breakdown
        </h4>
        
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={finalDonutDataForCurrency}
                innerRadius={50}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {finalDonutDataForCurrency.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: '8px', color: COLORS.textPrimary }}
                itemStyle={{ color: COLORS.textPrimary }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] mb-0.5" style={{ color: COLORS.textSecondary }}>Total</span>
            <span className="text-xs font-bold" style={{ color: COLORS.green }}>
              {formatCurrencyLocal(currencyTotalAmount, cur)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 px-2 max-h-[80px] overflow-y-auto">
          {dynamicDonutDataForCurrency.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 text-[10px] font-medium" style={{ color: COLORS.textPrimary }}>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="font-semibold truncate">{item.name}</span>
              </div>
              <span className="text-[9px] pl-3 text-gray-400">{formatCurrencyLocal(item.value, cur)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const monthIdx = ALL_MONTHS.indexOf(selectedMonth);
  const daysInMonth = monthIdx >= 0
    ? new Date(parseInt(selectedYear, 10) || new Date().getFullYear(), monthIdx + 1, 0).getDate()
    : 31;
  const dayOptions = ['Full Month', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))];
  const periodKey = `${selectedYear}-${String((monthIdx >= 0 ? monthIdx : new Date().getMonth()) + 1).padStart(2, '0')}`;

  // Build flat list of bank account options from existing computedBankAccounts
  const bankAccountOptions = useMemo(() => {
    const options = [];
    computedBankAccounts.forEach(acc => {
      let base = `${acc.bankName} (${acc.accountType}`;
      if (acc.branch) base += ` - ${acc.branch}`;
      if (acc.accountType !== 'Credit Card' && Array.isArray(acc.accountNumbers) && acc.accountNumbers.length > 0) {
        const validNums = acc.accountNumbers.filter(n => n && n.trim());
        if (validNums.length > 0) {
          validNums.forEach(accNo => options.push(`${base} - Acc: ${accNo})`));
          return;
        }
      }
      options.push(`${base})`);
    });
    return options;
  }, [computedBankAccounts]);

  // Recurring Income modal state
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRecId, setEditingRecId] = useState(null);
  const [recName, setRecName] = useState('');
  const [recCategory, setRecCategory] = useState(INCOME_CATEGORIES[0]?.name || 'Salary');
  const [recAmount, setRecAmount] = useState('');
  const [recCurrency, setRecCurrency] = useState(currencyCode);
  const [recStartPeriod, setRecStartPeriod] = useState(periodKey);
  const [recFrequency, setRecFrequency] = useState('monthly');
  const [recReceiveDay, setRecReceiveDay] = useState('');
  const [recBankAccount, setRecBankAccount] = useState('');

  const openNewRecModal = () => {
    setEditingRecId(null);
    setRecName('');
    setRecCategory(INCOME_CATEGORIES[0]?.name || 'Salary');
    setRecAmount('');
    setRecCurrency(currencyCode);
    setRecStartPeriod(periodKey);
    setRecFrequency('monthly');
    setRecReceiveDay('');
    setRecBankAccount('');
    setIsRecModalOpen(true);
  };

  const openEditRecModal = (item) => {
    setEditingRecId(item.id);
    setRecName(item.name || '');
    setRecCategory(item.category || INCOME_CATEGORIES[0]?.name || 'Salary');
    setRecAmount(String(item.amount ?? ''));
    setRecCurrency(item.currency || currencyCode);
    setRecStartPeriod(item.startPeriod || periodKey);
    setRecFrequency(item.frequency || 'monthly');
    setRecReceiveDay(item.receiveDay || '');
    setRecBankAccount(item.bankAccount || '');
    setIsRecModalOpen(true);
  };

  const handleSaveRecIncome = (e) => {
    e.preventDefault();
    if (!setRecurringIncomes) return;
    const trimmedName = recName.trim();
    const numericAmount = Math.max(0, parseFloat(recAmount) || 0);
    if (!trimmedName || numericAmount <= 0) {
      alert('Please enter a valid income name and amount.');
      return;
    }

    if (editingRecId) {
      setRecurringIncomes(recurringIncomes.map(item =>
        item.id === editingRecId
          ? {
              ...item,
              name: trimmedName,
              category: recCategory,
              amount: numericAmount,
              currency: recCurrency,
              startPeriod: recStartPeriod,
              frequency: recFrequency,
              receiveDay: recReceiveDay.trim(),
              bankAccount: recBankAccount,
            }
          : item
      ));
    } else {
      setRecurringIncomes([
        ...recurringIncomes,
        {
          id: `rec-inc-${Date.now()}`,
          name: trimmedName,
          category: recCategory,
          amount: numericAmount,
          currency: recCurrency,
          startPeriod: recStartPeriod,
          frequency: recFrequency,
          receiveDay: recReceiveDay.trim(),
          bankAccount: recBankAccount,
          confirmedMonths: {},
        },
      ]);
    }
    setIsRecModalOpen(false);
  };

  const handleDeleteRecIncome = (id) => {
    if (!setRecurringIncomes) return;
    setRecurringIncomes(recurringIncomes.filter(item => item.id !== id));
    setIsRecModalOpen(false);
  };

  const handleToggleConfirmIncome = (e, item) => {
    e.stopPropagation();
    if (!setRecurringIncomes) return;
    const expectedAmount = getRecurringIncomeAmountForPeriod(item, periodKey);
    if (expectedAmount <= 0) return;

    const existingTxId = item.confirmedMonths?.[periodKey];
    const nextConfirmed = { ...(item.confirmedMonths || {}) };

    if (existingTxId) {
      if (onRemoveConfirmedIncome) onRemoveConfirmedIncome(existingTxId);
      delete nextConfirmed[periodKey];
    } else if (onRecordConfirmedIncome) {
      const todayStr = getTodayDateString();
      let txDate = todayStr.startsWith(periodKey) ? todayStr : `${periodKey}-01`;
      if (item.receiveDay) {
        const dayNum = Math.min(daysInMonth, Math.max(1, parseInt(item.receiveDay, 10) || 1));
        txDate = `${periodKey}-${String(dayNum).padStart(2, '0')}`;
      }
      const txId = onRecordConfirmedIncome({
        date: txDate,
        category: item.category || 'Salary',
        subCategory: item.name,
        amount: expectedAmount,
        currency: item.currency || currencyCode,
        bankAccount: item.bankAccount || '',
        notes: `Confirmed ${item.frequency || 'monthly'} income (${selectedMonth} ${selectedYear})`,
      });
      nextConfirmed[periodKey] = txId;
    }

    setRecurringIncomes(recurringIncomes.map(r =>
      r.id === item.id ? { ...r, confirmedMonths: nextConfirmed } : r
    ));
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* Title & Date Selectors */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>Income</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            financial Details for <span style={{ color: COLORS.textPrimary }}>{selectedMonth}{selectedDay !== 'Full Month' ? ` ${selectedDay},` : ''} {selectedYear}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center px-4 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <Calendar className="w-4 h-4 mr-2" style={{ color: COLORS.skyBlue }}/>
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
            <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }}/>
          </div>
          <div className="flex items-center px-4 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none outline-none font-medium appearance-none pr-4 cursor-pointer" 
              style={{ color: COLORS.textPrimary }}
            >
              {ALL_MONTHS.map(m => (
                <option key={m} value={m} style={{ backgroundColor: COLORS.bgCard }}>{m}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }}/>
          </div>
          <div className="flex items-center px-4 py-2 rounded-lg border text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-transparent border-none outline-none font-medium appearance-none pr-4 cursor-pointer"
              style={{ color: COLORS.textPrimary }}
            >
              {dayOptions.map(d => (
                <option key={d} value={d} style={{ backgroundColor: COLORS.bgCard }}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }}/>
          </div>
          <button 
            onClick={() => {
              setFormType('income');
              setEditingExpenseId(null);
              setIsAddExpenseOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 ml-2 cursor-pointer" 
            style={{ backgroundColor: COLORS.green, color: '#FFFFFF' }}
          >
            <Plus className="w-4 h-4" />
            Add Income
          </button>
        </div>
      </div>

      {/* Layout for Total Income and Income by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left side: Total Income */}
        <div className="p-8 rounded-2xl border flex flex-col justify-center min-h-[220px]" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
              <CircleDollarSign className="w-6 h-6" style={{ color: COLORS.green }} />
            </div>
            <h3 className="text-lg font-medium" style={{ color: COLORS.textSecondary }}>Total Income</h3>
          </div>
          {renderSubPageMultiCurrencySum(incomesSumByCurrency, { color: COLORS.green })}
        </div>

        {/* Right side: Income by Category */}
        <div className="p-8 rounded-2xl border flex flex-col" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.textSecondary }}>Income by Category</h2>
          
          {activeCurrencies.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalIncomeDonutData}
                    innerRadius={90}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {finalIncomeDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, borderRadius: '8px', color: COLORS.textPrimary }}
                    itemStyle={{ color: COLORS.textPrimary }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>Total</span>
                {renderIncomesDonutCenterMultiCurrency(incomesSumByCurrency)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[500px] pr-1">
              {activeCurrencies.map(cur => renderSingleDonutChart(cur))}
            </div>
          )}
        </div>
        
      </div>

      {/* Recurring Income Sources */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Recurring Income Schedule
            </h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
              Set your salary or income start month and frequency (daily, weekly, monthly). Confirm when received in your bank account. Double-click to edit.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewRecModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer shrink-0"
            style={{ backgroundColor: COLORS.skyBlue, color: '#0B0F19' }}
          >
            <Plus className="w-4 h-4" />
            Add Recurring Income
          </button>
        </div>

        {recurringIncomes.length === 0 ? (
          <div className="py-6 text-center text-sm" style={{ color: COLORS.textSecondary }}>
            No recurring income sources configured yet. Click &ldquo;Add Recurring Income&rdquo; to set up your monthly, weekly, or daily income.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: COLORS.border }}>
            {recurringIncomes.map((item) => {
              const expectedForMonth = getRecurringIncomeAmountForPeriod(item, periodKey);
              const isConfirmed = Boolean(item.confirmedMonths?.[periodKey]);
              const freqLabel = item.frequency === 'daily' ? 'Daily' : item.frequency === 'weekly' ? 'Weekly' : 'Monthly';

              return (
                <div
                  key={item.id}
                  onDoubleClick={() => openEditRecModal(item)}
                  title="Double-click to edit recurring income"
                  className="py-3.5 px-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-white/5 select-none"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>
                        {item.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5" style={{ color: COLORS.textSecondary }}>
                        {item.category}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: COLORS.green }}
                      >
                        <Repeat className="w-2.5 h-2.5" />
                        {freqLabel}
                      </span>
                      {item.startPeriod && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', color: COLORS.skyBlue }}
                        >
                          From {formatPeriodLabel(item.startPeriod)}
                        </span>
                      )}
                    </div>
                    {item.bankAccount && (
                      <div className="flex items-center gap-1.5 text-[11px] mt-1 font-medium" style={{ color: COLORS.skyBlue }}>
                        <Landmark className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.bankAccount}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {expectedForMonth > 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleConfirmIncome(e, item)}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-opacity hover:opacity-85 cursor-pointer"
                        style={{
                          backgroundColor: isConfirmed ? 'rgba(16, 185, 129, 0.15)' : COLORS.bgMain,
                          borderColor: isConfirmed ? COLORS.green : COLORS.border,
                          color: isConfirmed ? COLORS.green : COLORS.textSecondary,
                        }}
                        title={isConfirmed ? 'Click to undo bank confirmation' : 'Confirm received in bank account'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isConfirmed ? 'Confirmed' : 'Confirm Received'}
                      </button>
                    )}
                    <div className="text-right font-bold text-base" style={{ color: COLORS.green }}>
                      {formatCurrencyLocal(expectedForMonth, item.currency || currencyCode)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Income List Table */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}>
                <th className="pb-3 px-4 font-bold w-10"></th>
                <th className="pb-3 px-4 font-bold">Date</th>
                <th className="pb-3 px-4 font-bold">Category</th>
                <th className="pb-3 px-4 font-bold">SubCategory</th>
                <th className="pb-3 px-4 font-bold text-right pr-8">Amount</th>
                <th className="pb-3 px-4 font-bold">Account</th>
                <th className="pb-3 px-4 font-bold">Notes</th>
                <th className="pb-3 px-4 font-bold text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomesArray.map((inc) => {
                const IncIcon = getIconForCategory(inc.category);
                const rowStyle = getCurrencyRowStyle(inc.currency || 'AED', isDarkMode);
                return (
                  <tr key={inc.id} className="border-b transition-colors hover:opacity-90" style={{ ...rowStyle, borderColor: COLORS.border }}>
                    <td className="py-3 px-4">
                      <IncIcon className="w-5 h-5" style={{ color: COLORS.green }} />
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: COLORS.textPrimary }}>{formatExpenseDate(inc.date)}</td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>{inc.category}</td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>{inc.subCategory}</td>
                    <td className="py-3 px-4 font-bold text-right pr-8" style={{ color: COLORS.green }}>
                      {formatCurrencyLocal(inc.amount, inc.currency || 'AED')}
                    </td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>
                      {(inc.account === 'Bank Account' || inc.account === 'Credit Card') && inc.bankName 
                        ? `${inc.account} (${inc.bankName})` 
                        : inc.account}
                    </td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>{inc.notes}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => handleEditIncome(inc)}
                          className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                          style={{ color: COLORS.skyBlue }}
                          title="Edit Income"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteIncome(inc.id)}
                          className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                          style={{ color: COLORS.red }}
                          title="Delete Income"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Recurring Income Modal */}
      {isRecModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
          >
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: COLORS.border }}>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                {editingRecId ? 'Edit Recurring Income' : 'Add Recurring Income'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRecModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                style={{ color: COLORS.textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecIncome} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Income Source Name
                </label>
                <input
                  type="text"
                  required
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  placeholder="e.g. Regular Salary, Freelance"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Category
                  </label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  >
                    {INCOME_CATEGORIES.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Frequency
                  </label>
                  <select
                    value={recFrequency}
                    onChange={(e) => setRecFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  >
                    <option value="monthly">Every Month</option>
                    <option value="weekly">Every Week</option>
                    <option value="daily">Every Day</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Currency
                  </label>
                  <select
                    value={recCurrency}
                    onChange={(e) => setRecCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Starting Month &amp; Year
                  </label>
                  <input
                    type="month"
                    value={recStartPeriod}
                    onChange={(e) => setRecStartPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Receive Day (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={recReceiveDay}
                    onChange={(e) => setRecReceiveDay(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Receiving Bank Account
                </label>
                <select
                  value={recBankAccount}
                  onChange={(e) => setRecBankAccount(e.target.value)}
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
                {editingRecId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteRecIncome(editingRecId)}
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
                    onClick={() => setIsRecModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer hover:opacity-80"
                    style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: COLORS.green, color: '#FFFFFF' }}
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
