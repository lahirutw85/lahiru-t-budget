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
import { Login } from './Login';


// ================================================================
// §2. EXTERNAL CONSTANTS & UTILITIES
// ================================================================
import { THEMES } from '../constants/themes';
import { ALL_CURRENCIES, EXCHANGE_RATES } from '../constants/currencies';
import { SRI_LANKA_BANKS, UAE_BANKS, SRI_LANKA_BRANCHES, UAE_BRANCHES } from '../constants/banks';
import { INCOME_CATEGORIES, AVAILABLE_ICONS, ALL_MONTHS } from '../constants/categories';
import { convertCurrency } from '../utils/currencyUtils';
import { fetchExpenses, fetchIncomes, fetchBankAccounts, fetchCurrencies, fetchSettings, syncExpenses, syncIncomes, syncBankAccounts, syncCurrencies, syncSettings } from '../utils/dataSync';





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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setProfileDropdownOpen(false);
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

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // ── §7b: STARTUP DATA FETCH FROM GOOGLE SHEETS (cloud) ────────
  // On mount, fetch all data from Google Apps Script Web App.
  // Falls back to localStorage if the cloud is unreachable.
  useEffect(() => {
    const loadAll = async () => {
      // 1. Expenses
      const expData = await fetchExpenses();
      const hydratedExp = (expData || []).map(exp => ({ ...exp, icon: getIconForCategory(exp.category) }));
      setExpenses(hydratedExp);
      const uniqueYears = Array.from(new Set(hydratedExp.map(e => e.date?.split('-')[0]).filter(Boolean)));
      const currentYear = new Date().getFullYear().toString();
      if (!uniqueYears.includes(currentYear)) uniqueYears.push(currentYear);
      setYears(uniqueYears.sort((a, b) => b - a));

      // 2. Incomes
      const incData = await fetchIncomes();
      const hydratedInc = (incData || []).map(inc => ({ ...inc, icon: getIconForCategory(inc.category) }));
      setIncomes(hydratedInc);

      // 3. Bank Accounts
      const bankData = await fetchBankAccounts();
      if (bankData !== null) {
        setBankAccounts((bankData || []).map(b => {
          if (b.accountType !== 'Credit Card') {
            return {
              ...b,
              accountNumbers: Array.isArray(b.accountNumbers) && b.accountNumbers.length > 0 ? b.accountNumbers : [''],
              balances: Array.isArray(b.balances) && b.balances.length > 0 ? b.balances : [parseFloat(b.balance) || 0],
            };
          }
          return b;
        }));
      }

      // 4. Currencies
      const currData = await fetchCurrencies();
      if (currData !== null && currData.length > 0) {
        setCurrencies(currData);
      }

      // 5. App Settings
      const settingsData = await fetchSettings();
      if (settingsData) {
        if (Array.isArray(settingsData.customBanks)) setCustomBanks(settingsData.customBanks);
        if (Array.isArray(settingsData.customAccountTypes)) setCustomAccountTypes(settingsData.customAccountTypes);
        if (Array.isArray(settingsData.customBranches)) setCustomBranches(settingsData.customBranches);
      }
      setIsDataLoaded(true);
    };
    loadAll();
  }, []);

  const syncExpensesToDatabase = async (updatedExpenses) => {
    await syncExpenses(updatedExpenses);
  };

  const syncIncomesToDatabase = async (updatedIncomes) => {
    await syncIncomes(updatedIncomes);
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
    const parsed = cached ? JSON.parse(cached) : [
      { code: 'USD', name: 'United States Dollar (USD)', symbol: '$' },
      { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
      { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
      { code: 'JPY', name: 'Japanese Yen (JPY)', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar (CAD)', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar (AUD)', symbol: 'A$' },
      { code: 'AED', name: 'Default', symbol: 'AED', isDefault: true },
      { code: 'LKR', name: 'Sri Lankan Rupee (LKR)', symbol: 'LKR' }
    ];
    // Ensure LKR is always in the active list
    const hasLKR = parsed.some(c => c.code === 'LKR');
    if (!hasLKR) {
      parsed.push({ code: 'LKR', name: 'Sri Lankan Rupee (LKR)', symbol: 'LKR' });
    }
    return parsed;
  });

  // Persist currencies whenever the list changes (Google Sheets cloud)
  useEffect(() => {
    if (!isDataLoaded) return;
    syncCurrencies(currencies);
  }, [currencies, isDataLoaded]);

  // Bank Accounts — persisted to cloud
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

  // Persist bank accounts whenever the list changes (Google Sheets cloud)
  useEffect(() => {
    if (!isDataLoaded) return;
    syncBankAccounts(bankAccounts);
  }, [bankAccounts, isDataLoaded]);

  // Bank Account MODAL state — open/close + which record is being edited
  const [isBankModalOpen,      setIsBankModalOpen]      = useState(false);
  const [editingBankAccountId, setEditingBankAccountId] = useState(null);

  
  // Custom user-added items for the bank modal dropdowns (Google Sheets cloud)
  const [customBanks, setCustomBanks] = useState(() => {
    const cached = localStorage.getItem('budget_custom_banks');
    return cached ? JSON.parse(cached) : [];
  });

  const [customAccountTypes, setCustomAccountTypes] = useState(() => {
    const cached = localStorage.getItem('budget_custom_account_types');
    return cached ? JSON.parse(cached) : [];
  });

  const [customBranches, setCustomBranches] = useState(() => {
    const cached = localStorage.getItem('budget_custom_branches');
    return cached ? JSON.parse(cached) : [];
  });

  // Persist all custom bank lists to settings sheet in cloud
  useEffect(() => {
    if (!isDataLoaded) return;
    syncSettings({
      customBanks,
      customAccountTypes,
      customBranches
    });
  }, [customBanks, customAccountTypes, customBranches, isDataLoaded]);



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



  // ── §7c: COMPUTED FILTERED DATA ──────────────────────────────
  // These collections re-compute whenever expenses/incomes or the selected
  // year/month change. All charts and tables read from these.

  // Only expenses that match the currently selected year + month
  const filteredExpenses = budgetService.expensesCollection.filterByPeriod(selectedYear, selectedMonth, ALL_MONTHS);

  // Only incomes that match the currently selected year + month
  const filteredIncomes = budgetService.incomesCollection.filterByPeriod(selectedYear, selectedMonth, ALL_MONTHS);

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

  const prevExpenses = budgetService.expensesCollection
    .filterByPeriod(prevYearStr, prevMonthName || 'Full Year', ALL_MONTHS);

  const prevIncomes = budgetService.incomesCollection
    .filterByPeriod(prevYearStr, prevMonthName || 'Full Year', ALL_MONTHS);



  // ── §7d: EVENT HANDLERS ──────────────────────────────────────
  // All CRUD operations for expenses, incomes, and bank accounts.

  // ─── Bank Account Handlers ────────────────────────────────────

  /**
   * handleSaveBankAccount
   * Validates and saves a new or edited bank account to state.
   * Handles both Credit Card (limit/remainingLimit) and
   * Savings/Current (multiple account numbers + balances).
   */
  const handleSaveBankAccount = (bankAccountData) => {
    try {
      budgetService.saveBankAccount(editingBankAccountId, bankAccountData);
      setBankAccounts(budgetService.bankAccounts.map(b => b.toJSON()));
      setIsBankModalOpen(false);
      setEditingBankAccountId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditBankAccount = (account) => {
    setEditingBankAccountId(account.id);
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
      const updatedExpenses = budgetService.expenses.map(e => e.toJSON());
      const updatedIncomes = budgetService.incomes.map(i => i.toJSON());
      setExpenses(updatedExpenses);
      setIncomes(updatedIncomes);
      if (formType === 'expense') {
        syncExpensesToDatabase(updatedExpenses);
      } else {
        syncIncomesToDatabase(updatedIncomes);
      }
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
      const updated = budgetService.expenses.map(e => e.toJSON());
      setExpenses(updated);
      syncExpensesToDatabase(updated);
    }
  };

  const handleDeleteIncome = (id) => {
    const confirm = window.confirm("Are you sure you want to delete this income?");
    if (confirm) {
      budgetService.deleteTransaction('income', id);
      const updated = budgetService.incomes.map(i => i.toJSON());
      setIncomes(updated);
      syncIncomesToDatabase(updated);
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

  const expensesSumByCurrency = filteredExpenses.sumByCurrency();
  const incomesSumByCurrency  = filteredIncomes.sumByCurrency();
  const computedBankAccounts = budgetService.getComputedBankAccounts();
  const bankBalancesSumByCurrency = budgetService.sumBalancesByCurrency();

  // All currencies that have at least one non-zero transaction in the current period OR have a non-zero bank balance
  const activeCurrenciesForPeriod = Array.from(new Set([
    ...filteredIncomes.getUniqueCurrencies(),
    ...filteredExpenses.getUniqueCurrencies(),
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

  const cashIncomesSumByCurrency = budgetService.incomesCollection.filterCash().sumByCurrency();
  const cashExpensesSumByCurrency = budgetService.expensesCollection.filterCash().sumByCurrency();

  // Calculate balances by currency: cash balance (all-time cash income - all-time cash expense) + bank details account balances
  const balancesByCurrency = activeCurrencies.reduce((acc, cur) => {
    const cashInc = cashIncomesSumByCurrency[cur] || 0;
    const cashExp = cashExpensesSumByCurrency[cur] || 0;
    const bankSum = bankBalancesSumByCurrency[cur] || 0;
    acc[cur] = (cashInc - cashExp) + bankSum;
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
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
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
        key={`${isBankModalOpen}-${editingBankAccountId || 'new'}`}
        isBankModalOpen={isBankModalOpen}
        setIsBankModalOpen={setIsBankModalOpen}
        editingAccount={budgetService.bankAccounts.find(b => b.id === editingBankAccountId) || null}
        onSave={handleSaveBankAccount}
        customBanks={customBanks}
        setCustomBanks={setCustomBanks}
        customAccountTypes={customAccountTypes}
        setCustomAccountTypes={setCustomAccountTypes}
        customBranches={customBranches}
        setCustomBranches={setCustomBranches}
        currencies={currencies}
        setIsCurrencyManagerOpen={setIsCurrencyManagerOpen}
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
        handleStartAddCategory={handleStartAddCategory}
        handleStartEditSubCategory={handleStartEditSubCategory}
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
