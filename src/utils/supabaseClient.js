import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const hasSupabase = () =>
  Boolean(
    SUPABASE_URL &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('YOUR_')
  );

export const supabase = hasSupabase()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
