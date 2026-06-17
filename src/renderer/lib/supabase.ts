import { createClient } from '@supabase/supabase-js'

// Single Supabase client for the desktop renderer. The publishable key is a public
// browser key; the database is protected by Row-Level Security, not by hiding it.
// supabase-js persists the session in the renderer's localStorage (Electron userData),
// so the desktop stays signed in across launches.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey || url.includes('YOUR-PROJECT')) {
  console.warn(
    '[nanoblock] Supabase env not configured. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (Supabase → Project Settings → API).',
  )
}

// Fallbacks keep createClient from throwing when env is missing (tests, first-run
// before .env is filled). Real calls will fail clearly until the env is configured.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  publishableKey || 'placeholder-publishable-key',
)
