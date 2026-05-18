// ================================================================
// Dashboard.jsx — Main Application Shell
// ================================================================
//
// ARCHITECTURE OVERVIEW
// ─────────────────────
// This is the single-page React application for the Budget Master
// personal finance tracker. All views (Dashboard, Expenses, Income,
// Accounts, etc.) are rendered inside this one component.
//
// FILE STRUCTURE (inside this file)
// ──────────────────────────────────
//  1. IMPORTS           — React, Lucide icons, Recharts
//  2. THEME CONSTANTS   — Dark/light color palettes (THEMES object)
//  3. CURRENCY DATA     — All world currencies + exchange rates
//  4. BANK DATA         — Sri Lanka & UAE bank / branch name lists
//  5. CATEGORY DATA     — Expense & income categories with sub-categories
//  6. HELPER FUNCTIONS  — convertCurrency, formatCurrency, etc.
//  7. DASHBOARD COMPONENT
//     a. STATE VARIABLES   — All useState hooks grouped by feature
//     b. EFFECTS           — Data fetching, localStorage sync
//     c. EVENT HANDLERS    — CRUD for expenses, incomes, bank accounts
//     d. COMPUTED VALUES   — Derived totals, donut data, active currencies
//     e. RENDER HELPERS    — Sub-render functions for multi-currency displays
//     f. MAIN JSX RETURN   — Sidebar + main content area
//        i.  Sidebar
//        ii. Dashboard page
//        iii.Expenses page
//        iv. Income page
//        v.  Accounts (Bank Details) page
//        vi. Modals (Add Expense/Income, Bank, Currency Manager, etc.)
//
// RELATED EXTRACTED FILES (refactored constants & utils):
//   src/constants/themes.js      — THEMES object (dark/light palettes)
//   src/constants/currencies.js  — ALL_CURRENCIES + EXCHANGE_RATES
//   src/constants/banks.js       — SRI_LANKA_BANKS, UAE_BANKS, branches
//   src/constants/categories.js  — INCOME_CATEGORIES, AVAILABLE_ICONS
//   src/utils/currencyUtils.js   — convertCurrency, formatCurrency, etc.
//   src/utils/chartUtils.js      — buildDonutData, sumByCurrency, etc.
//   src/utils/dataSync.js        — syncExpenses, syncIncomes, fetchExpenses
//
// NOTE: The constants above are still inlined here for a single-file
//       build. To use the extracted files, replace the inline blocks
//       with import statements from the paths above.
// ================================================================

import React, { useState, useEffect } from 'react';
import { BudgetService } from '../models/BudgetService';
import userProfileImg from '../assets/user_profile.jpg';
import {
  // Layout & Navigation icons
  Menu, X, ChevronDown, ChevronRight,

  // Action icons
  Plus, Save, Paperclip, Check, Edit2, Trash2, MinusCircle, Settings,

  // Finance / Category icons
  Wallet, CreditCard, Landmark, CircleDollarSign, DollarSign, Coins,
  ShoppingCart, ShoppingBag, Home, Briefcase, Umbrella, Fuel, Star,

  // Trend icons
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,

  // UI / misc icons
  Bell, Search, LayoutDashboard, Calendar, Folder, Users, Presentation,
  Moon, Sun, HelpCircle, Activity, Battery,

  // Category picker icons
  Lightbulb, Music, Gift, GraduationCap, Bike, Phone, Globe, Lock,
  Monitor, Mail, Wrench, Scissors, Shirt, Dumbbell, Tv, Heart,
  Compass, Coffee, BedDouble, BookOpen, Car, Utensils,
} from 'lucide-react';

// Recharts — used for the Donut / Pie charts on all pages
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Modular Layouts, Views, and Modals
import { Sidebar } from './layout/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ExpensesView } from './views/ExpensesView';
import { IncomeView } from './views/IncomeView';
import { AccountsView } from './views/AccountsView';
import { TransactionModal } from './modals/TransactionModal';
import { BankModal } from './modals/BankModal';
import { CurrencyManagerModal } from './modals/CurrencyManagerModal';
import { CategoryManagerModal } from './modals/CategoryManagerModal';

// ================================================================
// §2. EXTERNAL CONSTANTS & UTILITIES
// ================================================================
import { THEMES } from '../constants/themes';
import { ALL_CURRENCIES, EXCHANGE_RATES } from '../constants/currencies';
import { SRI_LANKA_BANKS, UAE_BANKS, SRI_LANKA_BRANCHES, UAE_BRANCHES } from '../constants/banks';
import { INCOME_CATEGORIES, AVAILABLE_ICONS, ALL_MONTHS } from '../constants/categories';
import { convertCurrency } from '../utils/currencyUtils';





