import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'

describe('Layout', () => {
  // F-012 D1/T7: Dateien and Benutzer are admin-only links.
  it('AC-005-6 zeigt die Benutzer- und Dateinavigation nur für Admins', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'u@example.ch', role: 'user' } }) })
    renderAt('/')
    await within(await screen.findByRole('banner')).findByRole('link', { name: 'Ideas' })
    expect(screen.queryByRole('link', { name: 'Files' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
  })

  it('AC-005-6 zeigt die Benutzer-Navigation für Admins', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }) })
    renderAt('/')
    expect(await screen.findByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users')
  })

  // AC-016-3: no link to files or dashboard, not even for admins.
  it('AC-016-3 hat für Admins keinen Verweis auf Dateien oder Dashboard', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }) })
    renderAt('/')
    await screen.findByRole('link', { name: 'Users' })
    expect(screen.queryByRole('link', { name: 'Files' })).not.toBeInTheDocument()
    expect(document.querySelector('a[href="/dashboard"]')).toBeNull()
  })

  // AC-012-6: the public interface has no link to /login or /register (D6).
  it('AC-012-6 zeigt ohne Sitzung keine Anmelde- oder Registrierlinks', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/')
    const header = within(await screen.findByRole('banner'))
    await header.findByRole('link', { name: 'Ideas' })
    expect(header.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(header.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument()
  })
})
