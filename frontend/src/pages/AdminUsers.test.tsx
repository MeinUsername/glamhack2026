import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'

const users = [
  { uid: 'a', email: 'admin@example.ch', role: 'admin', disabled: false },
  { uid: 'b', email: 'user@example.ch', role: 'user', disabled: false },
]

describe('AdminUsers', () => {
  // F-012 D8, moved from the dashboard (F-016): an admin creates an invitation link.
  it('erzeugt einen Einladungslink', async () => {
    routeFetch({
      'GET /api/me': () => ({ json: { email: 'admin@example.ch', role: 'admin' } }),
      'GET /api/admin/users': () => ({ json: users }),
      'POST /api/invitations': () => ({ status: 201, json: { link: 'https://x.ch/register?invite=abc' } }),
    })
    renderAt('/admin/users')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Create invitation link' }))
    expect(await screen.findByText('https://x.ch/register?invite=abc')).toBeInTheDocument()
  })

  it('AC-005-6 zeigt für Nicht-Admins keine Nutzerliste und ruft die Admin-API nicht auf', async () => {
    const { calls } = routeFetch({ 'GET /api/me': () => ({ json: { email: 'u@example.ch', role: 'user' } }) })
    renderAt('/admin/users')
    expect(await screen.findByText('Admins only.')).toBeInTheDocument()
    expect(calls.some((c) => c.url === '/api/admin/users')).toBe(false)
  })

  it('AC-005-6 ändert die Rolle eines Nutzers über die JSON-API', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => ({ json: { email: 'admin@example.ch', role: 'admin' } }),
      'GET /api/admin/users': () => ({ json: users }),
      'POST /api/admin/users/b/role': () => ({
        json: users.map((u) => (u.uid === 'b' ? { ...u, role: 'admin' } : u)),
      }),
    })
    renderAt('/admin/users')
    const select = await screen.findByLabelText('Role of user@example.ch')
    await userEvent.setup().selectOptions(select, 'admin')

    expect(await screen.findByText('Role saved.')).toBeInTheDocument()
    await waitFor(() => {
      const post = calls.find((c) => c.url === '/api/admin/users/b/role')
      expect(JSON.parse(post?.body as string)).toEqual({ role: 'admin' })
    })
  })

  it('AC-005-6 zeigt die Schutzregel des Servers als Fehler', async () => {
    routeFetch({
      'GET /api/me': () => ({ json: { email: 'admin@example.ch', role: 'admin' } }),
      'GET /api/admin/users': () => ({ json: users }),
      'POST /api/admin/users/a/disabled': () => ({
        status: 400,
        json: { error: 'Du kannst dich nicht selbst sperren.' },
      }),
    })
    renderAt('/admin/users')
    const [ownBlock] = await screen.findAllByRole('button', { name: 'Block' }) // first row: the admin's own account
    await userEvent.setup().click(ownBlock)
    expect(await screen.findByText('Du kannst dich nicht selbst sperren.')).toBeInTheDocument()
  })
})