// ================================================================
// §7. DASHBOARD COMPONENT
// ================================================================
// The main React component that powers the entire app.
// All pages are rendered as conditional blocks inside this component.
// ================================================================
const Dashboard = () => {
  // ── Date/Period helpers ────────────────────────────────────────
  const currentYearStr  = new Date().getFullYear().toString();
  const currentMonthStr = ALL_MONTHS[new Date().getMonth()];

  // ── §7a: STATE VARIABLES ─────────────────────────────────────

  // UI State — sidebar toggle, active page, dark/light mode
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu,  setActiveMenu]  = useState('Dashboard');
  const [isDarkMode,  setIsDarkMode]  = useState(true);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUsername === 'lahirut85' && loginPassword === 'Sheran@2591277') {
      sessionStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setProfileDropdownOpen(false);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  // Date/Period selectors — used to filter expenses & incomes by month/year
  const [years,         setYears]         = useState([currentYearStr]);
  const [selectedYear,  setSelectedYear]  = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Expenses — raw list + which one is being edited (null = adding new)
  const [expenses,         setExpenses]         = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Incomes list + whether the current modal is for 'expense' or 'income'
  const [incomes,   setIncomes]   = useState([]);
  const [formType,  setFormType]  = useState('expense'); // 'expense' | 'income'

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/expenses');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const hydrated = data.map(exp => ({
              ...exp,
              icon: getIconForCategory(exp.category)
            }));
            setExpenses(hydrated);
            localStorage.setItem('budget_expenses', JSON.stringify(hydrated));

            const uniqueYears = Array.from(new Set(hydrated.map(exp => exp.date?.split('-')[0]).filter(Boolean)));
            const currentYear = new Date().getFullYear().toString();
            if (!uniqueYears.includes(currentYear)) uniqueYears.push(currentYear);
            setYears(uniqueYears.sort((a, b) => b - a));
          }
        } else {
          const cached = localStorage.getItem('budget_expenses');
          if (cached) setExpenses(JSON.parse(cached));
        }
      } catch (err) {
        console.warn('API unavailable, falling back to LocalStorage cache:', err);
        const cached = localStorage.getItem('budget_expenses');
        if (cached) setExpenses(JSON.parse(cached));
      }
    };

    const fetchIncomes = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/incomes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const hydrated = data.map(inc => ({
              ...inc,
              icon: getIconForCategory(inc.category)
            }));
            setIncomes(hydrated);
            localStorage.setItem('budget_incomes', JSON.stringify(hydrated));
          }
        } else {
          const cached = localStorage.getItem('budget_incomes');
          if (cached) setIncomes(JSON.parse(cached));
        }
      } catch (err) {
        console.warn('API unavailable, falling back to LocalStorage cache:', err);
        const cached = localStorage.getItem('budget_incomes');
        if (cached) setIncomes(JSON.parse(cached));
      }
    };

    fetchExpenses();
    fetchIncomes();
  }, []);

  const syncExpensesToDatabase = async (updatedExpenses) => {
    localStorage.setItem('budget_expenses', JSON.stringify(updatedExpenses));
    try {
      await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: updatedExpenses })
      });
    } catch (err) {
      console.warn('Could not sync to Google Sheets, saved to local cache:', err);
    }
  };

  const syncIncomesToDatabase = async (updatedIncomes) => {
    localStorage.setItem('budget_incomes', JSON.stringify(updatedIncomes));
    try {
      await fetch('http://localhost:5000/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incomes: updatedIncomes })
      });
    } catch (err) {
      console.warn('Could not sync incomes to Google Sheets, saved to local cache:', err);
    }
  };

  // Add / Edit Expense+Income modal — open/close flag
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Transaction form field states (shared between expense AND income modals)
  const [formDate,     setFormDate]     = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('Home/Rent');
  const [formSubcategory, setFormSubcategory] = useState('Rent');
  const [formAmount,   setFormAmount]   = useState('');
  const [formPayee,    setFormPayee]    = useState('');

  // Payment source: 'Bank Account' | 'Credit Card' | 'Cash' | ''
  const [formPayFrom,  setFormPayFrom]  = useState('Bank Account');

  // Bank name selected from the filtered dropdown
  const [formBankName, setFormBankName] = useState('');

  // Secondary details (account type + branch) for the selected bank,
  // e.g. 'Savings - Colombo Main' or 'Credit Card - Dubai (Main)'
  const [formSelectedAccountDetails, setFormSelectedAccountDetails] = useState('');

  const [formNotes,    setFormNotes]    = useState('');
  const [formCurrency, setFormCurrency] = useState('AED');

  // Currency Manager modal — lets the user add/remove currencies
  const [isCurrencyManagerOpen,    setIsCurrencyManagerOpen]    = useState(false);
  const [selectedCurrencyToAdd,    setSelectedCurrencyToAdd]    = useState('USD');
  // Active currency list (persisted to localStorage)
  // Default includes AED as the primary currency
  const [currencies, setCurrencies] = useState(() => {
    const cached = localStorage.getItem('budget_currencies');
    return cached ? JSON.parse(cached) : [
      { code: 'USD', name: 'United States Dollar (USD)', symbol: '$' },
      { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
      { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
      { code: 'JPY', name: 'Japanese Yen (JPY)', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar (CAD)', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar (AUD)', symbol: 'A$' },
      { code: 'AED', name: 'Default', symbol: 'AED', isDefault: true }
    ];
  });

  // Bank Accounts — persisted to localStorage
  // Structure of each account:
  //   { id, bankName, accountType, currency, balance, limit, remainingLimit,
  //     branch, country, accountNumbers[] }
  const [bankAccounts, setBankAccounts] = useState(() => {
    const cached = localStorage.getItem('budget_bank_accounts');
    const baseList = cached ? JSON.parse(cached) : [
      { id: 'b1', bankName: 'BOC', accountType: 'Savings', currency: 'LKR', balance: 250000, accountNumbers: ['1204-5678-9012'], balances: [250000] },
      { id: 'b2', bankName: 'Commercial Bank', accountType: 'Credit Card', currency: 'AED', limit: 10000, remainingLimit: 7500 },
      { id: 'b3', bankName: 'Sampath Bank', accountType: 'Savings', currency: 'LKR', balance: 120000, accountNumbers: ['9081-2345-6789'], balances: [120000] }
    ];
    return baseList.map(b => {
      if (b.accountType !== 'Credit Card') {
        const hasNumbers = Array.isArray(b.accountNumbers) && b.accountNumbers.length > 0 && b.accountNumbers[0];
        const hasBalances = Array.isArray(b.balances) && b.balances.length > 0;
        return {
          ...b,
          accountNumbers: hasNumbers ? b.accountNumbers : [b.id === 'b1' ? '1204-5678-9012' : (b.id === 'b3' ? '9081-2345-6789' : '9999-8888-7777')],
          balances: hasBalances ? b.balances : [b.balance || 0]
        };
      }
      return b;
    });
  });

  // Persist bank accounts whenever the list changes
  useEffect(() => {
    localStorage.setItem('budget_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  // Bank Account MODAL state — open/close + which record is being edited
  const [isBankModalOpen,      setIsBankModalOpen]      = useState(false);
  const [editingBankAccountId, setEditingBankAccountId] = useState(null);
  const [bankFormName,         setBankFormName]         = useState('');
  const [bankFormType,         setBankFormType]         = useState('Savings');
  const [bankFormCurrency,     setBankFormCurrency]     = useState('LKR');
  const [bankFormBalance,      setBankFormBalance]      = useState('');
  const [bankFormLimit,        setBankFormLimit]        = useState('');
  const [bankFormRemainingLimit, setBankFormRemainingLimit] = useState('');

  const [bankFormCountry, setBankFormCountry] = useState('Sri Lanka');
  const [bankFormBranch, setBankFormBranch] = useState('');
  
  // Custom user-added items for the bank modal dropdowns
  // These are saved to localStorage so they persist across sessions
  const [customBanks, setCustomBanks] = useState(() => {
    const cached = localStorage.getItem('budget_custom_banks');
    return cached ? JSON.parse(cached) : [];
  });
  useEffect(() => {
    localStorage.setItem('budget_custom_banks', JSON.stringify(customBanks));
  }, [customBanks]);

  const [customAccountTypes, setCustomAccountTypes] = useState(() => {
    const cached = localStorage.getItem('budget_custom_account_types');
    return cached ? JSON.parse(cached) : [];
  });
  useEffect(() => {
    localStorage.setItem('budget_custom_account_types', JSON.stringify(customAccountTypes));
  }, [customAccountTypes]);

  const [customBranches, setCustomBranches] = useState(() => {
    const cached = localStorage.getItem('budget_custom_branches');
    return cached ? JSON.parse(cached) : [];
  });
  useEffect(() => {
    localStorage.setItem('budget_custom_branches', JSON.stringify(customBranches));
  }, [customBranches]);

  // Inline "Add custom" input visibility toggles + their text values
  const [showAddCustomBank,   setShowAddCustomBank]   = useState(false);
  const [newCustomBankName,   setNewCustomBankName]   = useState('');
  const [showAddCustomType,   setShowAddCustomType]   = useState(false);
  const [newCustomTypeName,   setNewCustomTypeName]   = useState('');
  const [showAddCustomBranch, setShowAddCustomBranch] = useState(false);
  const [newCustomBranchName, setNewCustomBranchName] = useState('');

  // Multi-account rows for Savings/Current bank accounts:
  // Each array index corresponds to one account number + its balance.
  // e.g. accountNumbers[0]='111-222' + balances[0]='50000'
  const [bankFormAccountNumbers, setBankFormAccountNumbers] = useState(['']);
  const [bankFormBalances,       setBankFormBalances]       = useState(['']);

  // Category manager state — for the modal that lets users add/edit/delete categories
  const [isCategoriesManagerOpen, setIsCategoriesManagerOpen] = useState(false);
  const [isAddCategoryOpen,       setIsAddCategoryOpen]       = useState(false);
  const [newCategoryName,         setNewCategoryName]         = useState('');
  const [newCategoryIcon,         setNewCategoryIcon]         = useState(Star);
  const [isEditCategoryOpen,      setIsEditCategoryOpen]      = useState(false);
  const [editingCategory,         setEditingCategory]         = useState(null);
  const [editCategoryName,        setEditCategoryName]        = useState('');
  const [editCategoryIcon,        setEditCategoryIcon]        = useState(Star);

  // Sub-category manager state — nested under a parent category
  const [isSubCategoriesManagerOpen, setIsSubCategoriesManagerOpen] = useState(false);
  const [activeParentCategory,       setActiveParentCategory]       = useState(null);
  const [isAddSubCategoryOpen,       setIsAddSubCategoryOpen]       = useState(false);
  const [newSubCategoryName,         setNewSubCategoryName]         = useState('');
  const [newSubCategoryIcon,         setNewSubCategoryIcon]         = useState(Star);
  const [isEditSubCategoryOpen,      setIsEditSubCategoryOpen]      = useState(false);
  const [editingSubCategory,         setEditingSubCategory]         = useState(null);
  const [editSubCategoryName,        setEditSubCategoryName]        = useState('');
  const [editSubCategoryIcon,        setEditSubCategoryIcon]        = useState(Star);

  // Expense categories — user can add/edit/delete these at runtime
  // (Income categories are static INCOME_CATEGORIES constant above)
  const [categories, setCategories] = useState([
    { id: '1', name: 'Home/Rent', icon: Home, subCategories: [
      { id: 's1', name: 'Mortgage', icon: Home },
      { id: 's2', name: 'Mortgage-2nd', icon: Home },
      { id: 's3', name: 'Rent', icon: Home },
      { id: 's4', name: 'Association fee', icon: Home },
      { id: 's5', name: 'Property tax', icon: Home }
    ]},
    { id: '2', name: 'Utilities', icon: Lightbulb, subCategories: [
      { id: 's6', name: 'Electricity', icon: Lightbulb },
      { id: 's7', name: 'Water', icon: Lightbulb },
      { id: 's8', name: 'Gas', icon: Lightbulb },
      { id: 's9', name: 'Internet', icon: Lightbulb }
    ]},
    { id: '3', name: 'Food/Groceries', icon: ShoppingCart, subCategories: [
      { id: 's10', name: 'Groceries', icon: ShoppingCart },
      { id: 's11', name: 'Restaurant', icon: ShoppingCart },
      { id: 's12', name: 'Snacks', icon: ShoppingCart }
    ]},
    { id: '4', name: 'Departmental', icon: ShoppingBag, subCategories: [
      { id: 's13', name: 'Clothing', icon: ShoppingBag },
      { id: 's14', name: 'Electronics', icon: ShoppingBag }
    ]},
    { id: '5', name: 'Entertainment', icon: Music, subCategories: [
      { id: 's15', name: 'Movies', icon: Music },
      { id: 's16', name: 'Games', icon: Music },
      { id: 's17', name: 'Subscribes', icon: Music }
    ]},
    { id: '6', name: 'Car/Auto', icon: Fuel, subCategories: [
      { id: 's18', name: 'Fuel/Gas', icon: Fuel },
      { id: 's19', name: 'Service', icon: Fuel },
      { id: 's20', name: 'Parking', icon: Fuel }
    ]},
    { id: '7', name: 'Insurance/Medical', icon: Umbrella, subCategories: [
      { id: 's21', name: 'Insurance', icon: Umbrella },
      { id: 's22', name: 'Medical', icon: Umbrella }
    ]},
    { id: '8', name: 'Misc/One-time', icon: Star, subCategories: [
      { id: 's23', name: 'General', icon: Star }
    ]}
  ]);

  // OOP Budget Service Instance — acts as the main engine for business logic
  const budgetService = new BudgetService(expenses, incomes, bankAccounts);

  // ── §7b: COMPONENT-LEVEL HELPERS ────────────────────────────

  /**
   * getIconForCategory
   * Returns the Lucide icon component for a given category name.
   * Checks expense categories first, then income categories.
   * Falls back to the Wallet icon if no match is found.
   */
  const getIconForCategory = (catName) => {
    const foundExpense = categories.find(c => c.name.toLowerCase() === catName?.toLowerCase());
    if (foundExpense) return foundExpense.icon;
    const foundIncome = INCOME_CATEGORIES.find(c => c.name.toLowerCase() === catName?.toLowerCase());
    return foundIncome ? foundIncome.icon : Wallet;
  };

  /**
   * formatExpenseDate
   * Converts ISO date string 'YYYY-MM-DD' → readable 'Jan 5, 2026'.
   * Used in all transaction table rows.
   */
  const formatExpenseDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year     = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day      = parseInt(parts[2], 10);
    const monthName = ALL_MONTHS[monthIdx]?.substring(0, 3);
    return `${monthName} ${day}, ${year}`;
  };

  // ── §7c: COMPUTED FILTERED DATA ──────────────────────────────
  // These arrays re-compute whenever expenses/incomes or the selected
  // year/month change. All charts and tables read from these.

  // Only expenses that match the currently selected year + month
  const filteredExpenses = expenses.filter(exp => {
    if (!exp.date) return false;
    const parts = exp.date.split('-');
    if (parts.length !== 3) return false;
    const expYear = parts[0];
    if (selectedMonth === 'Full Year') return expYear === selectedYear;
    const expMonthIndex = parseInt(parts[1], 10) - 1;
    const expMonth = ALL_MONTHS[expMonthIndex];
    return expYear === selectedYear && expMonth === selectedMonth;
  });

  // Only incomes that match the currently selected year + month
  const filteredIncomes = incomes.filter(inc => {
    if (!inc.date) return false;
    const parts = inc.date.split('-');
    if (parts.length !== 3) return false;
    const incYear = parts[0];
    if (selectedMonth === 'Full Year') return incYear === selectedYear;
    const incMonthIndex = parseInt(parts[1], 10) - 1;
    const incMonth = ALL_MONTHS[incMonthIndex];
    return incYear === selectedYear && incMonth === selectedMonth;
  });

  // Calculate previous month's/year's stats for trend comparisons
  const currentMonthIdx = ALL_MONTHS.indexOf(selectedMonth);
  let prevMonthIdx = currentMonthIdx - 1;
  let prevYear = parseInt(selectedYear, 10);
  if (selectedMonth === 'Full Year') {
    prevYear -= 1;
  } else if (prevMonthIdx < 0) {
    prevMonthIdx = 11;
    prevYear -= 1;
  }
  const prevMonthName = prevMonthIdx >= 0 ? ALL_MONTHS[prevMonthIdx] : null;
  const prevYearStr = prevYear.toString();

  const prevExpenses = expenses.filter(exp => {
    if (!exp.date) return false;
    const parts = exp.date.split('-');
    if (parts.length !== 3) return false;
    const expYear = parts[0];
    if (selectedMonth === 'Full Year') {
      return expYear === prevYearStr;
    }
    const expMonthIndex = parseInt(parts[1], 10) - 1;
    const expMonth = ALL_MONTHS[expMonthIndex];
    return expYear === prevYearStr && expMonth === prevMonthName;
  });

  const prevIncomes = incomes.filter(inc => {
    if (!inc.date) return false;
    const parts = inc.date.split('-');
    if (parts.length !== 3) return false;
    const incYear = parts[0];
    if (selectedMonth === 'Full Year') {
      return incYear === prevYearStr;
    }
    const incMonthIndex = parseInt(parts[1], 10) - 1;
    const incMonth = ALL_MONTHS[incMonthIndex];
    return incYear === prevYearStr && incMonth === prevMonthName;
  });



  // ── §7d: EVENT HANDLERS ──────────────────────────────────────
  // All CRUD operations for expenses, incomes, and bank accounts.

  // ─── Bank Account Handlers ────────────────────────────────────

  /**
   * handleSaveBankAccount
   * Validates and saves a new or edited bank account to state.
   * Handles both Credit Card (limit/remainingLimit) and
   * Savings/Current (multiple account numbers + balances).
   */
  const handleSaveBankAccount = () => {
    if (!bankFormName || !bankFormName.trim()) {
      alert('Please select or enter a valid bank name.');
      return;
    }

    const isCreditCard = bankFormType === 'Credit Card';
    
    let parsedBalance = 0;
    let parsedLimit = isCreditCard ? parseFloat(bankFormLimit || '0') : 0;
    let parsedRemaining = isCreditCard ? parseFloat(bankFormRemainingLimit || '0') : 0;
    
    let savedAccountNumbers = [];
    let savedBalances = [];

    if (isCreditCard) {
      if (isNaN(parsedLimit) || isNaN(parsedRemaining)) {
        alert('Please enter valid credit card limit details.');
        return;
      }
    } else {
      const parsedBalancesArray = bankFormBalances.map(b => parseFloat(b || '0'));
      for (let i = 0; i < parsedBalancesArray.length; i++) {
        if (isNaN(parsedBalancesArray[i])) {
          alert(`Please enter a valid balance for account #${i + 1}`);
          return;
        }
      }
      
      savedAccountNumbers = [...bankFormAccountNumbers];
      savedBalances = parsedBalancesArray;
      parsedBalance = parsedBalancesArray.reduce((sum, val) => sum + val, 0);
    }

    try {
      budgetService.saveBankAccount(editingBankAccountId, {
        country: bankFormCountry,
        bankName: bankFormName.trim(),
        accountType: bankFormType,
        currency: bankFormCurrency,
        branch: bankFormBranch,
        balance: parsedBalance,
        limit: parsedLimit,
        remainingLimit: parsedRemaining,
        accountNumbers: savedAccountNumbers,
        balances: savedBalances
      });
      setBankAccounts(budgetService.bankAccounts.map(b => b.toJSON()));
    } catch (err) {
      alert(err.message);
      return;
    }

    setIsBankModalOpen(false);
    setEditingBankAccountId(null);
    
    // Reset Form
    setBankFormCountry('Sri Lanka');
    setBankFormName('');
    setBankFormType('Savings');
    setBankFormCurrency('LKR');
    setBankFormBranch('');
    setBankFormBalance('');
    setBankFormLimit('');
    setBankFormRemainingLimit('');
    setBankFormAccountNumbers(['']);
    setBankFormBalances(['']);
  };

  const handleEditBankAccount = (account) => {
    const rawAccount = bankAccounts.find(b => b.id === account.id) || account;
    setEditingBankAccountId(rawAccount.id);
    setBankFormCountry(rawAccount.country || 'Sri Lanka');
    setBankFormName(rawAccount.bankName);
    setBankFormType(rawAccount.accountType);
    setBankFormCurrency(rawAccount.currency);
    setBankFormBranch(rawAccount.branch || '');
    setBankFormBalance(rawAccount.balance ? rawAccount.balance.toString() : '');
    setBankFormLimit(rawAccount.limit ? rawAccount.limit.toString() : '');
    setBankFormRemainingLimit(rawAccount.remainingLimit ? rawAccount.remainingLimit.toString() : '');
    
    if (rawAccount.accountNumbers && rawAccount.accountNumbers.length > 0) {
      setBankFormAccountNumbers([...rawAccount.accountNumbers]);
      setBankFormBalances(rawAccount.balances ? rawAccount.balances.map(b => b.toString()) : ['0']);
    } else {
      setBankFormAccountNumbers(['']);
      setBankFormBalances([rawAccount.balance ? rawAccount.balance.toString() : '']);
    }
    
    setIsBankModalOpen(true);
  };

  /**
   * handleDeleteBankAccount
   * Shows a warning dialog before permanently deleting a bank account.
   */
  const handleDeleteBankAccount = (id) => {
    const confirm = window.confirm('⚠️ WARNING: Are you sure you want to delete this bank account? This action cannot be undone.');
    if (confirm) {
      budgetService.deleteBankAccount(id);
      setBankAccounts(budgetService.bankAccounts.map(b => b.toJSON()));
    }
  };

  // ─── Expense / Income Handlers ────────────────────────────────

  /**
   * handleSaveExpense
   * Validates form, formats the bankName with account details appended,
   * then adds a new or updates an existing expense/income in the list.
   * Syncs to localStorage + backend API via syncExpensesToDatabase.
   */
  const handleSaveExpense = () => {
    if (!formAmount || isNaN(formAmount) || parseFloat(formAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    let savedBankName = formBankName;
    if ((formPayFrom === 'Bank Account' || formPayFrom === 'Credit Card') && formBankName) {
      if (formSelectedAccountDetails) {
        savedBankName = `${formBankName} (${formSelectedAccountDetails})`;
      }
    }

    try {
      budgetService.saveTransaction(formType, editingExpenseId, {
        date: formDate,
        category: formCategory,
        subCategory: formSubcategory,
        amount: parseFloat(formAmount),
        currency: formCurrency,
        account: formPayFrom || 'Cash',
        bankName: (formPayFrom === 'Bank Account' || formPayFrom === 'Credit Card') ? savedBankName : '',
        notes: formNotes,
        icon: getIconForCategory(formCategory)
      });
      setExpenses(budgetService.expenses.map(e => e.toJSON()));
      setIncomes(budgetService.incomes.map(i => i.toJSON()));
    } catch (err) {
      alert(err.message);
      return;
    }
    
    // Reset form
    setFormAmount('');
    setFormBankName('');
    setFormSelectedAccountDetails('');
    setFormNotes('');
    setIsAddExpenseOpen(false);
  };

  const handleEditExpense = (exp) => {
    setFormType('expense');
    setEditingExpenseId(exp.id);
    setFormDate(exp.date);
    setFormCategory(exp.category);
    setFormSubcategory(exp.subCategory);
    setFormAmount(exp.amount.toString());
    setFormCurrency(exp.currency || 'AED');
    setFormPayFrom(exp.account);
    
    let bankPart = exp.bankName || '';
    let detailPart = '';
    if (bankPart.includes(' (')) {
      const parts = bankPart.split(' (');
      bankPart = parts[0];
      detailPart = parts[1].replace(')', '');
    }
    setFormBankName(bankPart);
    setFormSelectedAccountDetails(detailPart);
    
    setFormNotes(exp.notes);
    setIsAddExpenseOpen(true);
  };

  const handleEditIncome = (inc) => {
    setFormType('income');
    setEditingExpenseId(inc.id);
    setFormDate(inc.date);
    setFormCategory(inc.category);
    setFormSubcategory(inc.subCategory);
    setFormAmount(inc.amount.toString());
    setFormCurrency(inc.currency || 'AED');
    setFormPayFrom(inc.account);
    
    let bankPart = inc.bankName || '';
    let detailPart = '';
    if (bankPart.includes(' (')) {
      const parts = bankPart.split(' (');
      bankPart = parts[0];
      detailPart = parts[1].replace(')', '');
    }
    setFormBankName(bankPart);
    setFormSelectedAccountDetails(detailPart);
    
    setFormNotes(inc.notes);
    setIsAddExpenseOpen(true);
  };

  const handleDeleteExpense = (id) => {
    const confirm = window.confirm("Are you sure you want to delete this expense?");
    if (confirm) {
      budgetService.deleteTransaction('expense', id);
      setExpenses(budgetService.expenses.map(e => e.toJSON()));
    }
  };

  const handleDeleteIncome = (id) => {
    const confirm = window.confirm("Are you sure you want to delete this income?");
    if (confirm) {
      budgetService.deleteTransaction('income', id);
      setIncomes(budgetService.incomes.map(i => i.toJSON()));
    }
  };

  const handleStartAddCategory = () => {
    setNewCategoryName('');
    setNewCategoryIcon(Star);
    setIsAddCategoryOpen(true);
  };

  const handleSaveNewCategory = () => {
    if (!newCategoryName || !newCategoryName.trim()) {
      alert('Please enter a valid category name.');
      return;
    }

    const name = newCategoryName.trim();

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('This category name already exists!');
      return;
    }

    setCategories([
      ...categories,
      { id: Date.now().toString(), name, icon: newCategoryIcon }
    ]);

    setIsAddCategoryOpen(false);
  };

  const handleDeleteCategory = (id) => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      const confirm = window.confirm(`Are you sure you want to delete the category "${cat.name}"?`);
      if (confirm) {
        setCategories(categories.filter(c => c.id !== id));
      }
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
    setEditCategoryIcon(cat.icon || Star);
    setIsEditCategoryOpen(true);
  };

  const handleSaveCategoryEdit = () => {
    if (!editCategoryName || !editCategoryName.trim()) {
      alert('Please enter a valid category name.');
      return;
    }

    const updatedName = editCategoryName.trim();

    if (categories.some(c => c.id !== editingCategory.id && c.name.toLowerCase() === updatedName.toLowerCase())) {
      alert('This category name already exists!');
      return;
    }

    setCategories(categories.map(c => c.id === editingCategory.id ? {
      ...c,
      name: updatedName,
      icon: editCategoryIcon
    } : c));

    const updatedList = expenses.map(exp => {
      if (exp.category === editingCategory.name) {
        return {
          ...exp,
          category: updatedName,
          icon: editCategoryIcon
        };
      }
      return exp;
    });

    setExpenses(updatedList);
    syncExpensesToDatabase(updatedList);

    if (formCategory === editingCategory.name) {
      setFormCategory(updatedName);
    }

    setIsEditCategoryOpen(false);
    setEditingCategory(null);
  };

  const handleOpenSubCategoriesManager = (cat) => {
    setActiveParentCategory(cat);
    setIsSubCategoriesManagerOpen(true);
  };

  const handleDeleteSubCategory = (subId) => {
    const confirm = window.confirm("Are you sure you want to delete this subcategory?");
    if (confirm) {
      setCategories(categories.map(c => {
        if (c.id === activeParentCategory.id) {
          const updatedSubs = c.subCategories.filter(s => s.id !== subId);
          setActiveParentCategory({ ...c, subCategories: updatedSubs });
          return { ...c, subCategories: updatedSubs };
        }
        return c;
      }));
    }
  };

  const handleStartAddSubCategory = () => {
    setNewSubCategoryName('');
    setNewSubCategoryIcon(activeParentCategory.icon || Star);
    setIsAddSubCategoryOpen(true);
  };

  const handleSaveNewSubCategory = () => {
    if (!newSubCategoryName || !newSubCategoryName.trim()) {
      alert("Please enter a valid subcategory name.");
      return;
    }
    const name = newSubCategoryName.trim();
    if (activeParentCategory.subCategories?.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      alert("This subcategory already exists!");
      return;
    }

    const newSubObj = {
      id: Date.now().toString(),
      name,
      icon: newSubCategoryIcon
    };

    setCategories(categories.map(c => {
      if (c.id === activeParentCategory.id) {
        const updatedSubs = [...(c.subCategories || []), newSubObj];
        setActiveParentCategory({ ...c, subCategories: updatedSubs });
        return { ...c, subCategories: updatedSubs };
      }
      return c;
    }));

    setIsAddSubCategoryOpen(false);
  };

  const handleStartEditSubCategory = (sub) => {
    setEditingSubCategory(sub);
    setEditSubCategoryName(sub.name);
    setEditSubCategoryIcon(sub.icon || activeParentCategory.icon || Star);
    setIsEditSubCategoryOpen(true);
  };

  const handleSaveEditSubCategory = () => {
    if (!editSubCategoryName || !editSubCategoryName.trim()) {
      alert("Please enter a valid subcategory name.");
      return;
    }
    const updatedName = editSubCategoryName.trim();
    if (activeParentCategory.subCategories?.some(s => s.id !== editingSubCategory.id && s.name.toLowerCase() === updatedName.toLowerCase())) {
      alert("This subcategory name already exists!");
      return;
    }

    setCategories(categories.map(c => {
      if (c.id === activeParentCategory.id) {
        const updatedSubs = c.subCategories.map(s => s.id === editingSubCategory.id ? {
          ...s,
          name: updatedName,
          icon: editSubCategoryIcon
        } : s);
        setActiveParentCategory({ ...c, subCategories: updatedSubs });
        return { ...c, subCategories: updatedSubs };
      }
      return c;
    }));

    const updatedList = expenses.map(exp => {
      if (exp.category === activeParentCategory.name && exp.subCategory === editingSubCategory.name) {
        return {
          ...exp,
          subCategory: updatedName
        };
      }
      return exp;
    });

    setExpenses(updatedList);
    syncExpensesToDatabase(updatedList);

    setIsEditSubCategoryOpen(false);
    setEditingSubCategory(null);
  };

  // ── §7e: COMPUTED VALUES ────────────────────────────────────────
  // Active color palette based on current dark/light mode toggle
  const COLORS = isDarkMode ? THEMES.dark : THEMES.light;

  // The "default" currency is the one marked isDefault in the currencies list
  const defaultCurrencyObj = currencies.find(c => c.isDefault)
    || currencies.find(c => c.code === 'AED')
    || currencies[0]
    || { code: 'AED', symbol: 'AED' };
  const currencyCode   = defaultCurrencyObj.code;

  // Helper to sum by currency for local state calculations
  const sumByCurrency = (items) => {
    return items.reduce((acc, item) => {
      const cur = item.currency || 'AED';
      acc[cur] = (acc[cur] || 0) + (item.amount || 0);
      return acc;
    }, {});
  };

  const expensesSumByCurrency = sumByCurrency(filteredExpenses);
  const incomesSumByCurrency  = sumByCurrency(filteredIncomes);
  const computedBankAccounts = budgetService.getComputedBankAccounts();
  const bankBalancesSumByCurrency = budgetService.sumBalancesByCurrency();

  // All currencies that have at least one non-zero transaction in the current period OR have a non-zero bank balance
  const activeCurrenciesForPeriod = Array.from(new Set([
    ...Object.keys(incomesSumByCurrency),
    ...Object.keys(expensesSumByCurrency),
    ...Object.keys(bankBalancesSumByCurrency)
  ])).filter(cur => 
    (incomesSumByCurrency[cur] || 0) > 0 || 
    (expensesSumByCurrency[cur] || 0) > 0 || 
    (bankBalancesSumByCurrency[cur] || 0) > 0
  );

  // Fall back to the default currency if nothing has been entered yet
  const activeCurrencies = activeCurrenciesForPeriod.length > 0
    ? activeCurrenciesForPeriod
    : [currencyCode];

  // Calculate balances by currency: cash balance (income - expense) + bank details account balances
  const balancesByCurrency = activeCurrencies.reduce((acc, cur) => {
    const inc = incomesSumByCurrency[cur] || 0;
    const exp = expensesSumByCurrency[cur] || 0;
    const bankSum = bankBalancesSumByCurrency[cur] || 0;
    acc[cur] = (inc - exp) + bankSum;
    return acc;
  }, {});

  const bankBalancesSumDefault = budgetService.sumBalancesDefaultCurrency(currencyCode);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, color: COLORS.skyBlue },
    { name: 'Income', icon: CircleDollarSign, color: COLORS.green },
    { name: 'Expenses', icon: Wallet, color: COLORS.red },
    { name: 'Accounts', icon: Landmark, color: '#0EA5E9' },
    { name: 'Bills', icon: Calendar, color: COLORS.purple },
    { name: 'Budget', icon: Folder, color: COLORS.orange },
    { name: 'Payees', icon: Users, color: COLORS.green },
    { name: 'Reports', icon: Presentation, color: COLORS.orange },
    { name: 'Search', icon: Search, color: COLORS.red },
  ];

  const handleAddYear = () => {
    const newYear = window.prompt('Enter new year (e.g. 2027):');
    if (newYear && !isNaN(newYear) && newYear.length === 4) {
      if (!years.includes(newYear)) {
        const updatedYears = [...years, newYear].sort();
        setYears(updatedYears);
        setSelectedYear(newYear);
        setSelectedMonth('Full Year');
      } else {
        alert('Year already exists!');
      }
    } else if (newYear !== null) {
      alert('Please enter a valid 4-digit year.');
    }
  };

  const handleDeleteYear = () => {
    if (years.length <= 1) {
      alert('You must have at least one year.');
      return;
    }
    const confirm = window.confirm(`Are you sure you want to delete the year ${selectedYear}?`);
    if (confirm) {
      const updatedYears = years.filter(y => y !== selectedYear);
      setYears(updatedYears);
      setSelectedYear(updatedYears[updatedYears.length - 1]);
    }
  };

  if (!isLoggedIn) {
    const COLORS = THEMES.dark;
    return (
      <div 
        className="min-h-screen w-screen flex items-center justify-center font-sans transition-colors duration-300 relative overflow-hidden" 
        style={{ 
          backgroundColor: '#070A13',
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(79, 209, 245, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(236, 141, 245, 0.06) 0%, transparent 40%)'
        }}
      >
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#4FD1F5]/10 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#EC8DF5]/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div 
          className="relative w-full max-w-md mx-4 p-8 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(21, 26, 45, 0.8)', 
            borderColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-inner" style={{ backgroundColor: 'rgba(79, 209, 245, 0.1)', border: '1px solid rgba(79, 209, 245, 0.2)' }}>
              <Wallet className="w-8 h-8 text-[#4FD1F5]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Budget Master</h1>
            <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Personal Finance & Strategic Planning</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <div 
                className="p-4 rounded-xl text-sm font-medium border flex items-center gap-3 animate-pulse"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  borderColor: 'rgba(239, 68, 68, 0.2)', 
                  color: '#FCA5A5' 
                }}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textSecondary }}>Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
                </span>
                <input 
                  type="text" 
                  required
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4FD1F5] transition-all border text-white font-medium"
                  style={{ 
                    backgroundColor: '#1C2237', 
                    borderColor: 'rgba(255, 255, 255, 0.1)' 
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLORS.textSecondary }}>Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
                </span>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4FD1F5] transition-all border text-white font-medium"
                  style={{ 
                    backgroundColor: '#1C2237', 
                    borderColor: 'rgba(255, 255, 255, 0.1)' 
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 px-4 font-bold text-sm text-[#0B0F19] rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer shadow-lg hover:shadow-[#4FD1F5]/20"
              style={{ 
                backgroundColor: '#4FD1F5',
                background: 'linear-gradient(135deg, #4FD1F5 0%, #38BDF8 100%)'
              }}
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t text-center text-xs" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <span style={{ color: COLORS.textSecondary }}>Secured with enterprise session encryption</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans transition-colors duration-300" style={{ backgroundColor: COLORS.bgMain, color: COLORS.textPrimary }}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        COLORS={COLORS}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        menuItems={menuItems}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 border-b transition-colors duration-300" style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border }}>
          <div className="flex items-center gap-4 lg:hidden mr-4">
            <button className="p-2 rounded-lg cursor-pointer" onClick={() => setSidebarOpen(true)} style={{ color: COLORS.textSecondary }}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 max-w-xl">
            <div className="flex items-center px-4 py-2 rounded-lg border transition-all" style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}>
              <Search className="w-4 h-4 mr-3" style={{ color: COLORS.textSecondary }} />
              <input 
                type="text" 
                placeholder="Search reports..." 
                className="bg-transparent border-none focus:outline-none text-sm w-full"
                style={{ color: COLORS.textPrimary }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-5 ml-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="transition-colors hover:opacity-80 cursor-pointer" 
              style={{ color: COLORS.textSecondary }}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="relative transition-colors hover:opacity-80 cursor-pointer" style={{ color: COLORS.textSecondary }}>
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: COLORS.red, borderColor: COLORS.bgMain }}></span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-4 border-l focus:outline-none cursor-pointer group" 
                style={{ borderColor: COLORS.border }}
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold transition-colors group-hover:text-[#4FD1F5]" style={{ color: COLORS.textPrimary }}>Lahiru T</span>
                  <span className="text-xs text-right" style={{ color: COLORS.textSecondary }}>Premium User</span>
                </div>
                <img src={userProfileImg} alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#4FD1F5] transition-all" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-xl border shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ 
                      backgroundColor: COLORS.bgCard, 
                      borderColor: COLORS.border,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div className="px-3 py-2 border-b mb-1" style={{ borderColor: COLORS.border }}>
                      <p className="text-xs font-semibold" style={{ color: COLORS.textSecondary }}>Signed in as</p>
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.textPrimary }}>lahirut85</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400 flex items-center gap-2 cursor-pointer"
                      style={{ color: COLORS.textPrimary }}
                    >
                      <TrendingDown className="w-4 h-4 rotate-45 text-red-500" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          {activeMenu === 'Dashboard' ? (
            <DashboardView
              COLORS={COLORS}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              years={years}
              handleAddYear={handleAddYear}
              handleDeleteYear={handleDeleteYear}
              ALL_MONTHS={ALL_MONTHS}
              filteredExpenses={filteredExpenses}
              filteredIncomes={filteredIncomes}
              prevExpenses={prevExpenses}
              prevIncomes={prevIncomes}
              bankBalancesSumDefault={bankBalancesSumDefault}
              balancesByCurrency={balancesByCurrency}
              activeCurrencies={activeCurrencies}
              currencies={currencies}
              categories={categories}
              INCOME_CATEGORIES={INCOME_CATEGORIES}
              isDarkMode={isDarkMode}
            />
          ) : activeMenu === 'Expenses' ? (
            <ExpensesView
              COLORS={COLORS}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              years={years}
              ALL_MONTHS={ALL_MONTHS}
              setFormType={setFormType}
              setFormDate={setFormDate}
              categories={categories}
              setFormCategory={setFormCategory}
              setFormSubcategory={setFormSubcategory}
              setFormAmount={setFormAmount}
              setFormPayFrom={setFormPayFrom}
              setFormBankName={setFormBankName}
              setFormNotes={setFormNotes}
              setEditingExpenseId={setEditingExpenseId}
              setIsAddExpenseOpen={setIsAddExpenseOpen}
              activeCurrencies={activeCurrencies}
              currencies={currencies}
              filteredExpenses={filteredExpenses}
              isDarkMode={isDarkMode}
              handleEditExpense={handleEditExpense}
              handleDeleteExpense={handleDeleteExpense}
            />
          ) : activeMenu === 'Income' ? (
            <IncomeView
              COLORS={COLORS}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              years={years}
              ALL_MONTHS={ALL_MONTHS}
              setFormType={setFormType}
              setFormDate={setFormDate}
              setFormCategory={setFormCategory}
              setFormSubcategory={setFormSubcategory}
              setFormAmount={setFormAmount}
              setFormPayFrom={setFormPayFrom}
              setFormBankName={setFormBankName}
              setFormNotes={setFormNotes}
              setEditingExpenseId={setEditingExpenseId}
              setIsAddExpenseOpen={setIsAddExpenseOpen}
              activeCurrencies={activeCurrencies}
              currencies={currencies}
              filteredIncomes={filteredIncomes}
              INCOME_CATEGORIES={INCOME_CATEGORIES}
              isDarkMode={isDarkMode}
              handleEditIncome={handleEditIncome}
              handleDeleteIncome={handleDeleteIncome}
            />
          ) : activeMenu === 'Accounts' ? (
            <AccountsView
              COLORS={COLORS}
              setEditingBankAccountId={setEditingBankAccountId}
              setBankFormName={setBankFormName}
              setBankFormType={setBankFormType}
              setBankFormCurrency={setBankFormCurrency}
              setBankFormBalance={setBankFormBalance}
              setBankFormLimit={setBankFormLimit}
              setBankFormRemainingLimit={setBankFormRemainingLimit}
              setIsBankModalOpen={setIsBankModalOpen}
              computedBankAccounts={computedBankAccounts}
              currencies={currencies}
              handleEditBankAccount={handleEditBankAccount}
              handleDeleteBankAccount={handleDeleteBankAccount}
            />
          ) : (
            <div className="max-w-7xl mx-auto text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight" style={{ color: COLORS.textPrimary }}>{activeMenu}</h1>
                  <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Manage your {activeMenu.toLowerCase()} here.</p>
                </div>
              </div>
              <div className="mt-8 p-12 text-center rounded-2xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bgCard }}>
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>Under Development</h3>
                <p className="text-sm mt-2" style={{ color: COLORS.textSecondary, opacity: 0.7 }}>Content for {activeMenu} will be added here soon.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modular Modals */}
      <TransactionModal
        isAddExpenseOpen={isAddExpenseOpen}
        setIsAddExpenseOpen={setIsAddExpenseOpen}
        formType={formType}
        editingExpenseId={editingExpenseId}
        setEditingExpenseId={setEditingExpenseId}
        handleSaveExpense={handleSaveExpense}
        formDate={formDate}
        setFormDate={setFormDate}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        INCOME_CATEGORIES={INCOME_CATEGORIES}
        categories={categories}
        formSubcategory={formSubcategory}
        setFormSubcategory={setFormSubcategory}
        setIsCategoriesManagerOpen={setIsCategoriesManagerOpen}
        handleOpenSubCategoriesManager={handleOpenSubCategoriesManager}
        formAmount={formAmount}
        setFormAmount={setFormAmount}
        formCurrency={formCurrency}
        setFormCurrency={setFormCurrency}
        currencies={currencies}
        setIsCurrencyManagerOpen={setIsCurrencyManagerOpen}
        formPayFrom={formPayFrom}
        setFormPayFrom={setFormPayFrom}
        formBankName={formBankName}
        setFormBankName={setFormBankName}
        formSelectedAccountDetails={formSelectedAccountDetails}
        setFormSelectedAccountDetails={setFormSelectedAccountDetails}
        computedBankAccounts={computedBankAccounts}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
      />

      <BankModal
        isBankModalOpen={isBankModalOpen}
        setIsBankModalOpen={setIsBankModalOpen}
        editingBankAccountId={editingBankAccountId}
        setEditingBankAccountId={setEditingBankAccountId}
        handleSaveBankAccount={handleSaveBankAccount}
        bankFormCountry={bankFormCountry}
        setBankFormCountry={setBankFormCountry}
        bankFormName={bankFormName}
        setBankFormName={setBankFormName}
        bankFormType={bankFormType}
        setBankFormType={setBankFormType}
        bankFormCurrency={bankFormCurrency}
        setBankFormCurrency={setBankFormCurrency}
        bankFormBranch={bankFormBranch}
        setBankFormBranch={setBankFormBranch}
        bankFormLimit={bankFormLimit}
        setBankFormLimit={setBankFormLimit}
        bankFormRemainingLimit={bankFormRemainingLimit}
        setBankFormRemainingLimit={setBankFormRemainingLimit}
        bankFormAccountNumbers={bankFormAccountNumbers}
        setBankFormAccountNumbers={setBankFormAccountNumbers}
        bankFormBalances={bankFormBalances}
        setBankFormBalances={setBankFormBalances}
        showAddCustomBank={showAddCustomBank}
        setShowAddCustomBank={setShowAddCustomBank}
        showAddCustomType={showAddCustomType}
        setShowAddCustomType={setShowAddCustomType}
        showAddCustomBranch={showAddCustomBranch}
        setShowAddCustomBranch={setShowAddCustomBranch}
        newCustomBankName={newCustomBankName}
        setNewCustomBankName={setNewCustomBankName}
        newCustomTypeName={newCustomTypeName}
        setNewCustomTypeName={setNewCustomTypeName}
        newCustomBranchName={newCustomBranchName}
        setNewCustomBranchName={setNewCustomBranchName}
        customBanks={customBanks}
        setCustomBanks={setCustomBanks}
        customAccountTypes={customAccountTypes}
        setCustomAccountTypes={setCustomAccountTypes}
        customBranches={customBranches}
        setCustomBranches={setCustomBranches}
        currencies={currencies}
      />

      <CurrencyManagerModal
        isCurrencyManagerOpen={isCurrencyManagerOpen}
        setIsCurrencyManagerOpen={setIsCurrencyManagerOpen}
        selectedCurrencyToAdd={selectedCurrencyToAdd}
        setSelectedCurrencyToAdd={setSelectedCurrencyToAdd}
        ALL_CURRENCIES={ALL_CURRENCIES}
        currencies={currencies}
        setCurrencies={setCurrencies}
        formCurrency={formCurrency}
        setFormCurrency={setFormCurrency}
      />

      <CategoryManagerModal
        isCategoriesManagerOpen={isCategoriesManagerOpen}
        setIsCategoriesManagerOpen={setIsCategoriesManagerOpen}
        categories={categories}
        setCategories={setCategories}
        handleDeleteCategory={handleDeleteCategory}
        handleStartEditCategory={handleStartEditCategory}
        handleOpenSubCategoriesManager={handleOpenSubCategoriesManager}
        isAddCategoryOpen={isAddCategoryOpen}
        setIsAddCategoryOpen={setIsAddCategoryOpen}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        newCategoryIcon={newCategoryIcon}
        setNewCategoryIcon={setNewCategoryIcon}
        handleSaveNewCategory={handleSaveNewCategory}
        isEditCategoryOpen={isEditCategoryOpen}
        setIsEditCategoryOpen={setIsEditCategoryOpen}
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
        editCategoryName={editCategoryName}
        setEditCategoryName={setEditCategoryName}
        editCategoryIcon={editCategoryIcon}
        setEditCategoryIcon={setEditCategoryIcon}
        handleSaveCategoryEdit={handleSaveCategoryEdit}
        isSubCategoriesManagerOpen={isSubCategoriesManagerOpen}
        setIsSubCategoriesManagerOpen={setIsSubCategoriesManagerOpen}
        activeParentCategory={activeParentCategory}
        setActiveParentCategory={setActiveParentCategory}
        isAddSubCategoryOpen={isAddSubCategoryOpen}
        setIsAddSubCategoryOpen={setIsAddSubCategoryOpen}
        newSubCategoryName={newSubCategoryName}
        setNewSubCategoryName={setNewSubCategoryName}
        newSubCategoryIcon={newSubCategoryIcon}
        setNewSubCategoryIcon={setNewSubCategoryIcon}
        handleSaveNewSubCategory={handleSaveNewSubCategory}
        isEditSubCategoryOpen={isEditSubCategoryOpen}
        setIsEditSubCategoryOpen={setIsEditSubCategoryOpen}
        editingSubCategory={editingSubCategory}
        setEditingSubCategory={setEditingSubCategory}
        editSubCategoryName={editSubCategoryName}
        setEditSubCategoryName={setEditSubCategoryName}
        editSubCategoryIcon={editSubCategoryIcon}
        setEditSubCategoryIcon={setEditSubCategoryIcon}
        handleSaveEditSubCategory={handleSaveEditSubCategory}
        handleDeleteSubCategory={handleDeleteSubCategory}
        handleStartAddSubCategory={handleStartAddSubCategory}
        AVAILABLE_ICONS={AVAILABLE_ICONS}
        Star={Star}
      />
    </div>
  );
};

export default Dashboard;
