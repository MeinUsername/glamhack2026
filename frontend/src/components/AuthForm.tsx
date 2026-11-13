import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { button, errorText, input } from '../ui'

interface Props {
  submitLabel: string
  busy: boolean
  disabled?: boolean
  error: string
  onSubmit: (email: string, password: string) => void
  passwordAutocomplete: 'current-password' | 'new-password'
  passwordPlaceholder: string
}

// The e-mail/password form shared by login and registration.
export default function AuthForm(props: Props) {
  const { t } = useTranslation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    props.onSubmit(email, password)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="my-4 grid max-w-sm gap-3">
        <input
          name="email"
          type="email"
          placeholder={t('auth.email')}
          aria-label={t('auth.email')}
          autoComplete="email"
          required
          disabled={props.disabled}
          className={input}
        />
        <input
          name="password"
          type="password"
          placeholder={props.passwordPlaceholder}
          aria-label={t('auth.password')}
          autoComplete={props.passwordAutocomplete}
          minLength={props.passwordAutocomplete === 'new-password' ? 8 : undefined}
          required
          disabled={props.disabled}
          className={input}
        />
        <button type="submit" className={button} disabled={props.busy || props.disabled}>
          {props.submitLabel}
        </button>
      </form>
      <p role="alert" className={errorText}>
        {props.error}
      </p>
    </>
  )
}
