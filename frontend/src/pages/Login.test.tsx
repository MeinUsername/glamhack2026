import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { signIn } from '../auth/firebase'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'
import type { User } from 'firebase/auth'

describe('Login', () => {
  it('AC-005-3 leitet nach Login auf /dashboard', async () => {
    let signedIn = false
    const { calls } = routeFetch({
      'GET /api/me': () => (signedIn ? { json: { email: 'a@example.ch', role: 'user' } } : unauthorized),
      'POST /session': () => {
        signedIn = true
        return { status: 204 }
      },
      'GET /api/files': () => ({ json: [] }),
    })
    vi.mocked(signIn).mockResolvedValue({ getIdToken: async () => 'id-token' } as unknown as User)

    renderAt('/login')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-Mail'), 'a@example.ch')
    await user.type(screen.getByLabelText('Passwort'), 'geheim123')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(await screen.findByRole('heading', { name: 'Meine Dateien' })).toBeInTheDocument()
    const session = calls.find((c) => c.url === '/session')
    expect(JSON.parse(session?.body as string)).toEqual({ idToken: 'id-token' })
  })

  it('AC-005-3 zeigt die Sperre des Servers', async () => {
    routeFetch({
      'GET /api/me': () => unauthorized,
      'POST /session': () => ({ status: 403, json: { error: 'Dieses Konto ist gesperrt.' } }),
    })
    vi.mocked(signIn).mockResolvedValue({ getIdToken: async () => 'id-token' } as unknown as User)

    renderAt('/login')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-Mail'), 'b@example.ch')
    await user.type(screen.getByLabelText('Passwort'), 'geheim123')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(await screen.findByText('Dieses Konto ist gesperrt.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Anmelden' })).toBeEnabled())
  })
})
