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
  : import.meta.env.PROD
    ? 'Supabase 未配置：请在 Netlify 站点环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY，然后重新部署'
    : 'Supabase 未配置：请在 .env.local 中填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY，然后重启 pnpm dev'

if (!isSupabaseConfigured) {
  console.error(supabaseConfigError)
}

// 未配置时使用占位值，避免 createClient('') 导致整页白屏；实际请求会在登录等处被拦截
const clientUrl = supabaseUrl || 'https://placeholder.supabase.co'
const clientKey =
  supabaseKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(clientUrl, clientKey)
