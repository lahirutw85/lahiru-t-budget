// ============================================================
// DATA SYNC — Supabase (Primary) + Google Apps Script (Fallback)
// ============================================================
// Priority:
//   1. Supabase (when VITE_SUPABASE_URL/KEY configured & user signed in)
//   2. Google Apps Script (GAS) Web App (fallback when Supabase unavailable)
//   3. localStorage (offline cache)
// ============================================================

import { supabase, hasSupabase } from './supabaseClient';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';
const hasGAS = () => Boolean(GAS_URL && GAS_URL.startsWith('https://'));

export const safeJsonParse = (raw, fallback) => {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

// ── Supabase Auth Helper ─────────────────────────────────────
const getSupabaseUser = async () => {
  if (!hasSupabase() || !supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch (err) {
    console.warn('[Supabase Auth]', err.message);
    return null;
  }
};

// Delete rows in a Supabase table whose IDs are no longer in `currentIds`
const pruneDeletedRows = async (tableName, userId, currentIds) => {
  const { data: existing, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('user_id', userId);
  if (error || !existing) return;

  const keepSet = new Set(currentIds);
  const staleIds = existing.map(r => r.id).filter(id => !keepSet.has(id));
  if (staleIds.length > 0) {
    await supabase
      .from(tableName)
      .delete()
      .eq('user_id', userId)
      .in('id', staleIds);
  }
};

// ── Shared Transaction Table Helpers (expenses / incomes) ────
const syncTransactionTable = async (tableName, items) => {
  const user = await getSupabaseUser();
  if (!user) return false;
  try {
    const rows = (items || []).map(item => ({
      id: String(item.id),
      user_id: user.id,
      date: item.date || '',
      category: item.category || '',
      sub_category: item.subCategory || '',
      amount: Number(item.amount) || 0,
      account: item.account || 'Cash',
      notes: item.notes || '',
      updated_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from(tableName)
        .upsert(rows, { onConflict: 'user_id,id' });
      if (error) throw error;
    }
    await pruneDeletedRows(tableName, user.id, rows.map(r => r.id));
    return true;
  } catch (err) {
    console.warn(`[Supabase SYNC:${tableName}]`, err.message);
    return false;
  }
};

const fetchTransactionTable = async (tableName) => {
  const user = await getSupabaseUser();
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, date, category, sub_category, amount, account, notes')
      .eq('user_id', user.id);
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      date: row.date || '',
      category: row.category || '',
      subCategory: row.sub_category || '',
      amount: Number(row.amount) || 0,
      account: row.account || 'Cash',
      notes: row.notes || '',
    }));
  } catch (err) {
    console.warn(`[Supabase GET:${tableName}]`, err.message);
    return null;
  }
};

// ── Shared POST to GAS ───────────────────────────────────────
const gasPost = async (payload) => {
  if (!hasGAS()) return;
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[GAS POST]', err.message);
  }
};

