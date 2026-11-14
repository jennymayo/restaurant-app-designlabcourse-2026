import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

/**
 * useAuth: who is signed in?
 *
 * Uses Supabase Auth with email + password. Supabase remembers the sign-in in
 * the browser, so refreshing the page keeps you signed in.
 *
 * If Supabase isn't configured (no .env.local), there's no sign-in at all and
 * `needsAuth` is false: the app just uses browser storage.
 */

/** What the sign-in / sign-up functions tell the screen. */
export interface AuthResult {
  /** A message to show if something went wrong, otherwise null. */
  error: string | null
  /** Sign-up worked but Supabase wants the email confirmed before signing in. */
  needsEmailConfirmation?: boolean
}

/** Turn Supabase's technical messages into friendlier ones. */
function friendlyMessage(message: string): string {
  const text = message.toLowerCase()
  if (text.includes('invalid login credentials')) return "That email and password don't match."
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'An account with that email already exists. Try signing in instead.'
  }
  if (text.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link.'
  if (text.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.'
  return message
}

export function useAuth() {
  const needsAuth = supabase !== null
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(needsAuth) // true until we know if someone is signed in

  useEffect(() => {
    if (!supabase) return

    // 1. Is someone already signed in from an earlier visit?
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    // 2. Keep up to date when they sign in or out.
    // (Only set state in here. Don't call other Supabase functions from it.)
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Sign-in is not set up.' }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: friendlyMessage(error.message) }
    // No session yet means Supabase is waiting for the email to be confirmed.
    return { error: null, needsEmailConfirmation: data.session === null }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Sign-in is not set up.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? friendlyMessage(error.message) : null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  return {
    needsAuth,
    isLoading,
    isSignedIn: session !== null,
    email: session?.user.email ?? null,
    signUp,
    signIn,
    signOut,
  }
}
