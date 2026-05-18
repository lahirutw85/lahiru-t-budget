// ================================================================
// BankAccount.js — Bank Account Model Class
// ================================================================
// Represents a registered bank account (Savings/Current) or Credit Card.
// Responsible for calculating the adjusted balances based on transaction history,
// managing multiple account numbers, and validating fields.
// ================================================================

export class BankAccount {
  /**
   * Creates a new BankAccount instance.
   * @param {Object} data - Initial bank account data
   */
  constructor(data = {}) {
    this.id = data.id || Date.now().toString();
    this.country = data.country || 'Sri Lanka';
    this.bankName = data.bankName || '';
    this.accountType = data.accountType || 'Savings'; // 'Savings' | 'Current' | 'Credit Card'
    this.currency = data.currency || 'LKR';
    this.branch = data.branch || '';
    this.balance = parseFloat(data.balance || 0); // Base balance
    this.limit = parseFloat(data.limit || 0);
    this.remainingLimit = parseFloat(data.remainingLimit || 0);
    this.accountNumbers = Array.isArray(data.accountNumbers) ? [...data.accountNumbers] : [''];
    this.balances = Array.isArray(data.balances) ? [...data.balances] : [''];
  }

  /**
   * Returns a friendly display name containing the bank name, account type, and branch.
   * Example: "Commercial Bank of Ceylon (Savings - Hingurakgoda)"
   * @returns {string} Displays bank details
   */
  getDisplayName() {
    let details = this.accountType;
    if (this.branch) details += ` - ${this.branch}`;
    return `${this.bankName} (${details})`;
  }

  /**
   * Checks if the bank account details are valid (requires at least a bank name).
   * @returns {boolean} True if the bank account is valid
   */
  isValid() {
    return this.bankName && this.bankName.trim().length > 0;
  }

  /**
   * OOP Core Computation: Computes the adjusted dynamic balances for the account
   * by adding all matching incomes and subtracting matching expenses, accurately mapping to
   * the specific account number when indicated.
   *
   * @param {Array<Object>} incomes - List of raw or modeled incomes
   * @param {Array<Object>} expenses - List of raw or modeled expenses
   * @returns {BankAccount} A new BankAccount instance containing the adjusted balances
   */
  computeBalance(incomes = [], expenses = []) {
    let totalAdjust = 0;
    
    // Copy the original base balances so we can adjust them individually
    let updatedBalances = this.balances ? this.balances.map(b => parseFloat(b || 0)) : [];
    
    // Ensure updatedBalances has the same length as accountNumbers
    const numAccs = (this.accountNumbers && this.accountNumbers.length > 0) ? this.accountNumbers.length : 1;
    while (updatedBalances.length < numAccs) {
      updatedBalances.push(0);
    }

    const processTransaction = (tx, type) => {
      if (tx.bankName && (tx.account === 'Bank Account' || tx.account === 'Credit Card')) {
        let expected = this.bankName;
        let detailVal = this.accountType;
        if (this.branch) detailVal += ` - ${this.branch}`;
        
        let expectedBase = `${this.bankName} (${detailVal}`.trim().toLowerCase();
        let txBankNameLower = tx.bankName.trim().toLowerCase();

        if (txBankNameLower.startsWith(expectedBase)) {
          const amount = type === 'income' ? tx.amount : -tx.amount;
          totalAdjust += amount;

          // Check if a specific account number was selected in tx.bankName
          let matchedIndex = -1;
          if (this.accountNumbers && this.accountNumbers.length > 0) {
            for (let i = 0; i < this.accountNumbers.length; i++) {
              const accNo = this.accountNumbers[i];
              if (accNo && txBankNameLower.includes(`acc: ${accNo.trim().toLowerCase()}`)) {
                matchedIndex = i;
                break;
              }
            }
          }

          // If a specific account number was matched, adjust its balance
          if (matchedIndex !== -1) {
            updatedBalances[matchedIndex] = (parseFloat(updatedBalances[matchedIndex]) || 0) + amount;
          } else {
            // Otherwise, fallback to the first account's balance
            if (updatedBalances.length > 0) {
              updatedBalances[0] = (parseFloat(updatedBalances[0]) || 0) + amount;
            }
          }
        }
      }
    };

    // Process all incomes and expenses
    incomes.forEach(inc => processTransaction(inc, 'income'));
    expenses.forEach(exp => processTransaction(exp, 'expense'));

    if (this.accountType === 'Credit Card') {
      const remainingLimit = (this.remainingLimit ?? this.limit ?? 0) + totalAdjust;
      return new BankAccount({
        ...this.toJSON(),
        remainingLimit: Math.max(0, remainingLimit)
      });
    } else {
      const newBalance = (this.balance || 0) + totalAdjust;
      return new BankAccount({
        ...this.toJSON(),
        balance: newBalance,
        balances: updatedBalances
      });
    }
  }

  /**
   * Serializes the bank account instance to a plain JavaScript object.
   * @returns {Object} Plain object representation of the bank account
   */
  toJSON() {
    return {
      id: this.id,
      country: this.country,
      bankName: this.bankName,
      accountType: this.accountType,
      currency: this.currency,
      branch: this.branch,
      balance: this.balance,
      limit: this.limit,
      remainingLimit: this.remainingLimit,
      accountNumbers: this.accountNumbers,
      balances: this.balances
    };
  }
}
