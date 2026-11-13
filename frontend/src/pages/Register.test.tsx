import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { signUp } from '../auth/firebase'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'
import type { User } from 'firebase/auth'

const INVALID = 'The invitation link is invalid or has expired.'

describe('Register', () => {
  it('AC-005-4 sperrt das Formular bei abgelaufenem oder benutztem Link', async () => {
    routeFetch({
      'GET /api/me': () => unauthorized,
      'GET /api/invitations/abc': () => ({ json: { valid: false } }),
    })
    renderAt('/register?invite=abc')

    expect(await screen.findByText(INVALID)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Register' })).toBeDisabled()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('AC-005-4 registriert mit gültigem Link über POST /register', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => unauthorized,
      'GET /api/invitations/abc': () => ({ json: { valid: true } }),
      'POST /register': () => ({ status: 204 }),
    })
    vi.mocked(signUp).mockResolvedValue({ getIdToken: async () => 'new-token' } as unknown as User)

    renderAt('/register?invite=abc')
    const user = userEvent.setup()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Register' })).toBeEnabled())
    await user.type(screen.getByLabelText('Email'), 'neu@example.ch')
    await user.type(screen.getByLabelText('Password'), 'geheim123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      const register = calls.find((c) => c.url === '/register')
      expect(register).toBeDefined()
      expect(JSON.parse(register?.body as string)).toEqual({ idToken: 'new-token', invite: 'abc' })
    })
  })

  it('AC-005-4 zeigt den Fehler des Servers, wenn der Link beim Abschicken ungültig ist', async () => {
    routeFetch({
      'GET /api/me': () => unauthorized,
      'GET /api/invitations/abc': () => ({ json: { valid: true } }),
      'POST /register': () => ({ status: 410, json: { error: INVALID } }),
    })
    vi.mocked(signUp).mockResolvedValue({ getIdToken: async () => 'new-token' } as unknown as User)

    renderAt('/register?invite=abc')
    const user = userEvent.setup()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Register' })).toBeEnabled())
    await user.type(screen.getByLabelText('Email'), 'neu@example.ch')
    await user.type(screen.getByLabelText('Password'), 'geheim123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText(INVALID)).toBeInTheDocument()
  })
})
