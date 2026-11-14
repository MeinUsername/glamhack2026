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
    expect(container.querySelectorAll('[data-placeholder]').length).toBe(3) // the contact is no longer a placeholder (F-033)
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

describe('Projektname und Kontakt (F-033)', () => {
  it('AC-033-9 das Impressum nennt den Projektnamen und verlinkt die Kontakt-E-Mail', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/imprint')
    await screen.findByRole('heading', { level: 1, name: 'Imprint' })
    expect(screen.getAllByText('Good Question – A Tool Kit for Art Mediation').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'goodquestion.glamhack@gmail.com' })).toHaveAttribute('href', 'mailto:goodquestion.glamhack@gmail.com')
  })

  it('AC-033-10 die Terms nennen Projektname und Kontakt in allen Sprachen', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/terms')
    for (const lang of ['en', 'de', 'fr', 'it']) {
      await i18n.changeLanguage(lang)
      expect(await screen.findByRole('link', { name: 'goodquestion.glamhack@gmail.com' })).toHaveAttribute('href', 'mailto:goodquestion.glamhack@gmail.com')
      expect(screen.getByText(/Good Question – A Tool Kit for Art Mediation/, { selector: 'p' })).toBeInTheDocument()
    }
    await i18n.changeLanguage('en')
  })
})
