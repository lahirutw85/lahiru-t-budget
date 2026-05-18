// ============================================================
// BANK CONSTANTS
// ============================================================
// These lists are used in the "Bank Name" and "Branch" dropdowns
// when adding or editing Bank Accounts or Transactions.
//
// Rules for filtering in the transaction modal:
//   - If currency = LKR  → show SRI_LANKA_BANKS
//   - If currency = AED  → show UAE_BANKS
//   - Bank Account type  → show only Savings/Current accounts
//   - Credit Card type   → show only Credit Card accounts
// ============================================================

// Default Sri Lankan bank list — shown when currency is LKR
export const SRI_LANKA_BANKS = [
  'Bank of Ceylon (BOC)',
  'Commercial Bank of Ceylon',
  'Sampath Bank',
  'Hatton National Bank (HNB)',
  "People's Bank",
  'Seylan Bank',
  'Nations Trust Bank (NTB)',
];

// Default UAE bank list — shown when currency is AED
export const UAE_BANKS = [
  'Emirates NBD',
  'Abu Dhabi Commercial Bank (ADCB)',
  'First Abu Dhabi Bank (FAB)',
  'Dubai Islamic Bank (DIB)',
  'Mashreq Bank',
  'Abu Dhabi Islamic Bank (ADIB)',
];

// Branch options for Sri Lankan banks
export const SRI_LANKA_BRANCHES = [
  'Colombo Main',
  'Kandy',
  'Galle',
  'Gampaha',
  'Negombo',
  'Jaffna',
  'Kurunegala',
  'Batticaloa',
  'Trincomalee',
];

// Branch options for UAE banks
export const UAE_BRANCHES = [
  'Dubai (Main)',
  'Abu Dhabi',
  'Sharjah',
  'Al Ain',
  'Ajman',
  'Marina (Dubai)',
  'Jumeirah (Dubai)',
];
