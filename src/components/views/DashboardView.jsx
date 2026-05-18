import React from 'react';
import { 
  Calendar, ChevronDown, Plus, Trash2, CircleDollarSign, 
  TrendingUp, TrendingDown, ShoppingCart, Wallet, Home, 
  ArrowUpRight, ArrowDownRight, Briefcase, Star
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { convertCurrency, formatCurrency, getCurrencyRowStyle, formatExpenseDate } from '../../utils/currencyUtils';
import { buildDonutData, sumByCurrency, groupByCategory } from '../../utils/chartUtils';

export const DashboardView = ({
  COLORS,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  years,
  handleAddYear,
  handleDeleteYear,
  ALL_MONTHS,
  filteredExpenses,
  filteredIncomes,
  prevExpenses,
  prevIncomes,
  bankBalancesSumDefault,
  balancesByCurrency,
  activeCurrencies,
  currencies,
  categories,
  INCOME_CATEGORIES,
  isDarkMode
}) => {
  // ─── 1. RESOLVED CURRENCY CODE & SYMBOLS ──────────────────
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencySymbol = defaultCurrencyObj.symbol;
  const currencyCode   = defaultCurrencyObj.code;

  // Local helper to format currency with active currencies list
  const formatCurrencyLocal = (amount, curCode) => {
    return formatCurrency(amount, curCode, currencies);
  };

  // ─── 2. ICON RESOLVER ─────────────────────────────────────
  const getIconForCategory = (catName) => {
    const foundExpense = categories.find(c => c.name.toLowerCase() === catName?.toLowerCase());
    if (foundExpense) return foundExpense.icon;
    const foundIncome = INCOME_CATEGORIES.find(c => c.name.toLowerCase() === catName?.toLowerCase());
    return foundIncome ? foundIncome.icon : Wallet;
  };

  // ─── 3. DERIVED COMPUTED VALUES ───────────────────────────
  // Total amounts grouped by currency
  const expensesSumByCurrency = sumByCurrency(filteredExpenses);
  const incomesSumByCurrency  = sumByCurrency(filteredIncomes);

  // Group by category THEN currency for breakdowns
  const categoryTotalsByCurrency = groupByCategory(filteredExpenses);
  const incomeCategoryTotalsByCurrency = groupByCategory(filteredIncomes);

  // Format Category Breakdowns
  const formatCategoryBreakdown = (catName) => {
    const breakdown = categoryTotalsByCurrency[catName] || {};
    const entries = Object.entries(breakdown).filter(([_, val]) => val > 0);
    if (entries.length === 0) return formatCurrencyLocal(0, currencyCode);
    if (entries.length === 1) return formatCurrencyLocal(entries[0][1], entries[0][0]);
    return entries.map(([cur, val]) => formatCurrencyLocal(val, cur)).join(', ');
  };

  const formatIncomeCategoryBreakdown = (catName) => {
    const breakdown = incomeCategoryTotalsByCurrency[catName] || {};
    const entries = Object.entries(breakdown).filter(([_, val]) => val > 0);
    if (entries.length === 0) return formatCurrencyLocal(0, currencyCode);
    if (entries.length === 1) return formatCurrencyLocal(entries[0][1], entries[0][0]);
    return entries.map(([cur, val]) => formatCurrencyLocal(val, cur)).join(', ');
  };

  // Group by category (Expense) converted to default currency
  const categoryTotals = filteredExpenses.reduce((groups, exp) => {
    const cat = exp.category || 'Other';
    const txCurrency = exp.currency || 'AED';
    const converted = convertCurrency(exp.amount, txCurrency, currencyCode);
    groups[cat] = (groups[cat] || 0) + converted;
    return groups;
  }, {});

  const categoryColors = {
    'home/rent': COLORS.skyBlue,
    'housing': COLORS.skyBlue,
    'food': COLORS.green,
    'utility': COLORS.purple,
    'leisure': COLORS.pink,
    'transport': COLORS.orange,
  };

  const dynamicDonutData = Object.keys(categoryTotals).map(cat => {
    const key = cat.toLowerCase();
    const color = categoryColors[key] || COLORS.yellow;
    return { name: cat, value: categoryTotals[cat], color };
  });

  const finalDonutData = buildDonutData(categoryTotals, 'expense', isDarkMode ? '#1F2937' : '#E5E7EB');

  // Total expenditure in default currency
  const totalExpenditure = filteredExpenses.reduce((sum, exp) => {
    const txCurrency = exp.currency || 'AED';
    const converted = convertCurrency(exp.amount, txCurrency, currencyCode);
    return sum + converted;
  }, 0);
  const formattedTotalExpenditure = formatCurrencyLocal(totalExpenditure, currencyCode);

  // Group by category (Income) converted to default currency
  const incomeCategoryTotals = filteredIncomes.reduce((groups, inc) => {
    const cat = inc.category || 'Other';
    const txCurrency = inc.currency || 'AED';
    const converted = convertCurrency(inc.amount, txCurrency, currencyCode);
    groups[cat] = (groups[cat] || 0) + converted;
    return groups;
  }, {});

  const incomeCategoryColors = {
    'salary': COLORS.green,
    'business': COLORS.skyBlue,
    'investment': COLORS.purple,
    'gifts/grants': COLORS.pink,
    'others': COLORS.yellow,
  };

  const totalIncomeValue = filteredIncomes.reduce((sum, inc) => {
    const txCurrency = inc.currency || 'AED';
    const converted = convertCurrency(inc.amount, txCurrency, currencyCode);
    return sum + converted;
  }, 0);
  const formattedTotalIncomeValue = formatCurrencyLocal(totalIncomeValue, currencyCode);

  // Previous month's totals & changes
  const prevTotalExpenditure = prevExpenses.reduce((sum, exp) => {
    const txCurrency = exp.currency || 'AED';
    const converted = convertCurrency(exp.amount, txCurrency, currencyCode);
    return sum + converted;
  }, 0);
  const prevTotalIncomeValue = prevIncomes.reduce((sum, inc) => {
    const txCurrency = inc.currency || 'AED';
    const converted = convertCurrency(inc.amount, txCurrency, currencyCode);
    return sum + converted;
  }, 0);
  const prevInHandValue = (prevTotalIncomeValue - prevTotalExpenditure) + bankBalancesSumDefault;

  // Percentage changes compared to previous month
  let incomeChangePct = 0;
  if (prevTotalIncomeValue > 0) {
    incomeChangePct = Math.round(((totalIncomeValue - prevTotalIncomeValue) / prevTotalIncomeValue) * 100);
  } else if (totalIncomeValue > 0) {
    incomeChangePct = 100;
  }

  let spendingChangePct = 0;
  if (prevTotalExpenditure > 0) {
    spendingChangePct = Math.round(((totalExpenditure - prevTotalExpenditure) / prevTotalExpenditure) * 100);
  } else if (totalExpenditure > 0) {
    spendingChangePct = 100;
  }

  let inHandChangePct = 0;
  const currentInHand = (totalIncomeValue - totalExpenditure) + bankBalancesSumDefault;
  if (prevInHandValue !== 0) {
    inHandChangePct = Math.round(((currentInHand - prevInHandValue) / Math.abs(prevInHandValue)) * 100);
  } else if (currentInHand !== 0) {
    inHandChangePct = currentInHand > 0 ? 100 : -100;
  }

  // Dynamic Income Sources
  const dynamicIncomeSources = Object.keys(incomeCategoryTotals).map(catName => {
    const val = incomeCategoryTotals[catName];
    const pct = totalIncomeValue > 0 ? Math.round((val / totalIncomeValue) * 100) : 0;
    return {
      name: catName,
      icon: getIconForCategory(catName),
      pct: pct,
      amount: val
    };
  }).sort((a, b) => b.amount - a.amount);

  const finalIncomeSources = dynamicIncomeSources.length > 0 ? dynamicIncomeSources : [
    { name: 'Salary', icon: Briefcase, pct: 100, amount: 0 },
  ];

  // Highest Expense Category
  let highestCategoryName = 'None';
  let highestCategoryAmount = 0;
  if (Object.keys(categoryTotals).length > 0) {
    const sortedCategories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);
    highestCategoryName = sortedCategories[0];
    highestCategoryAmount = categoryTotals[highestCategoryName];
  }
  const formattedHighestCategoryAmount = formatCurrencyLocal(highestCategoryAmount, currencyCode);

  // Dynamic major outgoings
  const majorOutgoings = Object.keys(categoryTotals).map(catName => {
    const amount = categoryTotals[catName];
    const pct = totalExpenditure > 0 ? Math.round((amount / totalExpenditure) * 100) : 0;
    return {
      name: catName,
      icon: getIconForCategory(catName),
      pct: pct
    };
  }).sort((a, b) => b.pct - a.pct).slice(0, 4);

  const finalMajorOutgoings = majorOutgoings.length > 0 ? majorOutgoings : [
    { name: 'No Outgoings yet', icon: Wallet, pct: 0 }
  ];

  // Savings allocations
  const savingsAllocations = Object.entries(balancesByCurrency).map(([cur, bal]) => {
    return {
      name: `${cur} Savings`,
      amount: bal,
      currency: cur
    };
  });

  // ─── 4. SUB-RENDER HELPER FUNCTIONS ───────────────────────
  const renderMultiCurrencySum = (sumMap, defaultColorStyle = {}) => {
    if (activeCurrencies.length <= 1) {
      const cur = activeCurrencies[0];
      const val = sumMap[cur] || 0;
      return (
        <div className="text-2xl font-bold" style={defaultColorStyle}>
          {formatCurrencyLocal(val, cur)}
        </div>
      );
    }

    return (
      <div className="space-y-1.5 mt-2 max-h-[110px] overflow-y-auto pr-1">
        {activeCurrencies.map(cur => {
          const val = sumMap[cur] || 0;
          return (
            <div key={cur} className="flex justify-between items-center text-sm font-bold border-b border-white/5 pb-0.5" style={defaultColorStyle}>
              <span className="text-xs opacity-75 font-bold uppercase tracking-wider mr-2">{cur}:</span>
              <span>{formatCurrencyLocal(val, cur)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDonutCenterMultiCurrency = (sumMap) => {
    if (activeCurrencies.length <= 1) {
      const cur = activeCurrencies[0];
      const val = sumMap[cur] || 0;
      return (
        <span className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          {formatCurrencyLocal(val, cur)}
        </span>
      );
    }
    return (
      <div className="text-center space-y-0.5 max-h-[65px] overflow-y-auto px-2">
        {activeCurrencies.map(cur => {
          const val = sumMap[cur] || 0;
          return (
            <div key={cur} className="text-xs font-bold leading-tight" style={{ color: COLORS.textPrimary }}>
              {formatCurrencyLocal(val, cur)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSingleDonutChart = (cur, type = 'expense') => {
    const items = type === 'income' ? filteredIncomes : filteredExpenses;
    const categoryTotalsForCurrency = items.reduce((groups, item) => {
      const txCurrency = item.currency || 'AED';
      if (txCurrency === cur) {
        const cat = item.category || 'Other';
        groups[cat] = (groups[cat] || 0) + item.amount;
      }
      return groups;
    }, {});

    const dynamicDonutDataForCurrency = Object.keys(categoryTotalsForCurrency).map(cat => {
      const key = cat.toLowerCase();
      const color = type === 'income'
        ? (incomeCategoryColors[key] || COLORS.yellow)
        : (categoryColors[key] || COLORS.yellow);
      return {
        name: cat,
        value: categoryTotalsForCurrency[cat],
        color: color
      };
    });

    const finalDonutDataForCurrency = dynamicDonutDataForCurrency.length > 0 ? dynamicDonutDataForCurrency : [
      { name: type === 'income' ? 'No Incomes' : 'No Expenses', value: 1, color: isDarkMode ? '#1F2937' : '#E5E7EB' }
    ];

    const currencyTotalAmount = Object.values(categoryTotalsForCurrency).reduce((sum, val) => sum + val, 0);

    return (
      <div key={cur} className="flex flex-col border rounded-xl p-4 relative" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <h4 className="text-xs font-bold text-center uppercase tracking-wider mb-2" style={{ color: type === 'income' ? COLORS.green : COLORS.skyBlue }}>
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
            <span className="text-xs font-bold" style={{ color: type === 'income' ? COLORS.green : COLORS.textPrimary }}>
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

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* Title & Date Selectors */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>DashBoard</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            financial Details for <span style={{ color: COLORS.textPrimary }}>{selectedMonth} {selectedYear}</span>
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
              {['Full Year', ...ALL_MONTHS].map(m => (
                <option key={m} value={m} style={{ backgroundColor: COLORS.bgCard }}>{m}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }}/>
          </div>
          <button 
            onClick={handleAddYear}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer" 
            style={{ backgroundColor: 'rgba(79, 209, 245, 0.1)', color: COLORS.skyBlue }}
            title="Add Year"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeleteYear}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer" 
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: COLORS.red }}
            title="Delete Year"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Monthly Income */}
        <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, minHeight: '160px' }}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
                <CircleDollarSign className="w-5 h-5" style={{ color: COLORS.green }} />
              </div>
              <div className="flex items-center text-xs font-bold" style={{ color: incomeChangePct >= 0 ? COLORS.green : COLORS.red }}>
                {incomeChangePct >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {incomeChangePct >= 0 ? `+${incomeChangePct}%` : `${incomeChangePct}%`}
              </div>
            </div>
            <h3 className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>Total Monthly Income</h3>
          </div>
          {renderMultiCurrencySum(incomesSumByCurrency, { color: COLORS.green })}
        </div>

        {/* Total Monthly Spending */}
        <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, minHeight: '160px' }}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <ShoppingCart className="w-5 h-5" style={{ color: COLORS.red }} />
              </div>
              <div className="flex items-center text-xs font-bold" style={{ color: spendingChangePct <= 0 ? COLORS.green : COLORS.red }}>
                {spendingChangePct <= 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                {spendingChangePct >= 0 ? `+${spendingChangePct}%` : `${spendingChangePct}%`}
              </div>
            </div>
            <h3 className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>Total Monthly Spending</h3>
          </div>
          {renderMultiCurrencySum(expensesSumByCurrency, { color: COLORS.textPrimary })}
        </div>

        {/* In Hand Balance */}
        <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, minHeight: '160px' }}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 225, 106, 0.1)' }}>
                <Wallet className="w-5 h-5" style={{ color: COLORS.yellow }} />
              </div>
              <div className="flex items-center text-xs font-bold" style={{ color: inHandChangePct >= 0 ? COLORS.green : COLORS.red }}>
                {inHandChangePct >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {inHandChangePct >= 0 ? `+${inHandChangePct}%` : `${inHandChangePct}%`}
              </div>
            </div>
            <h3 className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>In Hand (Balance)</h3>
          </div>
          {renderMultiCurrencySum(balancesByCurrency, { color: COLORS.yellow })}
        </div>

        {/* Highest Expense */}
        <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, minHeight: '160px' }}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <Home className="w-5 h-5" style={{ color: COLORS.orange }} />
              </div>
              <div className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 uppercase" style={{ color: COLORS.textPrimary }}>{highestCategoryName}</div>
            </div>
            <h3 className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>Highest Expense Category</h3>
          </div>
          {highestCategoryName === 'None' ? (
            <div className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{formatCurrencyLocal(0, currencyCode)}</div>
          ) : (
            renderMultiCurrencySum((() => {
              const sumData = {};
              filteredExpenses.filter(e => e.category === highestCategoryName).forEach(exp => {
                const cur = exp.currency || 'AED';
                sumData[cur] = (sumData[cur] || 0) + exp.amount;
              });
              return sumData;
            })(), { color: COLORS.textPrimary })
          )}
        </div>
      </div>

      {/* Row 2: Income vs Expenses & Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expenses (col-span-2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border flex flex-col" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>Income vs Expenses</h2>
            <div className="flex gap-4 text-xs font-medium" style={{ color: COLORS.textPrimary }}>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.green }}></div> Income</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.red }}></div> Expenses</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 flex-1">
            {/* Income Sources */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: COLORS.green }}>
                <ArrowUpRight className="w-4 h-4" /> Income Sources
              </h3>
              {finalIncomeSources.map((item, i) => {
                const ItemIcon = item.icon || Briefcase;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                        <ItemIcon className="w-4 h-4" style={{ color: COLORS.green }}/> {item.name}
                      </span>
                      <span style={{ color: COLORS.textSecondary }}>{item.pct}%</span>
                    </div>
                    <div className="text-[10px] pl-6 text-gray-500 mb-2 truncate" title={formatIncomeCategoryBreakdown(item.name)}>
                      {formatIncomeCategoryBreakdown(item.name)}
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: COLORS.activeBg }}>
                      <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: COLORS.green }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Major Outgoings */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: COLORS.skyBlue }}>
                <ArrowDownRight className="w-4 h-4" /> Major Outgoings
              </h3>
              {finalMajorOutgoings.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                      <item.icon className="w-4 h-4" style={{ color: COLORS.skyBlue }}/> {item.name}
                    </span>
                    <span style={{ color: COLORS.textSecondary }}>{item.pct}%</span>
                  </div>
                  <div className="text-[10px] pl-6 text-gray-500 mb-2 truncate" title={formatCategoryBreakdown(item.name)}>
                    {formatCategoryBreakdown(item.name)}
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: COLORS.activeBg }}>
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: COLORS.skyBlue }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Savings Allocations */}
        <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div>
            <h2 className="text-sm font-bold tracking-wider mb-6" style={{ color: COLORS.textPrimary }}>
              SAVINGS ALLOCATIONS
            </h2>
            <div className="space-y-4">
              {savingsAllocations.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.skyBlue }}></div>
                    <span style={{ color: COLORS.textPrimary }}>{item.name}</span>
                  </div>
                  <span style={{ color: COLORS.textPrimary }}>{formatCurrencyLocal(item.amount, item.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Comparison & Spending Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-8" style={{ color: COLORS.textPrimary }}>
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.skyBlue }}/>
            Monthly Comparison
          </h2>
          <div className="space-y-6">
            {[
              { 
                name: 'TOTAL INCOME', 
                budget: formatCurrencyLocal(28500, currencyCode), 
                actual: formattedTotalIncomeValue, 
                percent: 28500 > 0 ? Math.min(100, Math.round((totalIncomeValue / 28500) * 100)) : 0,
                color: COLORS.green,
                badge: 28500 > 0 ? `${Math.round((totalIncomeValue / 28500) * 100)}%` : '0%',
                badgeColor: COLORS.green
              },
              { 
                name: 'TOTAL EXPENSES', 
                budget: formatCurrencyLocal(10000, currencyCode), 
                actual: formattedTotalExpenditure, 
                percent: 10000 > 0 ? Math.min(100, Math.round((totalExpenditure / 10000) * 100)) : 0,
                color: COLORS.red,
                badge: 10000 > 0 ? `${Math.round((totalExpenditure / 10000) * 100)}%` : '0%',
                badgeColor: COLORS.red
              },
              { 
                name: 'NET', 
                budget: formatCurrencyLocal(18500, currencyCode), 
                actual: formatCurrencyLocal(totalIncomeValue - totalExpenditure, currencyCode), 
                percent: 18500 > 0 ? Math.min(100, Math.max(0, Math.round(((totalIncomeValue - totalExpenditure) / 18500) * 100))) : 0,
                color: (totalIncomeValue - totalExpenditure) >= 0 ? COLORS.skyBlue : COLORS.red,
                badge: 18500 > 0 ? `${Math.round(((totalIncomeValue - totalExpenditure) / 18500) * 100)}%` : '0%',
                badgeColor: (totalIncomeValue - totalExpenditure) >= 0 ? COLORS.green : COLORS.red
              }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span style={{ color: COLORS.textPrimary }}>{item.name}</span>
                  <span style={{ color: item.badgeColor }}>{item.badge}</span>
                </div>
                <div className="h-2 rounded-full mb-2" style={{ backgroundColor: COLORS.activeBg }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percent}%`, backgroundColor: item.color }}></div>
                </div>
                <div className="flex justify-between text-xs" style={{ color: COLORS.textSecondary }}>
                  <span>Budget: {item.budget}</span>
                  <span>Actual: {item.actual}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by Category */}
        <div className="p-6 rounded-2xl border flex flex-col" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-lg font-bold mb-6" style={{ color: COLORS.textPrimary }}>Spending by Category</h2>
          
          {activeCurrencies.length <= 1 ? (
            <>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finalDonutData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {finalDonutData.map((entry, index) => (
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
                  <span className="text-xs mb-0.5" style={{ color: COLORS.textSecondary }}>Total</span>
                  {renderDonutCenterMultiCurrency(expensesSumByCurrency)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 px-4 max-h-[100px] overflow-y-auto">
                {dynamicDonutData.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 text-xs font-medium" style={{ color: COLORS.textPrimary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="text-[10px] pl-4 text-gray-500 truncate" title={formatCategoryBreakdown(item.name)}>
                      {formatCategoryBreakdown(item.name)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[450px] pr-1">
              {activeCurrencies.map(cur => renderSingleDonutChart(cur, 'expense'))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Recent Transactions */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <h2 className="text-base font-bold mb-6" style={{ color: COLORS.textPrimary }}>
          Recent Significant Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b" style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}>
                <th className="pb-3 px-4 font-bold">Date</th>
                <th className="pb-3 px-4 font-bold">Description</th>
                <th className="pb-3 px-4 font-bold">Category</th>
                <th className="pb-3 px-4 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center font-medium" style={{ color: COLORS.textSecondary }}>
                    No recent expenses entered.
                  </td>
                </tr>
              ) : (
                filteredExpenses.slice(0, 5).map((exp) => {
                  const rowStyle = getCurrencyRowStyle(exp.currency || 'AED', isDarkMode);
                  return (
                    <tr key={exp.id} className="border-b transition-colors hover:opacity-90" style={{ ...rowStyle, borderColor: COLORS.border }}>
                      <td className="py-4 px-4 font-medium" style={{ color: COLORS.textPrimary }}>{formatExpenseDate(exp.date)}</td>
                      <td className="py-4 px-4" style={{ color: COLORS.textSecondary }}>{exp.notes || exp.subCategory || 'Expense'}</td>
                      <td className="py-4 px-4">
                        <span 
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: COLORS.red }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-right" style={{ color: COLORS.red }}>
                        - {formatCurrencyLocal(exp.amount, exp.currency || 'AED')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
