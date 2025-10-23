import { createBrowserClient, createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

/**
 * Creates a Supabase client appropriate for the current execution environment.
 */
export function createSupabaseClient() {
  const isBrowser = typeof window !== 'undefined'

  if (isBrowser) {
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
