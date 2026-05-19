// ================================================================
// BudgetService.js — OOP Orchestrator Service
// ================================================================
// The main business engine for the personal finance tracker.
// Encapsulates the operations for adding, editing, deleting,
// searching, and calculating values for transactions and bank accounts.
// Handles localStorage synchronization and optional DB syncing.
// ================================================================

import { Transaction } from './Transaction';
import { BankAccount } from './BankAccount';
import { TransactionCollection } from './TransactionCollection';
import { BankAccountCollection } from './BankAccountCollection';
import { syncExpenses, syncIncomes, syncBankAccounts } from '../utils/dataSync';

export class BudgetService {
  /**
   * Initializes the BudgetService with transaction lists and bank accounts.
   * @param {Array<Object>} expensesList - Initial list of expenses
   * @param {Array<Object>} incomesList - Initial list of incomes
   * @param {Array<Object>} bankAccountsList - Initial list of bank accounts
   */
  constructor(expensesList = [], incomesList = [], bankAccountsList = []) {
    this.expensesCollection = new TransactionCollection(expensesList);
    this.incomesCollection = new TransactionCollection(incomesList);
    this.bankAccountsCollection = new BankAccountCollection(bankAccountsList);
  }

  // Getters and setters for backward compatibility with array APIs
  get expenses() {
    return this.expensesCollection.toArray();
  }
  set expenses(val) {
    this.expensesCollection = new TransactionCollection(val);
  }

  get incomes() {
    return this.incomesCollection.toArray();
  }
  set incomes(val) {
    this.incomesCollection = new TransactionCollection(val);
  }

  get bankAccounts() {
    return this.bankAccountsCollection.toArray();
  }
  set bankAccounts(val) {
    this.bankAccountsCollection = new BankAccountCollection(val);
  }

  // ─── GETTERS & DERIVED CALCULATIONS ─────────────────────────────

  /**
   * getComputedBankAccounts
   * Evaluates all transaction logs against bank accounts to calculate current
   * real-time dynamic balances and credit remaining limits.
   * @returns {Array<BankAccount>} List of computed BankAccount instances
   */
  getComputedBankAccounts() {
    return this.bankAccountsCollection
      .computeBalances(this.incomesCollection, this.expensesCollection)
      .toArray();
  }

  /**
   * sumBalancesByCurrency
   * Group all computed bank account balances by currency (excluding credit cards).
   * @returns {Object} Key-value pair of currency code to total balance (e.g. { LKR: 25000, AED: 4500 })
   */
  sumBalancesByCurrency() {
    return this.bankAccountsCollection
      .computeBalances(this.incomesCollection, this.expensesCollection)
      .sumBalancesByCurrency();
  }

  /**
   * sumBalancesDefaultCurrency
   * Converts and sums all computed bank balances into a single default currency.
   * @param {string} defaultCurrency - The target default currency code (e.g., 'LKR')
   * @returns {number} Sum total in default currency
   */
  sumBalancesDefaultCurrency(defaultCurrency) {
    return this.bankAccountsCollection
      .computeBalances(this.incomesCollection, this.expensesCollection)
      .sumBalancesDefaultCurrency(defaultCurrency);
  }

  // ─── TRANSACTION ACTIONS ────────────────────────────────────────

  /**
   * saveTransaction
   * Validates, creates/updates, caches, and syncs a transaction.
   *
   * @param {string} formType - 'expense' | 'income'
   * @param {string|null} editingId - ID of the transaction if editing
   * @param {Object} txData - Raw transaction fields
   * @returns {Transaction} The newly saved Transaction instance
   */
  saveTransaction(formType, editingId, txData) {
    const newTx = new Transaction(txData);
    if (!newTx.isValid()) {
      throw new Error('Please enter a valid amount.');
    }

    if (formType === 'income') {
      let updated;
      const currentIncomes = this.incomes;
      if (editingId) {
        updated = currentIncomes.map(i => i.id === editingId ? newTx : i);
      } else {
        updated = [newTx, ...currentIncomes];
      }
      this.incomes = updated;
      syncIncomes(updated.map(i => i.toJSON()));
    } else {
      let updated;
      const currentExpenses = this.expenses;
      if (editingId) {
        updated = currentExpenses.map(e => e.id === editingId ? newTx : e);
      } else {
        updated = [newTx, ...currentExpenses];
      }
      this.expenses = updated;
      syncExpenses(updated.map(e => e.toJSON()));
    }
    return newTx;
  }

  /**
   * deleteTransaction
   * Deletes a transaction by ID, updates local cache, and triggers DB sync.
   *
   * @param {string} formType - 'expense' | 'income'
   * @param {string} id - The transaction ID to remove
   */
  deleteTransaction(formType, id) {
    if (formType === 'income') {
      const updated = this.incomes.filter(i => i.id !== id);
      this.incomes = updated;
      syncIncomes(updated.map(i => i.toJSON()));
    } else {
      const updated = this.expenses.filter(e => e.id !== id);
      this.expenses = updated;
      syncExpenses(updated.map(e => e.toJSON()));
    }
  }

  // ─── BANK ACCOUNT ACTIONS ───────────────────────────────────────

  /**
   * saveBankAccount
   * Adds or updates a bank account / credit card, validating the input fields.
   *
   * @param {string|null} editingId - ID of the bank account if editing
   * @param {Object} bankData - Raw bank fields
   * @returns {BankAccount} The newly saved BankAccount instance
   */
  saveBankAccount(editingId, bankData) {
    const newBank = new BankAccount(bankData);
    if (!newBank.isValid()) {
      throw new Error('Please enter a valid bank name.');
    }

    let updated;
    const currentBanks = this.bankAccounts;
    if (editingId) {
      updated = currentBanks.map(b => b.id === editingId ? newBank : b);
    } else {
      updated = [...currentBanks, newBank];
    }
    this.bankAccounts = updated;
    const serialized = updated.map(b => b.toJSON());
    localStorage.setItem('budget_bank_accounts', JSON.stringify(serialized));
    syncBankAccounts(serialized);
    return newBank;
  }

  /**
   * deleteBankAccount
   * Permanently deletes a bank account and cleans up local storage.
   *
   * @param {string} id - The bank account ID to delete
   */
  deleteBankAccount(id) {
    const updated = this.bankAccounts.filter(b => b.id !== id);
    this.bankAccounts = updated;
    const serialized = updated.map(b => b.toJSON());
    localStorage.setItem('budget_bank_accounts', JSON.stringify(serialized));
    syncBankAccounts(serialized);
  }
}
