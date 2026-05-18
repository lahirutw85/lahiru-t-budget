import React from 'react';
import { Plus, Landmark, CreditCard, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

export const AccountsView = ({
  COLORS,
  setEditingBankAccountId,
  setBankFormName,
  setBankFormType,
  setBankFormCurrency,
  setBankFormBalance,
  setBankFormLimit,
  setBankFormRemainingLimit,
  setIsBankModalOpen,
  computedBankAccounts,
  currencies,
  handleEditBankAccount,
  handleDeleteBankAccount
}) => {
  // Local currency formatter helper using currency definitions
  const formatCurrencyLocal = (amount, curCode) => {
    return formatCurrency(amount, curCode, currencies);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>Bank details</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            manage your bank account here.
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingBankAccountId(null);
            setBankFormName('');
            setBankFormType('Savings');
            setBankFormCurrency('LKR');
            setBankFormBalance('');
            setBankFormLimit('');
            setBankFormRemainingLimit('');
            setIsBankModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: COLORS.skyBlue, color: '#0B0F19' }}
        >
          <Plus className="w-4 h-4" />
          Add New Bank Account
        </button>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {computedBankAccounts.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed rounded-2xl" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
            <Landmark className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: COLORS.textSecondary }} />
            <p className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>No bank accounts added yet</p>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Click the button above to add your first bank account.</p>
          </div>
        ) : (
          computedBankAccounts.map((account) => {
            const isCreditCard = account.accountType === 'Credit Card';
            const usedLimit = isCreditCard ? (account.limit - account.remainingLimit) : 0;
            const usedPercent = isCreditCard && account.limit > 0 ? Math.min(100, Math.max(0, (usedLimit / account.limit) * 100)) : 0;
            const remainingPercent = 100 - usedPercent;
            
            return (
              <div 
                key={account.id} 
                className="p-6 rounded-2xl border transition-all hover:scale-[1.01] flex flex-col justify-between" 
                style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border, minHeight: '260px' }}
              >
                <div>
                  {/* Card Top: Bank Icon and Badges */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: isCreditCard ? 'rgba(168, 85, 247, 0.1)' : 'rgba(56, 189, 248, 0.1)' }}>
                        {isCreditCard ? (
                          <CreditCard className="w-5 h-5" style={{ color: COLORS.purple }} />
                        ) : (
                          <Landmark className="w-5 h-5" style={{ color: COLORS.skyBlue }} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base" style={{ color: COLORS.textPrimary }}>{account.bankName}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold tracking-wider uppercase opacity-80" style={{ color: isCreditCard ? COLORS.purple : COLORS.skyBlue }}>
                            {account.accountType}
                          </span>
                          {account.branch && (
                            <span className="text-[10px] font-semibold opacity-60 flex items-center gap-0.5" style={{ color: COLORS.textSecondary }}>
                              • 📍 {account.branch}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/5 uppercase" style={{ color: COLORS.textSecondary }}>
                      {account.currency}
                    </span>
                  </div>

                  {/* Account Balance Details */}
                  <div className="mt-4">
                    {isCreditCard ? (
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-semibold">
                          <span style={{ color: COLORS.textSecondary }}>Total Limit:</span>
                          <span style={{ color: COLORS.textPrimary }}>{formatCurrencyLocal(account.limit, account.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: COLORS.textSecondary }}>Remaining Limit:</span>
                          <span style={{ color: COLORS.green }}>{formatCurrencyLocal(account.remainingLimit, account.currency)}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-1.5">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${remainingPercent}%`, 
                              backgroundColor: remainingPercent > 50 ? COLORS.green : remainingPercent > 20 ? COLORS.orange : COLORS.red 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-gray-500">
                          <span>{Math.round(usedPercent)}% Used</span>
                          <span>{Math.round(remainingPercent)}% Available</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Current Balance</span>
                          <div className="text-xl font-bold tracking-tight" style={{ color: COLORS.skyBlue }}>
                            {formatCurrencyLocal(account.balance, account.currency)}
                          </div>
                        </div>

                        {/* Multi-Account Number Breakdown */}
                        {account.accountNumbers && account.accountNumbers.length > 0 && (
                          <div className="mt-3 space-y-1 pt-2.5 border-t border-white/5">
                            {account.accountNumbers.map((accNo, idx) => {
                              if (!accNo && (!account.balances || account.balances[idx] === 0)) return null;
                              return (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span style={{ color: COLORS.textSecondary }} className="opacity-80">Acc: {accNo || `Account ${idx + 1}`}</span>
                                  <span style={{ color: COLORS.textPrimary }} className="font-semibold">
                                    {formatCurrencyLocal(account.balances ? account.balances[idx] : 0, account.currency)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}>
                  <button 
                    onClick={() => handleEditBankAccount(account)}
                    className="p-1.5 rounded hover:bg-white/5 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                    style={{ color: COLORS.skyBlue }}
                    title="Edit Bank Details"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteBankAccount(account.id)}
                    className="p-1.5 rounded hover:bg-white/5 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                    style={{ color: COLORS.red }}
                    title="Delete Bank Account"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
