import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { MAX_UPLOAD_BYTES } from './Dashboard'
import { renderAt, routeFetch } from '../test/helpers'

const admin = { json: { email: 'a@example.ch', role: 'admin' } }
const user = { json: { email: 'u@example.ch', role: 'user' } }

describe('Dashboard', () => {
  it('AC-005-5 lehnt eine Datei über 1 MB ab und sendet sie nicht', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => admin,
      'GET /api/files': () => ({ json: [] }),
    })
    renderAt('/dashboard')
    const picker = await screen.findByLabelText('File')

    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'gross.bin')
    await userEvent.setup().upload(picker, big)

    expect(await screen.findByText('The file is larger than 1 MB.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('AC-005-5 lädt eine Datei bis 1 MB hoch und zeigt sie in der Liste', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => admin,
      'GET /api/files': () => ({ json: [] }),
      'POST /api/files': () => ({
        status: 201,
        json: { id: 'f1', name: 'hallo.txt', bytes: 5, createdAt: '13.11.2026 10:00' },
      }),
    })
    renderAt('/dashboard')
    const picker = await screen.findByLabelText('File')

    const u = userEvent.setup()
    await u.upload(picker, new File(['hallo'], 'hallo.txt', { type: 'text/plain' }))
    await u.click(screen.getByRole('button', { name: 'Upload' }))

    expect(await screen.findByRole('link', { name: 'hallo.txt' })).toHaveAttribute('href', '/files/f1')
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1)
  })

  it('AC-005-5 zeigt die Größe in KB', async () => {
    routeFetch({
      'GET /api/me': () => admin,
      'GET /api/files': () => ({
        json: [{ id: 'f2', name: 'bild.png', bytes: 2048, createdAt: '12.11.2026 09:00' }],
      }),
    })
    renderAt('/dashboard')
    expect(await screen.findByText('2.0 KB')).toBeInTheDocument()
  })

  // F-012 T4/T7: files are admin-only; a user sees the denial and no file list.
  it('AC-012-5 zeigt Nicht-Admins keine Dateien und ruft die Datei-API nicht auf', async () => {
    const { calls } = routeFetch({ 'GET /api/me': () => user })
    renderAt('/dashboard')
    expect(await screen.findByText('Admins only.')).toBeInTheDocument()
    expect(calls.some((c) => c.url === '/api/files')).toBe(false)
  })
})
