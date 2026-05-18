import React from 'react';
import { X, Check, Plus, MinusCircle } from 'lucide-react';

const DEFAULT_ALL_CURRENCIES = [
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' }
];

export const CurrencyManagerModal = ({
  isCurrencyManagerOpen,
  setIsCurrencyManagerOpen,
  selectedCurrencyToAdd,
  setSelectedCurrencyToAdd,
  currencies,
  setCurrencies,
  formCurrency,
  setFormCurrency,
  ALL_CURRENCIES = DEFAULT_ALL_CURRENCIES
}) => {
  if (!isCurrencyManagerOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937] text-left">
        {/* Modal Header */}
        <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
          <button onClick={() => setIsCurrencyManagerOpen(false)} className="hover:opacity-80 transition-opacity">
            <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
          </button>
          <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>Currency List</h2>
          <button 
            onClick={() => setIsCurrencyManagerOpen(false)} 
            className="hover:opacity-80 transition-opacity"
          >
            <Check className="w-7 h-7 text-[#4FD1F5] bg-gray-600 rounded-full p-1" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Select & Add Currency Row */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">Select Currency</label>
            <div className="flex gap-2">
              <select
                value={selectedCurrencyToAdd}
                onChange={(e) => setSelectedCurrencyToAdd(e.target.value)}
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium"
              >
                {ALL_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const existing = currencies.find(c => c.code === selectedCurrencyToAdd);
                  if (existing) {
                    alert("Currency is already in your active list!");
                    return;
                  }
                  const cObj = ALL_CURRENCIES.find(c => c.code === selectedCurrencyToAdd);
                  if (cObj) {
                    const updated = [...currencies, { ...cObj, isDefault: false }];
                    setCurrencies(updated);
                    localStorage.setItem('budget_currencies', JSON.stringify(updated));
                  }
                }}
                className="px-4 py-2 text-sm font-bold text-white rounded transition-opacity hover:opacity-90 flex items-center gap-1 shrink-0 cursor-pointer"
                style={{ backgroundColor: '#0284C7' }}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Active Currencies List */}
          <div className="border border-gray-300 rounded bg-white overflow-hidden shadow-sm">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Active Currencies
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-200">
              {currencies.map(c => (
                <div key={c.code} className="px-3 py-3 flex items-center justify-between text-sm hover:bg-gray-50">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-700">{c.code}</span>
                    <span className="text-xs text-gray-400 font-medium">{c.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {c.isDefault ? (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 uppercase">
                        Default
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const updated = currencies.map(curr => ({
                              ...curr,
                              isDefault: curr.code === c.code
                            }));
                            setCurrencies(updated);
                            localStorage.setItem('budget_currencies', JSON.stringify(updated));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                        >
                          Make Default
                        </button>
                        <button
                          onClick={() => {
                            const activeNonDefaults = currencies.filter(curr => !curr.isDefault);
                            if (currencies.length <= 1) {
                              alert("Cannot delete the only currency!");
                              return;
                            }
                            const updated = currencies.filter(curr => curr.code !== c.code);
                            setCurrencies(updated);
                            localStorage.setItem('budget_currencies', JSON.stringify(updated));
                            if (formCurrency === c.code) {
                              setFormCurrency(updated[0].code);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          title="Remove Currency"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
