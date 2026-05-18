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
import { syncExpenses, syncIncomes, syncBankAccounts } from '../utils/dataSync';

export class BudgetService {
  /**
   * Initializes the BudgetService with transaction lists and bank accounts.
   * @param {Array<Object>} expensesList - Initial list of expenses
   * @param {Array<Object>} incomesList - Initial list of incomes
   * @param {Array<Object>} bankAccountsList - Initial list of bank accounts
   */
  constructor(expensesList = [], incomesList = [], bankAccountsList = []) {
    this.expenses = Array.isArray(expensesList) ? expensesList.map(e => new Transaction(e)) : [];
    this.incomes = Array.isArray(incomesList) ? incomesList.map(i => new Transaction(i)) : [];
    this.bankAccounts = Array.isArray(bankAccountsList) ? bankAccountsList.map(b => new BankAccount(b)) : [];
  }

  // ─── GETTERS & DERIVED CALCULATIONS ─────────────────────────────

  /**
   * getComputedBankAccounts
   * Evaluates all transaction logs against bank accounts to calculate current
   * real-time dynamic balances and credit remaining limits.
   * @returns {Array<BankAccount>} List of computed BankAccount instances
   */
  getComputedBankAccounts() {
    return this.bankAccounts.map(bank => bank.computeBalance(this.incomes, this.expenses));
  }

  /**
   * sumBalancesByCurrency
   * Group all computed bank account balances by currency (excluding credit cards).
   * @returns {Object} Key-value pair of currency code to total balance (e.g. { LKR: 25000, AED: 4500 })
   */
  sumBalancesByCurrency() {
    const computed = this.getComputedBankAccounts();
    return computed.reduce((acc, bank) => {
      if (bank.accountType !== 'Credit Card') {
        const cur = bank.currency || 'LKR';
        acc[cur] = (acc[cur] || 0) + (bank.balance || 0);
      }
      return acc;
    }, {});
  }

  /**
   * sumBalancesDefaultCurrency
   * Converts and sums all computed bank balances into a single default currency.
   * @param {string} defaultCurrency - The target default currency code (e.g., 'LKR')
   * @returns {number} Sum total in default currency
   */
  sumBalancesDefaultCurrency(defaultCurrency) {
    const computed = this.getComputedBankAccounts();
    return computed.reduce((sum, bank) => {
      if (bank.accountType !== 'Credit Card') {
        const bankBalance = bank.balance || 0;
        const converted = bank.currency === defaultCurrency
          ? bankBalance
          : new Transaction({ amount: bankBalance, currency: bank.currency }).getConvertedAmount(defaultCurrency);
        return sum + converted;
      }
      return sum;
    }, 0);
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
      if (editingId) {
        updated = this.incomes.map(i => i.id === editingId ? newTx : i);
      } else {
        updated = [newTx, ...this.incomes];
      }
      this.incomes = updated;
      syncIncomes(updated.map(i => i.toJSON()));
    } else {
      let updated;
      if (editingId) {
        updated = this.expenses.map(e => e.id === editingId ? newTx : e);
      } else {
        updated = [newTx, ...this.expenses];
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
    if (editingId) {
      updated = this.bankAccounts.map(b => b.id === editingId ? newBank : b);
    } else {
      updated = [...this.bankAccounts, newBank];
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
