import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'

const admin = { 'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }) }
const preview = {
  new: 2,
  skipped: 1,
  invalid: 1,
  created: 0,
  rows: [
    { line: 3, title: 'E-ink', status: 'skipped', message: '"E-ink" already exists, skipped.' },
    { line: 5, title: '', status: 'invalid', message: 'Title is missing.' },
  ],
}
const csv = new File(['Title\nA\n'], 'ideen.csv', { type: 'text/csv' })

describe('AdminImport (F-015)', () => {
  it('AC-015-1 zeigt die Vorschau und speichert noch nichts', async () => {
    const { calls } = routeFetch({ ...admin, 'POST /api/admin/import/ideas/preview': () => ({ json: preview }) })
    renderAt('/admin/import')
    const u = userEvent.setup()
    await u.upload(await screen.findByLabelText('CSV file'), csv)
    await u.click(screen.getByRole('button', { name: 'Preview' }))

    expect(await screen.findByText(/2 new/)).toBeInTheDocument()
    expect(screen.getByText(/1 skipped/)).toBeInTheDocument()
    expect(screen.getByText(/1 invalid/)).toBeInTheDocument()
    expect(screen.getByText('Title is missing.')).toBeInTheDocument()
    expect(calls.some((c) => c.url === '/api/admin/import/ideas')).toBe(false)
  })

  it('AC-015-2 importiert erst nach Bestätigung und zeigt das Ergebnis', async () => {
    const { calls } = routeFetch({
      ...admin,
      'POST /api/admin/import/ideas/preview': () => ({ json: preview }),
      'POST /api/admin/import/ideas': () => ({ json: { ...preview, created: 2 } }),
    })
    renderAt('/admin/import')
    const u = userEvent.setup()
    await u.upload(await screen.findByLabelText('CSV file'), csv)
    await u.click(screen.getByRole('button', { name: 'Preview' }))
    await u.click(await screen.findByRole('button', { name: 'Import 2 ideas' }))

    expect(await screen.findByText(/2 created/)).toBeInTheDocument()
    expect(calls.filter((c) => c.url === '/api/admin/import/ideas')).toHaveLength(1)
  })

  it('deaktiviert den Import, wenn nichts neu ist', async () => {
    routeFetch({
      ...admin,
      'POST /api/admin/import/ideas/preview': () => ({ json: { ...preview, new: 0 } }),
    })
    renderAt('/admin/import')
    const u = userEvent.setup()
    await u.upload(await screen.findByLabelText('CSV file'), csv)
    await u.click(screen.getByRole('button', { name: 'Preview' }))
    expect(await screen.findByRole('button', { name: 'Import 0 ideas' })).toBeDisabled()
  })

  it('AC-015-5 zeigt Nicht-Admins nur den Hinweis', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'u@example.ch', role: 'user' } }) })
    renderAt('/admin/import')
    expect(await screen.findByText('Admins only.')).toBeInTheDocument()
  })
})
