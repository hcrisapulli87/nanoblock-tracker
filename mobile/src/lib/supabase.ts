import { createClient } from '@supabase/supabase-js'

// Single Supabase client for the phone PWA. The publishable key is a public browser key;
// the database is protected by Row-Level Security, not by hiding it. supabase-js persists
// the session in the PWA's localStorage, so an installed home-screen app stays signed in.
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

if (!url || !publishableKey || url.includes('YOUR-PROJECT')) {
  console.warn(
    '[nanoblock-mobile] Supabase env not configured. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY (Vercel env vars / local .env).',
  )
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  publishableKey || 'placeholder-publishable-key',
)
