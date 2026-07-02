import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

const PLACEHOLDER_KEYS = new Set(['your-anon-key', 'your-publishable-key'])

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseKey) &&
  !supabaseUrl.includes('your-project') &&
  !(supabaseKey && PLACEHOLDER_KEYS.has(supabaseKey))

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Supabase 未配置：请在 .env.local 中填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY，然后重启 pnpm dev'

if (!isSupabaseConfigured) {
  console.error(supabaseConfigError)
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')
