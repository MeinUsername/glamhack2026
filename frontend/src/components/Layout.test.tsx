import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'

describe('Layout', () => {
  it('AC-005-6 zeigt die Benutzer-Navigation nur für Admins', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'u@example.ch', role: 'user' } }) })
    renderAt('/')
    expect(await screen.findByRole('link', { name: 'Files' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
  })

  it('AC-005-6 zeigt die Benutzer-Navigation für Admins', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }) })
    renderAt('/')
    expect(await screen.findByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users')
  })

  it('AC-005-8 zeigt Anmelden und Registrieren ohne Sitzung', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/')
    const header = within(await screen.findByRole('banner'))
    expect(header.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(header.getByRole('link', { name: 'Register' })).toBeInTheDocument()
  })
})
