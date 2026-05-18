import React from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

const DEFAULT_SRI_LANKA_BANKS = [
  'Commercial Bank', 'Sampath Bank Premium', 'HNB', 'BOC', 'People\'s Bank', 'NDB', 'DFCC'
];

const DEFAULT_UAE_BANKS = [
  'ADIB', 'ENBD', 'ADCB', 'Mashreq Bank', 'FAB', 'HSBC UAE', 'CBD'
];

const DEFAULT_SRI_LANKA_BRANCHES = [
  'Colombo', 'Kandy', 'Galle', 'Negombo', 'Kurunegala', 'Gampaha', 'Jaffna'
];

const DEFAULT_UAE_BRANCHES = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'RAK', 'Al Ain'
];

export const BankModal = ({
  isBankModalOpen,
  setIsBankModalOpen,
  editingBankAccountId,
  setEditingBankAccountId,
  handleSaveBankAccount,
  bankFormCountry,
  setBankFormCountry,
  bankFormName,
  setBankFormName,
  bankFormType,
  setBankFormType,
  bankFormCurrency,
  setBankFormCurrency,
  bankFormBranch,
  setBankFormBranch,
  bankFormLimit,
  setBankFormLimit,
  bankFormRemainingLimit,
  setBankFormRemainingLimit,
  bankFormAccountNumbers,
  setBankFormAccountNumbers,
  bankFormBalances,
  setBankFormBalances,
  showAddCustomBank,
  setShowAddCustomBank,
  showAddCustomType,
  setShowAddCustomType,
  showAddCustomBranch,
  setShowAddCustomBranch,
  newCustomBankName,
  setNewCustomBankName,
  newCustomTypeName,
  setNewCustomTypeName,
  newCustomBranchName,
  setNewCustomBranchName,
  customBanks,
  setCustomBanks,
  customAccountTypes,
  setCustomAccountTypes,
  customBranches,
  setCustomBranches,
  currencies,
  SRI_LANKA_BANKS = DEFAULT_SRI_LANKA_BANKS,
  UAE_BANKS = DEFAULT_UAE_BANKS,
  SRI_LANKA_BRANCHES = DEFAULT_SRI_LANKA_BRANCHES,
  UAE_BRANCHES = DEFAULT_UAE_BRANCHES
}) => {
  if (!isBankModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600 flex-shrink-0">
          <button 
            onClick={() => {
              setIsBankModalOpen(false);
              setEditingBankAccountId(null);
              setBankFormCountry('Sri Lanka');
              setBankFormName('');
              setBankFormType('Savings');
              setBankFormCurrency('LKR');
              setBankFormBranch('');
              setBankFormLimit('');
              setBankFormRemainingLimit('');
              setBankFormAccountNumbers(['']);
              setBankFormBalances(['']);
              
              setShowAddCustomBank(false);
              setShowAddCustomType(false);
              setShowAddCustomBranch(false);
            }} 
            className="hover:opacity-80 transition-opacity"
          >
            <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
          </button>
          <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>
            {editingBankAccountId ? 'Edit Bank details' : 'Add New Bank'}
          </h2>
          <button onClick={handleSaveBankAccount} className="hover:opacity-80 transition-opacity">
            <Save className="w-7 h-7 text-[#4FD1F5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
          {/* 1. Country Selection */}
          <div className="flex items-center gap-4">
            <label className="w-28 text-sm font-bold text-gray-700">Country</label>
            <select 
              value={bankFormCountry}
              onChange={(e) => {
                setBankFormCountry(e.target.value);
                setBankFormName('');
                setBankFormBranch('');
              }}
              className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium cursor-pointer"
            >
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="United Arab Emirates (UAE)">United Arab Emirates (UAE)</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 2. Bank Name Dropdown + Add custom */}
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <label className="w-28 text-sm font-bold text-gray-700">Bank name</label>
              <div className="flex-1 flex gap-2 items-center">
                <select 
                  value={bankFormName}
                  onChange={(e) => {
                    setBankFormName(e.target.value);
                    setBankFormBranch(''); // reset branch when bank changes
                  }}
                  className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium cursor-pointer"
                >
                  <option value="">-- Select Bank --</option>
                  {/* Standard country specific banks */}
                  {bankFormCountry === 'Sri Lanka' && SRI_LANKA_BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  {bankFormCountry === 'United Arab Emirates (UAE)' && UAE_BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  
                  {/* Custom user added banks */}
                  {customBanks.map(b => (
                    <option key={b} value={b}>{b} (Custom)</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowAddCustomBank(!showAddCustomBank)}
                  className="p-2 rounded bg-white hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
                  title="Add Custom Bank"
                >
                  <Plus className="w-4 h-4 text-[#374151]" />
                </button>
              </div>
            </div>

            {/* Inline custom bank entry */}
            {showAddCustomBank && (
              <div className="p-3 bg-white/70 rounded-lg border border-gray-300 flex items-center gap-2 animate-fadeIn ml-32">
                <input 
                  type="text" 
                  value={newCustomBankName}
                  onChange={(e) => setNewCustomBankName(e.target.value)}
                  placeholder="Custom Bank Name"
                  className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none text-gray-700 font-medium"
                />
                <button 
                  onClick={() => {
                    if (newCustomBankName.trim()) {
                      setCustomBanks([...customBanks, newCustomBankName.trim()]);
                      setBankFormName(newCustomBankName.trim());
                      setNewCustomBankName('');
                      setShowAddCustomBank(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#374151] text-white text-xs font-bold rounded hover:opacity-90 cursor-pointer"
                >
                  Add
                </button>
                <button 
                  onClick={() => setShowAddCustomBank(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* 3. Account Type Dropdown + Add custom */}
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <label className="w-28 text-sm font-bold text-gray-700">Account Type</label>
              <div className="flex-1 flex gap-2 items-center">
                <select 
                  value={bankFormType}
                  onChange={(e) => {
                    setBankFormType(e.target.value);
                  }}
                  className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium cursor-pointer"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                  <option value="Credit Card">Credit Card</option>
                  {customAccountTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowAddCustomType(!showAddCustomType)}
                  className="p-2 rounded bg-white hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
                  title="Add Custom Account Type"
                >
                  <Plus className="w-4 h-4 text-[#374151]" />
                </button>
              </div>
            </div>

            {/* Inline custom account type entry */}
            {showAddCustomType && (
              <div className="p-3 bg-white/70 rounded-lg border border-gray-300 flex items-center gap-2 animate-fadeIn ml-32">
                <input 
                  type="text" 
                  value={newCustomTypeName}
                  onChange={(e) => setNewCustomTypeName(e.target.value)}
                  placeholder="e.g. Fixed Deposit, Investment"
                  className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none text-gray-700 font-medium"
                />
                <button 
                  onClick={() => {
                    if (newCustomTypeName.trim()) {
                      setCustomAccountTypes([...customAccountTypes, newCustomTypeName.trim()]);
                      setBankFormType(newCustomTypeName.trim());
                      setNewCustomTypeName('');
                      setShowAddCustomType(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#374151] text-white text-xs font-bold rounded hover:opacity-90 cursor-pointer"
                >
                  Add
                </button>
                <button 
                  onClick={() => setShowAddCustomType(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* 4. Currency Dropdown */}
          <div className="flex items-center gap-4">
            <label className="w-28 text-sm font-bold text-gray-700">Currency</label>
            <div className="flex-1">
              <select 
                value={bankFormCurrency}
                onChange={(e) => setBankFormCurrency(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Branch Selection + Add custom */}
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <label className="w-28 text-sm font-bold text-gray-700">Branch</label>
              <div className="flex-1 flex gap-2 items-center">
                <select 
                  value={bankFormBranch}
                  onChange={(e) => setBankFormBranch(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm text-sm focus:outline-none text-gray-700 font-medium cursor-pointer"
                >
                  <option value="">-- Select Branch --</option>
                  {/* Standard branches based on selected Country */}
                  {bankFormCountry === 'Sri Lanka' && SRI_LANKA_BRANCHES.map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                  {bankFormCountry === 'United Arab Emirates (UAE)' && UAE_BRANCHES.map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                  
                  {/* Custom user added branches */}
                  {customBranches.map(br => (
                    <option key={br} value={br}>{br} (Custom)</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowAddCustomBranch(!showAddCustomBranch)}
                  className="p-2 rounded bg-white hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
                  title="Add Custom Branch"
                >
                  <Plus className="w-4 h-4 text-[#374151]" />
                </button>
              </div>
            </div>

            {/* Inline custom branch entry */}
            {showAddCustomBranch && (
              <div className="p-3 bg-white/70 rounded-lg border border-gray-300 flex items-center gap-2 animate-fadeIn ml-32">
                <input 
                  type="text" 
                  value={newCustomBranchName}
                  onChange={(e) => setNewCustomBranchName(e.target.value)}
                  placeholder="Custom Branch Name"
                  className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none text-gray-700 font-medium"
                />
                <button 
                  onClick={() => {
                    if (newCustomBranchName.trim()) {
                      setCustomBranches([...customBranches, newCustomBranchName.trim()]);
                      setBankFormBranch(newCustomBranchName.trim());
                      setNewCustomBranchName('');
                      setShowAddCustomBranch(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#374151] text-white text-xs font-bold rounded hover:opacity-90 cursor-pointer"
                >
                  Add
                </button>
                <button 
                  onClick={() => setShowAddCustomBranch(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* 6. Dynamic Account number list / Balance list */}
          {bankFormType === 'Credit Card' ? (
            /* Credit Card Limit Details */
            <div className="space-y-4 border-t border-gray-300 pt-4">
              <h4 className="text-xs font-bold text-purple-700 tracking-wide uppercase">Credit Card Limit Settings</h4>
              <div className="flex items-center gap-4">
                <label className="w-28 text-sm font-bold text-gray-700">Total Limit</label>
                <div className="flex-1 flex items-center bg-white border border-gray-300 rounded px-3 py-1.5 shadow-sm">
                  <input 
                    type="number" 
                    value={bankFormLimit}
                    onChange={(e) => setBankFormLimit(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent focus:outline-none text-sm text-gray-700 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-28 text-sm font-bold text-gray-700">Remaining Limit</label>
                <div className="flex-1 flex items-center bg-white border border-gray-300 rounded px-3 py-1.5 shadow-sm">
                  <input 
                    type="number" 
                    value={bankFormRemainingLimit}
                    onChange={(e) => setBankFormRemainingLimit(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent focus:outline-none text-sm text-gray-700 font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Savings / Current account types */
            <div className="space-y-4 border-t border-gray-300 pt-4">
              <div className="bg-gray-150 p-4 rounded-xl border border-gray-300 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-700 tracking-wide uppercase">Account Numbers & Balances</h4>
                  <span className="text-[10px] bg-[#374151] text-white px-2 py-0.5 rounded font-bold">
                    {bankFormType.toUpperCase()}
                  </span>
                </div>

                {bankFormAccountNumbers.map((accNo, index) => (
                  <div key={index} className="space-y-2 border-b border-gray-300 pb-3 last:border-b-0 last:pb-0">
                    {/* Account Number input */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-6">#{index + 1}</span>
                      <div className="flex-1 flex items-center bg-white border border-gray-300 rounded px-2.5 py-1.5 shadow-sm">
                        <input 
                          type="text" 
                          value={accNo}
                          onChange={(e) => {
                            const updated = [...bankFormAccountNumbers];
                            updated[index] = e.target.value;
                            setBankFormAccountNumbers(updated);
                          }}
                          placeholder="Account Number (optional)"
                          className="w-full bg-transparent focus:outline-none text-xs text-gray-700 font-medium"
                        />
                      </div>
                      {bankFormAccountNumbers.length > 1 && (
                        <button 
                          onClick={() => {
                            const updatedAccs = [...bankFormAccountNumbers];
                            const updatedBals = [...bankFormBalances];
                            updatedAccs.splice(index, 1);
                            updatedBals.splice(index, 1);
                            setBankFormAccountNumbers(updatedAccs);
                            setBankFormBalances(updatedBals);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Remove Account Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Corresponding Balance input */}
                    <div className="flex items-center gap-3 pl-9">
                      <label className="text-xs font-bold text-gray-600 w-16">Balance</label>
                      <div className="flex-1 flex items-center bg-white border border-gray-300 rounded px-2.5 py-1.5 shadow-sm">
                        <input 
                          type="number" 
                          value={bankFormBalances[index] || ''}
                          onChange={(e) => {
                            const updated = [...bankFormBalances];
                            updated[index] = e.target.value;
                            setBankFormBalances(updated);
                          }}
                          placeholder="0.00"
                          className="w-full bg-transparent focus:outline-none text-xs text-gray-700 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Button to add another account number field */}
                <button 
                  type="button"
                  onClick={() => {
                    setBankFormAccountNumbers([...bankFormAccountNumbers, '']);
                    setBankFormBalances([...bankFormBalances, '']);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-400 text-xs font-bold text-gray-700 hover:bg-white transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Account Number & Balance (Optional)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
