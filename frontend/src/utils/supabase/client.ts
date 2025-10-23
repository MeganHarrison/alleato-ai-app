import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging (remove in production)
if (typeof window !== 'undefined') {
  console.log('Supabase client initialization:')
  console.log('URL from env:', supabaseUrl ? 'Set' : 'Not set')
  console.log('Anon key from env:', supabaseAnonKey ? 'Set' : 'Not set')
}

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
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}