// ================================================================
// TransactionCollection.js — Transaction Collection Model Class
// ================================================================
// Encapsulates a group of transactions (incomes or expenses) and
// provides OOP query, aggregation, conversion, and filtering methods.
// ================================================================

import { Transaction } from './Transaction';

export class TransactionCollection {
  /**
   * Creates a new TransactionCollection instance.
   * @param {Array<Transaction|Object>} items - List of transactions
   */
  constructor(items = []) {
    this.items = Array.isArray(items)
      ? items.map(item => item instanceof Transaction ? item : new Transaction(item))
      : [];
  }

  /**
   * Returns a new TransactionCollection filtered by year and month.
   * @param {string} year - The target year
   * @param {string} month - The target month name or 'Full Year'
   * @param {Array<string>} monthsList - The array of month names (to map index)
   * @returns {TransactionCollection}
   */
  filterByPeriod(year, month, monthsList) {
    const filtered = this.items.filter(tx => {
      if (!tx.date) return false;
      const parts = tx.date.split('-');
      if (parts.length !== 3) return false;
      const txYear = parts[0];
      if (month === 'Full Year') return txYear === year;
      const txMonthIndex = parseInt(parts[1], 10) - 1;
      const txMonth = monthsList[txMonthIndex];
      return txYear === year && txMonth === month;
    });
    return new TransactionCollection(filtered);
  }

  /**
   * Sums transaction amounts by currency.
   * @returns {Object} Key-value pair of currency code to total amount
   */
  sumByCurrency() {
    return this.items.reduce((acc, tx) => {
      const cur = tx.currency || 'AED';
      acc[cur] = (acc[cur] || 0) + tx.amount;
      return acc;
    }, {});
  }

  /**
   * Calculates the total amount of all transactions converted to a default currency.
   * @param {string} defaultCurrency - Target currency code
   * @returns {number} Sum total in default currency
   */
  totalInCurrency(defaultCurrency) {
    return this.items.reduce((sum, tx) => {
      return sum + tx.getConvertedAmount(defaultCurrency);
    }, 0);
  }

  /**
   * Groups total amounts by category converted to a default currency.
   * @param {string} defaultCurrency - Target currency code
   * @returns {Object} Key-value pair of category to sum in default currency
   */
  categoryTotalsInCurrency(defaultCurrency) {
    return this.items.reduce((groups, tx) => {
      const cat = tx.category || 'Other';
      const converted = tx.getConvertedAmount(defaultCurrency);
      groups[cat] = (groups[cat] || 0) + converted;
      return groups;
    }, {});
  }

  /**
   * Groups transaction amounts by category AND currency.
   * @returns {Object} e.g. { 'Home/Rent': { 'LKR': 5000, 'AED': 200 }, ... }
   */
  groupByCategoryAndCurrency() {
    return this.items.reduce((acc, tx) => {
      const cat = tx.category || 'Other';
      const cur = tx.currency || 'AED';
      if (!acc[cat]) acc[cat] = {};
      acc[cat][cur] = (acc[cat][cur] || 0) + tx.amount;
      return acc;
    }, {});
  }

  /**
   * Filters transactions that are paid via Cash (not Bank Account or Credit Card).
   * @returns {TransactionCollection}
   */
  filterCash() {
    const filtered = this.items.filter(tx => {
      const accType = tx.account || 'Cash';
      return accType !== 'Bank Account' && accType !== 'Credit Card';
    });
    return new TransactionCollection(filtered);
  }

  /**
   * Generic filter method returning a new TransactionCollection.
   * @param {Function} predicate - Filter function
   * @returns {TransactionCollection} New collection instance
   */
  filter(predicate) {
    return new TransactionCollection(this.items.filter(predicate));
  }

  /**
   * Gets the unique currencies present in this collection.
   * @returns {Array<string>} Unique currency codes
   */
  getUniqueCurrencies() {
    return Array.from(new Set(this.items.map(tx => tx.currency || 'AED')));
  }

  /**
   * Returns a copy of the raw array of transaction instances.
   * @returns {Array<Transaction>}
   */
  toArray() {
    return [...this.items];
  }

  /**
   * Serializes the collection to an array of plain JS objects.
   * @returns {Array<Object>}
   */
  toJSON() {
    return this.items.map(tx => tx.toJSON());
  }
}
