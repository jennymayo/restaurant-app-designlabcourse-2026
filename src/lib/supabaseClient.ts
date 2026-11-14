import { createClient } from '@supabase/supabase-js'

/**
 * The one shared Supabase connection for the whole app.
 *
 * The address and public key come from `.env.local` (see `.env.example`).
 * Vite only exposes variables that start with VITE_ to the browser.
 *
 * If they're not filled in, `supabase` is null and the app falls back to
 * browser storage (see repository/index.ts).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase = url && key ? createClient(url, key) : null
