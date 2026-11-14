import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, within } from '@testing-library/react'
import i18n from '../i18n'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'

describe('Footer und Rechtsseiten (F-028)', () => {
  it('AC-028-1 zeigt den Footer mit beiden Links auf jeder Seite, auch /login', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    for (const path of ['/', '/login', '/register', '/imprint']) {
      const { unmount } = renderAt(path)
      const footer = await screen.findByRole('contentinfo')
      expect(within(footer).getByRole('link', { name: 'Imprint' })).toHaveAttribute('href', '/imprint')
      expect(within(footer).getByRole('link', { name: 'Terms and Conditions' })).toHaveAttribute('href', '/terms')
      unmount()
    }
  })

  it('AC-028-2/3 zeigt die Terms ohne Login mit den Pflicht-Abschnitten', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/terms')
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms and Conditions' })).toBeInTheDocument()
    for (const h of [/Copyright and rights of third parties/, /Responsibility for submitted content/, /Indemnification/, /Disclaimer of liability/, /Removal of content/]) {
      expect(screen.getByRole('heading', { level: 2, name: h })).toBeInTheDocument()
    }
  })

  it('AC-028-2/4 zeigt das Impressum ohne Login mit markierten Platzhaltern', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    const { container } = renderAt('/imprint')
    expect(await screen.findByRole('heading', { level: 1, name: 'Imprint' })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('TODO')
    expect(container.querySelectorAll('[data-placeholder]').length).toBeGreaterThanOrEqual(4)
  })

  it('AC-028-5 wechselt die Texte mit der Sprache', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/terms')
    await screen.findByRole('heading', { level: 1, name: 'Terms and Conditions' })
    await i18n.changeLanguage('de')
    expect(await screen.findByRole('heading', { level: 1, name: 'Nutzungsbedingungen' })).toBeInTheDocument()
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Impressum' })).toBeInTheDocument()
    await userEvent.setup().click(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Impressum' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Impressum' })).toBeInTheDocument()
  })
})
