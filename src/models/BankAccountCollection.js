// ================================================================
// BankAccountCollection.js — Bank Account Collection Model Class
// ================================================================
// Encapsulates a group of bank accounts and provides OOP methods to
// batch-compute balances, sum by currency, and aggregate totals.
// ================================================================

import { BankAccount } from './BankAccount';
import { convertCurrency } from '../utils/currencyUtils';

export class BankAccountCollection {
  /**
   * Creates a new BankAccountCollection instance.
   * @param {Array<BankAccount|Object>} items - List of bank accounts
   */
  constructor(items = []) {
    this.items = Array.isArray(items)
      ? items.map(item => item instanceof BankAccount ? item : new BankAccount(item))
      : [];
  }

  /**
   * Computes the adjusted dynamic balances for all bank accounts
   * by applying matching transactions from the given transaction lists.
   * @param {Array|Object} incomes - Incomes to apply
   * @param {Array|Object} expenses - Expenses to apply
   * @returns {BankAccountCollection} A new collection with computed bank accounts
   */
  computeBalances(incomes = [], expenses = []) {
    const rawIncomes = incomes.toArray ? incomes.toArray() : incomes;
    const rawExpenses = expenses.toArray ? expenses.toArray() : expenses;

    const computed = this.items.map(bank => bank.computeBalance(rawIncomes, rawExpenses));
    return new BankAccountCollection(computed);
  }

  /**
   * Group all bank account balances by currency (excluding credit cards).
   * @returns {Object} Key-value pair of currency code to total bank balance
   */
  sumBalancesByCurrency() {
    return this.items.reduce((acc, bank) => {
      if (bank.accountType !== 'Credit Card') {
        const cur = bank.currency || 'LKR';
        acc[cur] = (acc[cur] || 0) + (bank.balance || 0);
      }
      return acc;
    }, {});
  }

  /**
   * Converts and sums all bank balances (excluding credit cards) into a target currency.
   * @param {string} targetCurrency - The destination currency code
   * @returns {number} Total sum in target currency
   */
  sumBalancesDefaultCurrency(targetCurrency) {
    return this.items.reduce((sum, bank) => {
      if (bank.accountType !== 'Credit Card') {
        const bankBalance = bank.balance || 0;
        const converted = convertCurrency(bankBalance, bank.currency || 'LKR', targetCurrency);
        return sum + converted;
      }
      return sum;
    }, 0);
  }

  /**
   * Returns a copy of the raw array of bank account instances.
   * @returns {Array<BankAccount>}
   */
  toArray() {
    return [...this.items];
  }

  /**
   * Serializes the collection to an array of plain JS objects.
   * @returns {Array<Object>}
   */
  toJSON() {
    return this.items.map(bank => bank.toJSON());
  }
}
