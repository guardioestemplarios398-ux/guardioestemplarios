import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não configurada no Netlify.');
}

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY não configurada no Netlify.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
