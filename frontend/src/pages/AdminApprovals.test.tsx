import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, within } from '@testing-library/react'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'

const admin = { 'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }) }
const idea = (id: string, title: string) => ({
  id,
  title,
  description: `Beschreibung ${title}`,
  targetGroup: '',
  goal: '',
  mediationConcept: '## Konzept',
  images: [{ contentType: 'image/png', bytes: 1, version: 'v1' }],
  status: 'pending',
})

describe('AdminApprovals (F-030)', () => {
  it('AC-030-3 zeigt die wartenden Ideen mit Vorschau', async () => {
    routeFetch({ ...admin, 'GET /api/admin/approvals': () => ({ json: [idea('a', 'Lichtkabine'), idea('b', 'Klangraum')] }) })
    renderAt('/admin/approvals')
    expect(await screen.findByRole('heading', { name: 'Lichtkabine' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Klangraum' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Konzept' }).length).toBe(2)
  })

  it('AC-030-6 veröffentlicht und entfernt die Idee aus der Liste', async () => {
    const { calls } = routeFetch({
      ...admin,
      'GET /api/admin/approvals': () => ({ json: [idea('a', 'Lichtkabine')] }),
      'POST /api/admin/approvals/a/publish': () => ({ json: { status: 'published' } }),
    })
    renderAt('/admin/approvals')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Publish' }))
    expect(await screen.findByText('Idea published.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Lichtkabine' })).toBeNull()
    expect(calls.some((c) => c.url === '/api/admin/approvals/a/publish' && c.method === 'POST')).toBe(true)
  })

  it('AC-030-7 lehnt mit Begründung ab', async () => {
    const { calls } = routeFetch({
      ...admin,
      'GET /api/admin/approvals': () => ({ json: [idea('a', 'Lichtkabine')] }),
      'POST /api/admin/approvals/a/reject': () => ({ json: { status: 'rejected' } }),
    })
    renderAt('/admin/approvals')
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText(/^Reason/), 'zu vage')
    await u.click(screen.getByRole('button', { name: 'Reject' }))
    expect(await screen.findByText('Idea rejected.')).toBeInTheDocument()
    const post = calls.find((c) => c.url === '/api/admin/approvals/a/reject')
    expect(JSON.parse(String(post?.body))).toEqual({ reason: 'zu vage' })
  })

  it('meldet einen Konflikt (409) verständlich und lädt neu', async () => {
    let loads = 0
    routeFetch({
      ...admin,
      'GET /api/admin/approvals': () => ({ json: loads++ === 0 ? [idea('a', 'Lichtkabine')] : [] }),
      'POST /api/admin/approvals/a/publish': () => ({ status: 409, json: { error: 'weg' } }),
    })
    renderAt('/admin/approvals')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Publish' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Another admin has already decided')
    expect(await screen.findByText('No ideas are waiting for approval.')).toBeInTheDocument()
  })

  it('AC-030-12 verweigert Nicht-Admins die Seite und zeigt keinen Nav-Eintrag', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'u@example.ch', role: 'user' } }) })
    renderAt('/admin/approvals')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(within(screen.getByRole('banner')).queryByRole('link', { name: 'Approvals' })).toBeNull()
    routeFetch({ 'GET /api/me': () => unauthorized })
  })

  it('AC-030-3 zeigt Admins den Nav-Eintrag Freigaben', async () => {
    routeFetch({ ...admin, 'GET /api/admin/approvals': () => ({ json: [] }) })
    renderAt('/admin/approvals')
    expect(await within(await screen.findByRole('banner')).findByRole('link', { name: 'Approvals' })).toBeInTheDocument()
  })
})