// ── Shared GET from GAS ──────────────────────────────────────
const gasGet = async (sheet) => {
  if (!hasGAS()) return null;
  try {
    const res = await fetch(`${GAS_URL}?sheet=${sheet}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn(`[GAS GET:${sheet}]`, err.message);
  }
  return null;
};

// ── EXPENSES ─────────────────────────────────────────────────
export const syncExpenses = async (data) => {
  localStorage.setItem('budget_expenses', JSON.stringify(data));
  await syncTransactionTable('expenses', data);
  await gasPost({ sheet: 'expenses', expenses: data });
};

export const fetchExpenses = async () => {
  const sbData = await fetchTransactionTable('expenses');
  if (sbData !== null) {
    localStorage.setItem('budget_expenses', JSON.stringify(sbData));
    return sbData;
  }
  const cloud = await gasGet('expenses');
  if (cloud !== null) {
    localStorage.setItem('budget_expenses', JSON.stringify(cloud));
    return cloud;
  }
  return safeJsonParse(localStorage.getItem('budget_expenses'), []);
};

// ── INCOMES ──────────────────────────────────────────────────
export const syncIncomes = async (data) => {
  localStorage.setItem('budget_incomes', JSON.stringify(data));
  await syncTransactionTable('incomes', data);
  await gasPost({ sheet: 'incomes', incomes: data });
};

export const fetchIncomes = async () => {
  const sbData = await fetchTransactionTable('incomes');
  if (sbData !== null) {
    localStorage.setItem('budget_incomes', JSON.stringify(sbData));
    return sbData;
  }
  const cloud = await gasGet('incomes');
  if (cloud !== null) {
    localStorage.setItem('budget_incomes', JSON.stringify(cloud));
    return cloud;
  }
  return safeJsonParse(localStorage.getItem('budget_incomes'), []);
};

// ── BANK ACCOUNTS ────────────────────────────────────────────
export const syncBankAccounts = async (data) => {
  localStorage.setItem('budget_bank_accounts', JSON.stringify(data));
  const user = await getSupabaseUser();
  if (user) {
    try {
      const rows = (data || []).map(acc => ({
        id: String(acc.id),
        user_id: user.id,
        data: acc,
        updated_at: new Date().toISOString(),
      }));
      if (rows.length > 0) {
        const { error } = await supabase
          .from('bank_accounts')
          .upsert(rows, { onConflict: 'user_id,id' });
        if (error) throw error;
      }
      await pruneDeletedRows('bank_accounts', user.id, rows.map(r => r.id));
    } catch (err) {
      console.warn('[Supabase SYNC:bank_accounts]', err.message);
    }
  }
  await gasPost({ sheet: 'bankaccounts', bankAccounts: data });
};

export const fetchBankAccounts = async () => {
  const user = await getSupabaseUser();
  if (user) {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('data')
        .eq('user_id', user.id);
      if (error) throw error;
      const accounts = (data || []).map(r => r.data).filter(Boolean);
      if (accounts.length > 0) {
        localStorage.setItem('budget_bank_accounts', JSON.stringify(accounts));
        return accounts;
      }
    } catch (err) {
      console.warn('[Supabase GET:bank_accounts]', err.message);
    }
  }
  const cloud = await gasGet('bankaccounts');
  if (cloud !== null) {
    localStorage.setItem('budget_bank_accounts', JSON.stringify(cloud));
    return cloud;
  }
  return safeJsonParse(localStorage.getItem('budget_bank_accounts'), null);
};

// ── CURRENCIES ───────────────────────────────────────────────
export const syncCurrencies = async (data) => {
  localStorage.setItem('budget_currencies', JSON.stringify(data));
  const user = await getSupabaseUser();
  if (user) {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: user.id, currencies: data, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    } catch (err) {
      console.warn('[Supabase SYNC:currencies]', err.message);
    }
  }
  await gasPost({ sheet: 'currencies', currencies: data });
};

export const fetchCurrencies = async () => {
  const user = await getSupabaseUser();
  if (user) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('currencies')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (Array.isArray(data?.currencies) && data.currencies.length > 0) {
        localStorage.setItem('budget_currencies', JSON.stringify(data.currencies));
        return data.currencies;
      }
    } catch (err) {
      console.warn('[Supabase GET:currencies]', err.message);
    }
  }
  const cloud = await gasGet('currencies');
  if (cloud !== null && cloud.length > 0) {
    localStorage.setItem('budget_currencies', JSON.stringify(cloud));
    return cloud;
  }
  return safeJsonParse(localStorage.getItem('budget_currencies'), null);
};

// ── APP SETTINGS (customBanks, customTypes, customBranches, plannedBudget, bills, recurringIncomes) ──
export const syncSettings = async (data) => {
  localStorage.setItem('budget_settings', JSON.stringify(data));
  const user = await getSupabaseUser();
  if (user) {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: user.id, settings: data, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    } catch (err) {
      console.warn('[Supabase SYNC:settings]', err.message);
    }
  }
  await gasPost({ sheet: 'settings', settings: data });
};

export const fetchSettings = async () => {
  const user = await getSupabaseUser();
  if (user) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data?.settings && Object.keys(data.settings).length > 0) {
        localStorage.setItem('budget_settings', JSON.stringify(data.settings));
        return data.settings;
      }
    } catch (err) {
      console.warn('[Supabase GET:settings]', err.message);
    }
  }
  const cloud = await gasGet('settings');
  if (cloud !== null && cloud.length > 0) {
    const obj = {};
    cloud.forEach(row => {
      if (row.key) obj[row.key] = safeJsonParse(row.value || '[]', []);
    });
    if (Object.keys(obj).length > 0) {
      localStorage.setItem('budget_settings', JSON.stringify(obj));
      return obj;
    }
  }
  return safeJsonParse(localStorage.getItem('budget_settings'), {});
};
