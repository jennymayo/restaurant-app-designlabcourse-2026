import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { AuthResult } from '../hooks/useAuth'

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<AuthResult>
  onSignUp: (email: string, password: string) => Promise<AuthResult>
}

const MIN_PASSWORD_LENGTH = 8
const FIELD_CLASS = 'min-h-12 w-full rounded-2xl border-2 border-stone-300 bg-white px-4 text-base'

/**
 * The sign-in / create-account screen (email + password).
 * Shown instead of the app until someone is signed in.
 */
export function AuthScreen({ onSignIn, onSignUp }: AuthScreenProps) {
  const ids = useId()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)

  const isSignUp = mode === 'signUp'

  function switchMode() {
    setMode(isSignUp ? 'signIn' : 'signUp')
    setError(null)
    setNotice(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    // Quick checks before we bother the server.
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    setIsWorking(true)
    const result = isSignUp ? await onSignUp(email.trim(), password) : await onSignIn(email.trim(), password)
    setIsWorking(false)

    if (result.error) {
      setError(result.error)
    } else if (result.needsEmailConfirmation) {
      setNotice('Almost done! Check your email and tap the confirmation link, then sign in here.')
      setMode('signIn')
      setPassword('')
    }
    // On success with a session, the app swaps to the main screen by itself.
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-orange-800">Night Off</h1>
        <p className="mt-1 text-stone-700">Find the right place, fast.</p>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">{isSignUp ? 'Create your account' : 'Sign in'}</h2>

        {/* noValidate: we show our own friendly messages. */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor={`${ids}-email`} className="mb-1 block font-semibold">
              Email
            </label>
            <input
              id={`${ids}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor={`${ids}-password`} className="mb-1 block font-semibold">
              Password
              {isSignUp && (
                <span className="font-normal text-stone-600"> (at least {MIN_PASSWORD_LENGTH} characters)</span>
              )}
            </label>
            <input
              id={`${ids}-password`}
              type="password"
              // These hints let password managers save and fill the right thing.
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-red-50 p-3 font-medium text-red-900">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-2xl bg-emerald-50 p-3 font-medium text-emerald-900">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={isWorking}
            className="min-h-12 w-full rounded-full bg-orange-700 px-6 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-60"
          >
            {isWorking ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={switchMode}
          className="mt-4 min-h-11 w-full rounded-full text-base font-semibold text-orange-800 underline hover:bg-stone-100"
        >
          {isSignUp ? 'I already have an account' : 'New here? Create an account'}
        </button>
      </div>
    </div>
  )
}
