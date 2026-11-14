import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'

const admin = { 'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }) }

describe('AdminTrash (F-033)', () => {
  it('AC-033-5/11 listet gelöschte Ideen und stellt eine wieder her', async () => {
    const { calls } = routeFetch({
      ...admin,
      'GET /api/admin/trash': () => ({ json: [{ id: 'a', title: 'Lichtkabine', deletedAt: '2026-11-14T10:00:00Z' }, { id: 'b', title: 'Klangraum', deletedAt: '2026-11-13T10:00:00Z' }] }),
      'POST /api/admin/trash/a/restore': () => ({ status: 204 }),
    })
    const u = userEvent.setup()
    renderAt('/admin/trash')
    expect(await screen.findByText('Lichtkabine')).toBeInTheDocument()
    await u.click(screen.getAllByRole('button', { name: 'Restore' })[0])
    expect(await screen.findByRole('status')).toHaveTextContent('"Lichtkabine" restored.')
    expect(screen.queryByText('Lichtkabine', { selector: 'span' })).toBeNull()
    expect(screen.getByText('Klangraum')).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'POST' && c.url === '/api/admin/trash/a/restore')).toBe(true)
  })

  it('zeigt den leeren Zustand', async () => {
    routeFetch({ ...admin, 'GET /api/admin/trash': () => ({ json: [] }) })
    renderAt('/admin/trash')
    expect(await screen.findByText('The trash is empty.')).toBeInTheDocument()
  })
})
