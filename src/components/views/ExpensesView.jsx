import { Calendar, ChevronDown, Plus, ShoppingCart, Edit2, Trash2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency, getCurrencyRowStyle, formatExpenseDate } from '../../utils/currencyUtils';
import { buildDonutData } from '../../utils/chartUtils';

export const ExpensesView = ({
  COLORS,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  years,
  ALL_MONTHS,
  setFormType,
  categories,
  setEditingExpenseId,
  setIsAddExpenseOpen,
  activeCurrencies,
  currencies,
  filteredExpenses,
  isDarkMode,
  handleEditExpense,
  handleDeleteExpense
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
    const foundExpense = categories.find(c => c.name.toLowerCase() === catName?.toLowerCase());
    return foundExpense ? foundExpense.icon : ShoppingCart;
  };

  // Local array conversion for mapping and array iteration
  const expensesArray = filteredExpenses.toArray();

  // ─── 2. DERIVED VALUES ────────────────────────────────────
  const expensesSumByCurrency = filteredExpenses.sumByCurrency();

  // Group by category converted to default currency
  const categoryTotals = filteredExpenses.categoryTotalsInCurrency(currencyCode);

  const categoryColors = {
    'home/rent': COLORS.skyBlue,
    'housing': COLORS.skyBlue,
    'food': COLORS.green,
    'utility': COLORS.purple,
    'leisure': COLORS.pink,
    'transport': COLORS.orange,
  };

  const finalDonutData = buildDonutData(categoryTotals, 'expense', isDarkMode ? '#1F2937' : '#E5E7EB');

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

  const renderExpensesDonutCenterMultiCurrency = (sumMap) => {
    if (activeCurrencies.length <= 1) {
      const cur = activeCurrencies[0];
      const val = sumMap[cur] || 0;
      return (
        <span className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
          {formatCurrencyLocal(val, cur)}
        </span>
      );
    }
    return (
      <div className="text-center space-y-1 max-h-[85px] overflow-y-auto px-4">
        {activeCurrencies.map(cur => {
          const val = sumMap[cur] || 0;
          return (
            <div key={cur} className="text-sm font-bold leading-tight" style={{ color: COLORS.textPrimary }}>
              {formatCurrencyLocal(val, cur)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSingleDonutChart = (cur) => {
    const categoryTotalsForCurrency = {};
    expensesArray.forEach(item => {
      const txCurrency = item.currency || 'AED';
      if (txCurrency === cur) {
        const cat = item.category || 'Other';
        categoryTotalsForCurrency[cat] = (categoryTotalsForCurrency[cat] || 0) + item.amount;
      }
    });

    const dynamicDonutDataForCurrency = Object.keys(categoryTotalsForCurrency).map(cat => {
      const key = cat.toLowerCase();
      const color = categoryColors[key] || COLORS.yellow;
      return {
        name: cat,
        value: categoryTotalsForCurrency[cat],
        color: color
      };
    });

    const finalDonutDataForCurrency = dynamicDonutDataForCurrency.length > 0 ? dynamicDonutDataForCurrency : [
      { name: 'No Expenses', value: 1, color: isDarkMode ? '#1F2937' : '#E5E7EB' }
    ];

    const currencyTotalAmount = Object.values(categoryTotalsForCurrency).reduce((sum, val) => sum + val, 0);

    return (
      <div key={cur} className="flex flex-col border rounded-xl p-4 relative" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
        <h4 className="text-xs font-bold text-center uppercase tracking-wider mb-2" style={{ color: COLORS.skyBlue }}>
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
            <span className="text-xs font-bold" style={{ color: COLORS.textPrimary }}>
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
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>Expenses</h1>
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
              {ALL_MONTHS.map(m => (
                <option key={m} value={m} style={{ backgroundColor: COLORS.bgCard }}>{m}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 -ml-4 pointer-events-none" style={{ color: COLORS.textSecondary }}/>
          </div>
          <button 
            onClick={() => {
              setFormType('expense');
              setEditingExpenseId(null);
              setIsAddExpenseOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 ml-2 cursor-pointer" 
            style={{ backgroundColor: COLORS.red, color: '#FFFFFF' }}
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Layout for Total Expenditure and Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left side: Total Expenditure */}
        <div className="p-8 rounded-2xl border flex flex-col justify-center min-h-[220px]" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <ShoppingCart className="w-6 h-6" style={{ color: COLORS.red }} />
            </div>
            <h3 className="text-lg font-medium" style={{ color: COLORS.textSecondary }}>Total Expenditure</h3>
          </div>
          {renderSubPageMultiCurrencySum(expensesSumByCurrency, { color: COLORS.textPrimary })}
        </div>

        {/* Right side: Spending by Category */}
        <div className="p-8 rounded-2xl border flex flex-col" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.textSecondary }}>Spending by Category</h2>
          
          {activeCurrencies.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalDonutData}
                    innerRadius={90}
                    outerRadius={120}
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
                <span className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>Total</span>
                {renderExpensesDonutCenterMultiCurrency(expensesSumByCurrency)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[500px] pr-1">
              {activeCurrencies.map(cur => renderSingleDonutChart(cur))}
            </div>
          )}
        </div>
        
      </div>

      {/* Expenses List Table */}
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
              {expensesArray.map((exp) => {
                const ExpIcon = getIconForCategory(exp.category);
                const rowStyle = getCurrencyRowStyle(exp.currency || 'AED', isDarkMode);
                return (
                  <tr key={exp.id} className="border-b transition-colors hover:opacity-90" style={{ ...rowStyle, borderColor: COLORS.border }}>
                    <td className="py-3 px-4">
                      <ExpIcon className="w-5 h-5" style={{ color: COLORS.skyBlue }} />
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: COLORS.textPrimary }}>{formatExpenseDate(exp.date)}</td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>{exp.category}</td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>{exp.subCategory}</td>
                    <td className="py-3 px-4 font-bold text-right pr-8" style={{ color: COLORS.textPrimary }}>
                      {formatCurrencyLocal(exp.amount, exp.currency || 'AED')}
                    </td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>
                      {(exp.account === 'Bank Account' || exp.account === 'Credit Card') && exp.bankName 
                        ? `${exp.account} (${exp.bankName})` 
                        : exp.account}
                    </td>
                    <td className="py-3 px-4" style={{ color: COLORS.textSecondary }}>{exp.notes}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => handleEditExpense(exp)}
                          className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                          style={{ color: COLORS.skyBlue }}
                          title="Edit Expense"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                          style={{ color: COLORS.red }}
                          title="Delete Expense"
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

    </div>
  );
};
