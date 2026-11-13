import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../api'
import AuthForm from '../components/AuthForm'
import { firebaseMessage, signIn, signOutFirebase } from '../auth/firebase'
import { createSession } from '../auth/session'
import { h1, muted } from '../ui'

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      <h1 className={h1}>{t('auth.login.title')}</h1>
      <AuthForm
        submitLabel={t('auth.login.submit')}
        busy={busy}
        error={error}
        onSubmit={handleSubmit}
        passwordAutocomplete="current-password"
        passwordPlaceholder={t('auth.password')}
      />
      <p className={muted}>
        {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.registerNow')}</Link>
      </p>
    </>
  )
}
