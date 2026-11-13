import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../api'
import AuthForm from '../components/AuthForm'
import { firebaseMessage, signOutFirebase, signUp } from '../auth/firebase'
import { inviteUsable, registerAccount } from '../auth/session'
import { h1, muted } from '../ui'

export default function Register() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const invite = params.get('invite') ?? ''
  const [inviteOk, setInviteOk] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // With a link, check it before any account is created. Without a link, registration is open.
  useEffect(() => {
    if (!invite) return
    let active = true
    inviteUsable(invite)
      .then((ok) => {
        if (!active) return
        setInviteOk(ok)
        if (!ok) setError(t('auth.inviteInvalid'))
      })
      .catch(() => {
        if (!active) return
        setInviteOk(false)
        setError(t('auth.inviteInvalid'))
      })
    return () => {
      active = false
    }
  }, [invite])

  async function handleSubmit(email: string, password: string) {
    setError('')
    setBusy(true)
    try {
      const user = await signUp(email.trim(), password)
      await registerAccount(await user.getIdToken(), invite)
      navigate('/dashboard')
    } catch (err) {
      // The server removes a new account when the link is invalid; the local sign-in goes too.
      await signOutFirebase().catch(() => {})
      setError(err instanceof ApiError ? err.message : firebaseMessage(err))
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className={h1}>{t('auth.register.title')}</h1>
      <AuthForm
        submitLabel={t('auth.register.submit')}
        busy={busy}
        disabled={!inviteOk}
        error={error}
        onSubmit={handleSubmit}
        passwordAutocomplete="new-password"
        passwordPlaceholder={t('auth.passwordNew')}
      />
      <p className={muted}>
        {t('auth.register.haveAccount')} <Link to="/login">{t('nav.login')}</Link>
      </p>
    </>
  )
}
