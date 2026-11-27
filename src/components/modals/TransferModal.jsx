import { useState } from 'react';
import { X, ArrowLeftRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, convertCurrency, getTodayDateString } from '../../utils/currencyUtils';

export const TransferModal = ({
  isOpen,
  onClose,
  COLORS,
  computedBankAccounts,
  currencies,
  initialFromAccountId = '',
  onTransfer,
}) => {
  const transferableAccounts = (computedBankAccounts || []).filter(
    acc => acc.accountType !== 'Credit Card'
  );

  const defaultFrom =
    initialFromAccountId ||
    transferableAccounts.find(a => (Number(a.balance) || 0) > 0)?.id ||
    transferableAccounts[0]?.id ||
    '';

  const defaultTo =
    transferableAccounts.find(a => a.id !== defaultFrom)?.id || '';

  const [fromId, setFromId] = useState(defaultFrom);
  const [toId, setToId] = useState(defaultTo);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const fromAccount = transferableAccounts.find(a => a.id === fromId);
  const toAccount = transferableAccounts.find(a => a.id === toId);
  const availableBalance = Number(fromAccount?.balance) || 0;
  const parsedAmount = parseFloat(amount) || 0;

  const convertedPreview =
    fromAccount && toAccount && parsedAmount > 0 && fromAccount.currency !== toAccount.currency
      ? convertCurrency(parsedAmount, fromAccount.currency, toAccount.currency, currencies)
      : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fromAccount || !toAccount) {
      setErrorMsg('Please select both source and destination bank accounts.');
      return;
    }
    if (fromAccount.id === toAccount.id) {
      setErrorMsg('Source and destination accounts must be different.');
      return;
    }
    if (availableBalance <= 0) {
      setErrorMsg(
        `Insufficient funds in ${fromAccount.bankName}: available balance is ${formatCurrency(availableBalance, fromAccount.currency, currencies)}.`
      );
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid transfer amount greater than 0.');
      return;
    }
    if (parsedAmount > availableBalance) {
      setErrorMsg(
        `Insufficient funds: you tried to transfer ${formatCurrency(parsedAmount, fromAccount.currency, currencies)}, but ${fromAccount.bankName} only has ${formatCurrency(availableBalance, fromAccount.currency, currencies)} available.`
      );
      return;
    }

    try {
      onTransfer({
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: parsedAmount,
        date,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Transfer failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-[#4FD1F5]" />
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Internal Bank Transfer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: COLORS.textSecondary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl text-sm border bg-red-500/10 border-red-500/30 text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {fromAccount && availableBalance <= 0 && !errorMsg && (
            <div className="p-3 rounded-xl text-xs border bg-amber-500/10 border-amber-500/30 text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {fromAccount.bankName} currently has no available funds ({formatCurrency(availableBalance, fromAccount.currency, currencies)}).
              </span>
            </div>
          )}

          {/* From Account */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
              From Account
            </label>
            <select
              value={fromId}
              onChange={(e) => {
                setFromId(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
              style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
            >
              {transferableAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} ({acc.accountType}) — {formatCurrency(acc.balance, acc.currency, currencies)}
                </option>
              ))}
            </select>
            {fromAccount && (
              <p className="text-xs mt-1" style={{ color: availableBalance > 0 ? COLORS.green : COLORS.red }}>
                Available: {formatCurrency(availableBalance, fromAccount.currency, currencies)}
              </p>
            )}
          </div>

          {/* To Account */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
              To Account
            </label>
            <select
              value={toId}
              onChange={(e) => {
                setToId(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
              style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
            >
              {transferableAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} ({acc.accountType}) — {formatCurrency(acc.balance, acc.currency, currencies)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                Amount ({fromAccount?.currency || ''})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          {convertedPreview !== null && (
            <div className="p-2.5 rounded-xl text-xs bg-[#4FD1F5]/10 border border-[#4FD1F5]/20 text-[#4FD1F5] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Converted amount to {toAccount.bankName}:{' '}
                <strong>{formatCurrency(convertedPreview, toAccount.currency, currencies)}</strong>
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
              Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly savings transfer"
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
              style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold border hover:bg-white/5 cursor-pointer transition-colors"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-[#0B0F19] bg-[#4FD1F5] hover:opacity-90 cursor-pointer transition-opacity"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Transfer Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
