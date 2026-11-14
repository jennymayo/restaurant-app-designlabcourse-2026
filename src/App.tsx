import { AuthScreen } from './components/AuthScreen'
import { useAuth } from './hooks/useAuth'
import PlacesApp from './PlacesApp'

/**
 * The front door of the app.
 *
 *  - No Supabase set up  → go straight to the app (data stays in this browser).
 *  - Supabase, signed out → show the sign-in / create-account screen.
 *  - Supabase, signed in  → show the app.
 *
 * The main app is only created once someone is signed in, so it never tries
 * to load places before it's allowed to.
 */
export default function App() {
  const auth = useAuth()

  if (!auth.needsAuth) return <PlacesApp />

  if (auth.isLoading) {
    return <p className="p-8 text-center text-stone-700">Loading…</p>
  }

  if (!auth.isSignedIn) {
    return <AuthScreen onSignIn={auth.signIn} onSignUp={auth.signUp} />
  }

  return <PlacesApp userEmail={auth.email} onSignOut={auth.signOut} />
}
