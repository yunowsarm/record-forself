import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/report'

const user = ref<User | null>(null)
const session = ref<Session | null>(null)
const profile = ref<Profile | null>(null)
const loading = ref(true)

let initialized = false

async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Failed to load profile:', error.message)
    profile.value = null
    return
  }
  profile.value = data
}

export async function initAuth() {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  user.value = data.session?.user ?? null
  if (user.value) {
    await loadProfile(user.value.id)
  }
  loading.value = false

  if (!initialized) {
    initialized = true
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      if (user.value) {
        await loadProfile(user.value.id)
      } else {
        profile.value = null
      }
    })
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => !!session.value)

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated,
    initAuth,
    signUp,
    signIn,
    signOut,
  }
}
