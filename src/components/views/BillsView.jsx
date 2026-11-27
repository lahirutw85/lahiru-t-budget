import { useState, useMemo } from 'react';
import { Calendar, ChevronDown, Plus, X, Landmark, Trash2, Repeat, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getTodayDateString } from '../../utils/currencyUtils';
import { DEFAULT_BILLS, getBillAmountForPeriodKey } from '../../utils/budgetUtils';

/**
 * BillsView
 * ──────────────────────────────────────────────────────────
 * Manages recurring monthly bills (starting with Mobile and House Rent).
 * Each bill recurs every month with its defaultAmount, while allowing
 * per-month amount overrides when a specific month's bill changes.
 * Double-click any bill row to edit its amount, scope, or bank account.
 */
export const BillsView = ({
  COLORS,
  bills,
  setBills,
  currencies,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  years,
  ALL_MONTHS,
  computedBankAccounts = [],
  onRecordPaidExpense,
  onRemovePaidExpense,
}) => {
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencyCode = defaultCurrencyObj.code;

  // If Dashboard is on 'Full Year', default Bills view month display to current month
  const activeMonth = selectedMonth === 'Full Year'
    ? ALL_MONTHS[new Date().getMonth()]
    : selectedMonth;
  const monthIndex = ALL_MONTHS.indexOf(activeMonth);
  const periodKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;

  const billsList = useMemo(() => {
    if (Array.isArray(bills) && bills.length > 0) return bills;
    return DEFAULT_BILLS;
  }, [bills]);

  const getBillAmountForPeriod = (bill) => getBillAmountForPeriodKey(bill, periodKey);

  const handleTogglePaidBill = (e, bill) => {
    e.stopPropagation();
    const amount = getBillAmountForPeriod(bill);
    if (amount <= 0) return;

    const existingExpenseId = bill.paidMonths?.[periodKey];
    const nextPaidMonths = { ...(bill.paidMonths || {}) };
    const todayStr = getTodayDateString();
    const paymentDate = todayStr.startsWith(periodKey) ? todayStr : `${periodKey}-01`;

    if (existingExpenseId) {
      if (onRemovePaidExpense) onRemovePaidExpense(existingExpenseId);
      delete nextPaidMonths[periodKey];
    } else if (onRecordPaidExpense) {
      const expenseId = onRecordPaidExpense({
        date: paymentDate,
        category: bill.name,
        subCategory: 'Bill',
        amount,
        bankAccount: bill.bankAccount || '',
        notes: `Bill payment (${activeMonth} ${selectedYear})`,
      });
      nextPaidMonths[periodKey] = expenseId;
    }

    setBills(billsList.map(b => (b.id === bill.id ? { ...b, paidMonths: nextPaidMonths } : b)));
  };

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

  // Modal state for adding / editing a bill
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('0');
  const [billBankAccount, setBillBankAccount] = useState('');
  const [billDueDay, setBillDueDay] = useState('');
  const [onlyThisMonth, setOnlyThisMonth] = useState(false);

  const totalBillsForMonth = billsList.reduce((sum, b) => sum + getBillAmountForPeriod(b), 0);

  const openNewBillModal = () => {
    setEditingBillId(null);
    setBillName('');
    setBillAmount('0');
    setBillBankAccount('');
    setBillDueDay('');
    setOnlyThisMonth(false);
    setIsModalOpen(true);
  };

  const openEditBillModal = (bill) => {
    const hasOverride = bill.monthlyOverrides && Object.prototype.hasOwnProperty.call(bill.monthlyOverrides, periodKey);
    setEditingBillId(bill.id);
    setBillName(bill.name || '');
    setBillAmount(String(getBillAmountForPeriod(bill)));
    setBillBankAccount(bill.bankAccount || '');
    setBillDueDay(bill.dueDay ? String(bill.dueDay) : '');
    setOnlyThisMonth(Boolean(hasOverride));
    setIsModalOpen(true);
  };

  const handleSaveBill = (e) => {
    e.preventDefault();
    const trimmedName = billName.trim();
    if (!trimmedName) {
      alert('Please enter a bill name.');
      return;
    }
    const numericAmount = Math.max(0, parseFloat(billAmount) || 0);

    let updated;
    if (editingBillId) {
      updated = billsList.map(b => {
        if (b.id !== editingBillId) return b;
        const nextOverrides = { ...(b.monthlyOverrides || {}) };
        let nextDefault = parseFloat(b.defaultAmount) || 0;

        if (onlyThisMonth) {
          nextOverrides[periodKey] = numericAmount;
        } else {
          nextDefault = numericAmount;
          delete nextOverrides[periodKey];
        }

        return {
          ...b,
          name: trimmedName,
          defaultAmount: nextDefault,
          monthlyOverrides: nextOverrides,
          bankAccount: billBankAccount,
          dueDay: billDueDay.trim(),
        };
      });
    } else {
      updated = [
        ...billsList,
        {
          id: `bill-${Date.now()}`,
          name: trimmedName,
          defaultAmount: numericAmount,
          monthlyOverrides: {},
          bankAccount: billBankAccount,
          dueDay: billDueDay.trim(),
        },
      ];
    }

    setBills(updated);
    setIsModalOpen(false);
  };

  const handleDeleteBill = (id) => {
    setBills(billsList.filter(b => b.id !== id));
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Header & Period Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.textPrimary }}>
            <Calendar className="w-7 h-7" style={{ color: COLORS.purple }} />
            Bills
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            Recurring monthly bills for <span style={{ color: COLORS.textPrimary }}>{activeMonth} {selectedYear}</span>.
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
            onClick={openNewBillModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 ml-1 cursor-pointer"
            style={{ backgroundColor: COLORS.purple, color: '#FFFFFF' }}
          >
            <Plus className="w-4 h-4" />
            Create New Bill
          </button>
        </div>
      </div>

      {/* Bills List Card */}
      <div
        className="p-6 rounded-2xl border"
        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Monthly Recurring Bills
            </h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
              Double-click any bill to edit its amount (for {activeMonth} only or every month) and linked bank account. Total:{' '}
              <span className="font-bold" style={{ color: COLORS.textPrimary }}>
                {formatCurrency(totalBillsForMonth, currencyCode, currencies)}
              </span>
            </p>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: COLORS.border }}>
          {billsList.map((bill) => {
            const amountForMonth = getBillAmountForPeriod(bill);
            const hasOverride = bill.monthlyOverrides && Object.prototype.hasOwnProperty.call(bill.monthlyOverrides, periodKey);

            return (
              <div
                key={bill.id}
                onDoubleClick={() => openEditBillModal(bill)}
                title="Double-click to edit bill"
                className="py-3.5 px-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-white/5 select-none"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>
                      {bill.name}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        backgroundColor: hasOverride ? 'rgba(245, 158, 11, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                        color: hasOverride ? COLORS.orange : COLORS.purple,
                      }}
                    >
                      <Repeat className="w-2.5 h-2.5" />
                      {hasOverride ? `${activeMonth} Custom` : 'Monthly'}
                    </span>
                    {bill.dueDay && (
                      <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                        Due Day {bill.dueDay}
                      </span>
                    )}
                  </div>

                  {bill.bankAccount && (
                    <div className="flex items-center gap-1.5 text-[11px] mt-1 font-medium" style={{ color: COLORS.skyBlue }}>
                      <Landmark className="w-3 h-3 shrink-0" />
                      <span className="truncate">{bill.bankAccount}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {amountForMonth > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleTogglePaidBill(e, bill)}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-opacity hover:opacity-85 cursor-pointer"
                      style={{
                        backgroundColor: bill.paidMonths?.[periodKey] ? 'rgba(16, 185, 129, 0.15)' : COLORS.bgMain,
                        borderColor: bill.paidMonths?.[periodKey] ? COLORS.green : COLORS.border,
                        color: bill.paidMonths?.[periodKey] ? COLORS.green : COLORS.textSecondary,
                      }}
                      title={bill.paidMonths?.[periodKey] ? 'Click to unmark paid' : 'Mark as paid & add to monthly spending'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {bill.paidMonths?.[periodKey] ? 'Paid' : 'Mark Paid'}
                    </button>
                  )}
                  <div className="text-right font-bold text-base" style={{ color: COLORS.textPrimary }}>
                    {formatCurrency(amountForMonth, currencyCode, currencies)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
          >
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: COLORS.border }}>
              <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                {editingBillId ? 'Edit Bill' : 'Create New Bill'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                style={{ color: COLORS.textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Bill Name
                </label>
                <input
                  type="text"
                  required
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  placeholder="e.g. Mobile, House Rent, Internet"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Amount ({currencyCode})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                    Due Day (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={billDueDay}
                    onChange={(e) => setBillDueDay(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                    style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                  />
                </div>
              </div>

              {editingBillId && (
                <label
                  className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-medium"
                  style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
                >
                  <input
                    type="checkbox"
                    checked={onlyThisMonth}
                    onChange={(e) => setOnlyThisMonth(e.target.checked)}
                    className="rounded cursor-pointer"
                  />
                  <span>
                    Change amount only for <strong>{activeMonth} {selectedYear}</strong> (uncheck to update every month)
                  </span>
                </label>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                  Bank Account
                </label>
                <select
                  value={billBankAccount}
                  onChange={(e) => setBillBankAccount(e.target.value)}
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
                {editingBillId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBill(editingBillId)}
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
                    onClick={() => setIsModalOpen(false)}
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
