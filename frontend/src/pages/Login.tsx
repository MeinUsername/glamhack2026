import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api'
import AuthForm from '../components/AuthForm'
import { firebaseMessage, signIn, signOutFirebase } from '../auth/firebase'
import { createSession } from '../auth/session'
import { h1, muted } from '../ui'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(email: string, password: string) {
    setError('')
    setBusy(true)
    try {
      const user = await signIn(email.trim(), password)
      await createSession(await user.getIdToken())
      navigate('/dashboard')
    } catch (err) {
      // The server refused the session (for example a blocked account): drop the Firebase sign-in too.
      await signOutFirebase().catch(() => {})
      setError(err instanceof ApiError ? err.message : firebaseMessage(err))
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className={h1}>Anmelden</h1>
      <AuthForm
        submitLabel="Anmelden"
        busy={busy}
        error={error}
        onSubmit={handleSubmit}
        passwordAutocomplete="current-password"
        passwordPlaceholder="Passwort"
      />
      <p className={muted}>
        Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
      </p>
    </>
  )
}
