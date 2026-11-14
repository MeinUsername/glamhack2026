import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'

const admin = { 'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }) }
const list = () => ({ json: [{ id: 'r', name: 'Reference' }, { id: 't', name: 'Tools' }] })

describe('AdminLinkTypes (F-031)', () => {
  it('AC-031-8 legt einen Typ an', async () => {
    const { calls } = routeFetch({ ...admin, 'GET /api/link-types': list, 'POST /api/admin/link-types': () => ({ status: 201, json: { id: 'n' } }) })
    const u = userEvent.setup()
    renderAt('/admin/link-types')
    expect(await screen.findByText('Tools')).toBeInTheDocument()
    await u.type(screen.getByLabelText('New type'), 'Museums')
    await u.click(screen.getByRole('button', { name: 'Add type' }))
    const post = calls.find((c) => c.method === 'POST')
    expect(JSON.parse(String(post?.body))).toEqual({ name: 'Museums' })
  })
  it('AC-031-8 zeigt die Meldung, wenn ein Typ noch benutzt wird', async () => {
    routeFetch({
      ...admin,
      'GET /api/link-types': list,
      'DELETE /api/admin/link-types/t': () => ({ status: 409, json: { error: 'Type is still used by an idea.' } }),
    })
    vi.stubGlobal('confirm', () => true)
    const u = userEvent.setup()
    renderAt('/admin/link-types')
    await screen.findByText('Tools')
    await u.click(screen.getAllByRole('button', { name: 'Delete' })[1])
    expect(await screen.findByText('Type is still used by an idea.')).toBeInTheDocument()
  })
})
