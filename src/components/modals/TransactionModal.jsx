import React from 'react';
import { X, Save, Plus, Settings, Paperclip, Calendar } from 'lucide-react';

export const TransactionModal = ({
  isAddExpenseOpen,
  setIsAddExpenseOpen,
  formType,
  editingExpenseId,
  setEditingExpenseId,
  handleSaveExpense,
  formDate,
  setFormDate,
  formCategory,
  setFormCategory,
  INCOME_CATEGORIES,
  categories,
  formSubcategory,
  setFormSubcategory,
  setIsCategoriesManagerOpen,
  handleOpenSubCategoriesManager,
  formAmount,
  setFormAmount,
  formCurrency,
  setFormCurrency,
  currencies,
  setIsCurrencyManagerOpen,
  formPayFrom,
  setFormPayFrom,
  formBankName,
  setFormBankName,
  formSelectedAccountDetails,
  setFormSelectedAccountDetails,
  computedBankAccounts,
  formNotes,
  setFormNotes
}) => {
  if (!isAddExpenseOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937]">
        {/* Modal Header */}
        <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
          <button 
            onClick={() => {
              setIsAddExpenseOpen(false);
              setEditingExpenseId(null);
              setFormAmount('');
              setFormNotes('');
            }} 
            className="hover:opacity-80 transition-opacity"
          >
            <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
          </button>
          <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>
            {formType === 'income' 
              ? (editingExpenseId ? 'Edit Income' : 'Add Income') 
              : (editingExpenseId ? 'Edit Expense' : 'Add Expense')}
          </h2>
          <button onClick={handleSaveExpense} className="hover:opacity-80 transition-opacity">
            <Save className="w-7 h-7 text-[#4FD1F5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Date */}
          <div className="flex items-center gap-4">
            <label className="w-24 text-sm font-bold text-gray-700">Date</label>
            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded px-3 py-1.5 shadow-sm">
              <input 
                type="date" 
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-sm text-gray-700 font-medium"
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-4">
            <label className="w-24 text-sm font-bold text-gray-700">Category</label>
            <div className="flex-1 flex items-center gap-2">
              <select 
                value={formCategory}
                onChange={(e) => {
                  const selectedCatName = e.target.value;
                  setFormCategory(selectedCatName);
                  const activeList = formType === 'income' ? INCOME_CATEGORIES : categories;
                  const catObj = activeList.find(c => c.name === selectedCatName);
                  if (catObj && catObj.subCategories && catObj.subCategories.length > 0) {
                    setFormSubcategory(catObj.subCategories[0].name);
                  } else {
                    setFormSubcategory('General');
                  }
                }}
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700"
              >
                {(formType === 'income' ? INCOME_CATEGORIES : categories).map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {formType !== 'income' && (
                <button 
                  type="button"
                  onClick={() => setIsCategoriesManagerOpen(true)}
                  className="p-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors text-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Subcategory */}
          <div className="flex items-center gap-4">
            <label className="w-24 text-sm font-bold text-gray-700">Subcategory</label>
            <div className="flex-1 flex items-center gap-2">
              <select 
                value={formSubcategory}
                onChange={(e) => setFormSubcategory(e.target.value)}
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700"
              >
                {(formType === 'income' ? INCOME_CATEGORIES : categories).find(c => c.name === formCategory)?.subCategories?.map(sub => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                )) || <option value="General">General</option>}
              </select>
              {formType !== 'income' && (
                <button 
                  type="button"
                  onClick={() => {
                    const catObj = categories.find(c => c.name === formCategory);
                    if (catObj) {
                      handleOpenSubCategoriesManager(catObj);
                    }
                  }}
                  className="p-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors text-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-4">
            <label className="w-24 text-sm font-bold text-gray-700">Amount</label>
            <div className="flex-1 flex items-center gap-2">
              <input 
                type="number" 
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700"
              />
              <div className="flex items-center gap-1">
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-2 shadow-sm text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCurrencyManagerOpen(true)}
                  className="p-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors text-gray-700 animate-pulse"
                  title="Manage Currencies"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>


          {/* Pay from / Received in */}
          <div className="flex items-center gap-4">
            <label className="w-24 text-sm font-bold text-gray-700">{formType === 'income' ? 'Received in' : 'Pay from'}</label>
            <div className="flex-1 flex items-center gap-2">
              <select 
                value={formPayFrom}
                onChange={(e) => {
                  setFormPayFrom(e.target.value);
                  if (e.target.value !== 'Bank Account' && e.target.value !== 'Credit Card') {
                    setFormBankName('');
                    setFormSelectedAccountDetails('');
                  }
                }}
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700"
              >
                <option value="">-- Optional --</option>
                <option value="Bank Account">Bank Account</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Bank Details selection logic (exact rules) */}
          {(formPayFrom === 'Bank Account' || formPayFrom === 'Credit Card') && (() => {
            let baseAccounts = computedBankAccounts.filter(acc => {
              if (formPayFrom === 'Credit Card') {
                return acc.accountType === 'Credit Card';
              } else {
                return acc.accountType !== 'Credit Card';
              }
            });

            const currencyFiltered = baseAccounts.filter(acc => {
              if (formCurrency === 'LKR') {
                return acc.currency === 'LKR' || acc.country === 'Sri Lanka';
              }
              if (formCurrency === 'AED') {
                return acc.currency === 'AED' || acc.country === 'United Arab Emirates (UAE)';
              }
              return acc.currency === formCurrency;
            });

            const finalAccounts = currencyFiltered.length > 0 ? currencyFiltered : baseAccounts;
            const uniqueBankNames = Array.from(new Set(finalAccounts.map(acc => acc.bankName)));
            const matchingDetails = finalAccounts.filter(acc => acc.bankName === formBankName);

            return (
              <>
                {/* Bank Name Dropdown */}
                <div className="flex items-center gap-4 animate-fade-in">
                  <label className="w-24 text-sm font-bold text-gray-700">Bank Name</label>
                  <div className="flex-1">
                    <select
                      value={formBankName}
                      onChange={(e) => {
                        setFormBankName(e.target.value);
                        const matches = finalAccounts.filter(acc => acc.bankName === e.target.value);
                        if (matches.length === 1) {
                          const acc = matches[0];
                          let detailLabel = acc.accountType;
                          if (acc.branch) detailLabel += ` - ${acc.branch}`;
                          if (acc.accountType !== 'Credit Card' && acc.accountNumbers && acc.accountNumbers.length > 0 && acc.accountNumbers[0]) {
                            detailLabel += ` - Acc: ${acc.accountNumbers[0]}`;
                          }
                          setFormSelectedAccountDetails(detailLabel);
                        } else {
                          setFormSelectedAccountDetails('');
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium"
                    >
                      <option value="">-- Select Bank --</option>
                      {uniqueBankNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account Type / Card Details Dropdown */}
                {formBankName && matchingDetails.length > 0 && (
                  <div className="flex items-center gap-4 animate-fade-in">
                    <label className="w-24 text-sm font-bold text-gray-700">
                      {formPayFrom === 'Credit Card' ? 'Card Details' : 'Account Type'}
                    </label>
                    <div className="flex-1">
                      <select
                        value={formSelectedAccountDetails}
                        onChange={(e) => setFormSelectedAccountDetails(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium"
                      >
                        <option value="">-- Select Details --</option>
                        {matchingDetails.flatMap(acc => {
                          if (acc.accountType !== 'Credit Card' && acc.accountNumbers && acc.accountNumbers.length > 0) {
                            const validAccs = acc.accountNumbers.filter(no => no && no.trim());
                            if (validAccs.length > 0) {
                              return validAccs.map((accNo, idx) => {
                                let detailVal = acc.accountType;
                                if (acc.branch) detailVal += ` - ${acc.branch}`;
                                detailVal += ` - Acc: ${accNo}`;

                                let optionLabel = acc.accountType;
                                if (acc.branch) optionLabel += ` (${acc.branch})`;
                                optionLabel += ` - Acc: ${accNo}`;
                                
                                return (
                                  <option key={`${acc.id}-${idx}`} value={detailVal}>
                                    {optionLabel}
                                  </option>
                                );
                              });
                            }
                          }

                          let detailVal = acc.accountType;
                          if (acc.branch) detailVal += ` - ${acc.branch}`;

                          let optionLabel = acc.accountType;
                          if (acc.branch) optionLabel += ` (${acc.branch})`;
                          if (acc.accountType === 'Credit Card' && acc.limit) {
                            optionLabel += ` (Limit: ${acc.limit.toLocaleString()} ${acc.currency})`;
                          }

                          return (
                            <option key={acc.id} value={detailVal}>
                              {optionLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Notes */}
          <div className="flex items-start gap-4">
            <label className="w-24 text-sm font-bold text-gray-700 pt-2">Notes</label>
            <textarea 
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows="3"
              className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none resize-none text-gray-700"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-200 px-6 py-4 flex items-center justify-between border-t border-gray-300">
          <button className="hover:opacity-80 transition-opacity text-gray-600">
            <Paperclip className="w-7 h-7" />
          </button>
          <button className="hover:opacity-80 transition-opacity text-gray-600">
            <Calendar className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
