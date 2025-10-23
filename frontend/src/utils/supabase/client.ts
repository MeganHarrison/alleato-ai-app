import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { createClient as createBrowserClient } from '@/lib/supabase/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = []
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file and ensure these variables are set.'
  )
}

export const createClient = () => {
  if (typeof window !== 'undefined') {
    return createBrowserClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
