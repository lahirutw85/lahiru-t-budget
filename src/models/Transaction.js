// ================================================================
// Transaction.js — Transaction Model Class
// ================================================================
// Encapsulates the properties and business logic for a single
// financial transaction (either an Expense or an Income).
// Handles parsing, formatting, conversions, and validation.
// ================================================================

import { convertCurrency } from '../utils/currencyUtils';

export class Transaction {
  /**
   * Creates a new Transaction instance.
   * @param {Object} data - Initial transaction data
   */
  constructor(data = {}) {
    this.id = data.id || Date.now().toString();
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.category = data.category || 'General';
    this.subCategory = data.subCategory || 'General';
    this.amount = parseFloat(data.amount || 0);
    this.currency = data.currency || 'AED';
    this.account = data.account || 'Cash'; // e.g. 'Bank Account' | 'Credit Card' | 'Cash'
    this.bankName = data.bankName || '';   // e.g. 'Commercial Bank of Ceylon (Savings - Hingurakgoda - Acc: 8150001)'
    this.notes = data.notes || '';
    this.icon = data.icon || null;
  }

  /**
   * Validates if the transaction has a positive non-zero amount.
   * @returns {boolean} True if the transaction is valid
   */
  isValid() {
    return this.amount > 0 && !isNaN(this.amount);
  }

  /**
   * Converts the transaction amount to a target currency.
   * @param {string} toCurrency - Destination ISO currency code (e.g. 'LKR')
   * @returns {number} Converted amount value
   */
  getConvertedAmount(toCurrency) {
    return convertCurrency(this.amount, this.currency, toCurrency);
  }

  /**
   * Serializes the transaction to a plain JavaScript object suitable for state / JSON.
   * @returns {Object} Plain object representation of the transaction
   */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      category: this.category,
      subCategory: this.subCategory,
      amount: this.amount,
      currency: this.currency,
      account: this.account,
      bankName: this.bankName,
      notes: this.notes,
      icon: this.icon,
    };
  }
}
