import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import AuthForm from '../components/AuthForm'
import { firebaseMessage, signIn, signOutFirebase } from '../auth/firebase'
import { createSession } from '../auth/session'
import { h1 } from '../ui'
import type { Me } from '../types'

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
      const me = await api<Me>('/api/me')
      navigate(me.role === 'admin' ? '/dashboard' : '/') // F-012 T3
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
    </>
  )
}
