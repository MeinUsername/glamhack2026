import { beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, within } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'
import { readBasket } from '../basket/basket'

const user = { json: { email: 'a@example.ch', role: 'user' } }
const rows = [
  { id: 'a', title: 'Lichtinstallation', imageCount: 2, coverVersion: 'v1', description: 'Licht im Raum\nzweite Zeile' },
  { id: 'b', title: 'Klangraum', imageCount: 0, description: '' },
]

function setBasket(ids: string[]) {
  localStorage.setItem('hackathon-basket', JSON.stringify(ids))
}

describe('IdeasList (F-011)', () => {
  beforeEach(() => localStorage.clear())

  // AK1: all ideas with title, preview and purchase status.
  it('AK1 zeigt alle Ideen mit Titel, Bild-Vorschau und Kaufstatus', async () => {
    routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas': () => ({ json: rows }) })
    renderAt('/ideas')

    const first = await screen.findByRole('link', { name: 'Lichtinstallation' })
    const firstRow = first.closest('li') as HTMLElement
    expect(firstRow.querySelector('img')?.getAttribute('src')).toBe('/api/ideas/a/images/0?v=v1')
    expect(within(firstRow).getByRole('button', { name: 'Add to basket' })).toBeInTheDocument()

    const second = screen.getByRole('link', { name: 'Klangraum' }).closest('li') as HTMLElement
    expect(second.querySelector('img')).toBeNull() // no image, no preview
  })

  // AC-014-6: the overview shows the full description (Q-014-08).
  it('AC-014-6 zeigt die Beschreibung unter dem Titel', async () => {
    routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas': () => ({ json: rows }) })
    renderAt('/ideas')
    const row = (await screen.findByRole('link', { name: 'Lichtinstallation' })).closest('li') as HTMLElement
    expect(row.textContent).toContain('Licht im Raum')
    expect(row.textContent).toContain('zweite Zeile')
  })

  // AK2: «In den Korb» on the overview puts the idea in the basket and marks it as bought.
  it('AK2 legt eine Idee über die Übersicht in den Korb und markiert sie als gekauft', async () => {
    routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas': () => ({ json: rows }) })
    renderAt('/ideas')
    const u = userEvent.setup()
    const row = (await screen.findByRole('link', { name: 'Klangraum' })).closest('li') as HTMLElement
    await u.click(within(row).getByRole('button', { name: 'Add to basket' }))

    expect(readBasket()).toEqual(['b'])
    expect(within(row).getByText('Bought')).toBeInTheDocument()
  })

  // AK3: an idea already in the basket is marked and cannot be chosen again.
  it('AK3 markiert eine Idee im Korb als gekauft ohne erneute Auswahl', async () => {
    setBasket(['a'])
    routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas': () => ({ json: rows }) })
    renderAt('/ideas')
    const row = (await screen.findByRole('link', { name: 'Lichtinstallation' })).closest('li') as HTMLElement

    expect(within(row).getByText('Bought')).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Add to basket' })).toBeNull()
  })

  // AK4: after removal from the basket, the overview shows the idea without the purchase mark.
  it('AK4 zeigt eine entfernte Idee wieder ohne Kaufstatus', async () => {
    setBasket(['a'])
    routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas': () => ({ json: rows }) })
    const before = renderAt('/ideas')
    expect(await screen.findByText('Bought')).toBeInTheDocument()
    before.unmount()

    // removal happens on the basket page; the overview is shown again afterwards
    setBasket([])
    renderAt('/ideas')
    const row = (await screen.findByRole('link', { name: 'Lichtinstallation' })).closest('li') as HTMLElement
    expect(within(row).getByRole('button', { name: 'Add to basket' })).toBeInTheDocument()
    expect(within(row).queryByText('Bought')).toBeNull()
  })

  // AC-012-1 (replaces AK5): the overview is public, visitors see it without login (D1).
  it('AC-012-1 zeigt einem Besucher ohne Anmeldung die Übersicht', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => ({ status: 401, json: { error: 'not signed in' } }),
      'GET /api/ideas': () => ({ json: [] }),
    })
    renderAt('/ideas')

    expect(await screen.findByText('No ideas yet.')).toBeInTheDocument()
    expect(calls.some((c) => c.url === '/api/ideas')).toBe(true)
  })

describe('IdeasList edit entry (F-020)', () => {
  it('AC-020-2 führt pro Karte zum Bearbeiten der eigenen Idee', async () => {
    routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas': () => ({ json: rows }) })
    renderAt('/ideas')
    await screen.findByRole('link', { name: 'Lichtinstallation' })
    const links = screen.getAllByRole('link', { name: 'Edit' })
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/ideas/a/edit', '/ideas/b/edit'])
  })
})
})
