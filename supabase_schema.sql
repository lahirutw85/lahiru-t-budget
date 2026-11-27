-- ============================================================
-- LT BUDGET MASTER — Supabase Database Schema
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================

-- 1. Expenses table
create table if not exists public.expenses (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date text not null default '',
  category text not null default '',
  sub_category text not null default '',
  amount numeric not null default 0,
  account text not null default 'Cash',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 2. Incomes table
create table if not exists public.incomes (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date text not null default '',
  category text not null default '',
  sub_category text not null default '',
  amount numeric not null default 0,
  account text not null default 'Cash',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 3. Bank Accounts table
create table if not exists public.bank_accounts (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 4. User Settings & Currencies table
create table if not exists public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  currencies jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS) — Users can only access own data
-- ============================================================
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.user_settings enable row level security;

create policy "Users manage own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own incomes"
  on public.incomes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own bank accounts"
  on public.bank_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
