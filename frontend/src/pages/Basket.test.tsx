import { beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Basket from './Basket'
import { readBasket } from '../basket/basket'
import { renderAt, routeFetch } from '../test/helpers'

const idea = (id: string, title: string) => ({
  json: {
    id,
    title,
    description: '',
    audience: '',
    goal: '',
    sustainability: '',
    accessibility: '',
    space: { areaM2: null, volumeM3: null },
    equipment: [],
    categories: [],
    budget: null,
    images: [],
    createdAt: '2026-11-13T10:00:00Z',
  },
})

function setBasket(ids: string[]) {
  localStorage.setItem('hackathon-basket', JSON.stringify(ids))
}

describe('Basket page', () => {
  beforeEach(() => localStorage.clear())

  // AK3: removing an entry on the basket page removes it from the basket.
  it('AK3 entfernt einen Eintrag auf der Korbseite', async () => {
    setBasket(['a', 'b'])
    routeFetch({
      'GET /api/ideas/a': () => idea('a', 'Lichtinstallation'),
      'GET /api/ideas/b': () => idea('b', 'Klangraum'),
    })
    renderAt('/basket')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('button', { name: 'Remove Lichtinstallation from the basket' }))

    expect(readBasket()).toEqual(['b'])
    expect(screen.queryByText('Lichtinstallation')).toBeNull()
    expect(screen.getByText('Klangraum')).toBeInTheDocument()
  })

  // AK4: the basket is the same after rendering the page again.
  it('AK4 zeigt nach neuem Rendern den gespeicherten Korb', async () => {
    setBasket(['a'])
    routeFetch({ 'GET /api/ideas/a': () => idea('a', 'Lichtinstallation') })
    const first = render(
      <MemoryRouter>
        <Basket />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Lichtinstallation')).toBeInTheDocument()
    first.unmount()

    render(
      <MemoryRouter>
        <Basket />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Lichtinstallation')).toBeInTheDocument()
  })

  // AK5: an idea that no longer exists disappears from the page and the basket (D4).
  it('AK5 entfernt eine gelöschte Idee (404) stillschweigend aus dem Korb', async () => {
    setBasket(['gone', 'a'])
    routeFetch({
      'GET /api/ideas/gone': () => ({ status: 404, json: { error: 'idea not found' } }),
      'GET /api/ideas/a': () => idea('a', 'Lichtinstallation'),
    })
    renderAt('/basket')

    expect(await screen.findByText('Lichtinstallation')).toBeInTheDocument()
    await waitFor(() => expect(readBasket()).toEqual(['a']))
    expect(screen.queryByText(/could not be loaded/)).toBeNull()
  })

  // AK5: another error keeps the entry in the basket and says so.
  it('AK5 behält den Eintrag bei einem Serverfehler (500) und zeigt den Fehler', async () => {
    setBasket(['a'])
    routeFetch({ 'GET /api/ideas/a': () => ({ status: 500, json: { error: 'internal error' } }) })
    renderAt('/basket')

    expect(await screen.findByText('The idea could not be loaded.')).toBeInTheDocument()
    expect(readBasket()).toEqual(['a'])
  })

  // AK6: visitors without login see the basket and are not sent to the login page.
  it('AK6 zeigt die Korbseite ohne Anmeldung und leitet nicht weiter', async () => {
    routeFetch({ 'GET /api/me': () => ({ status: 401, json: { error: 'not signed in' } }) })
    renderAt('/basket')

    expect(await screen.findByRole('heading', { name: 'Basket' })).toBeInTheDocument()
    expect(screen.getByText('The basket is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Sign in' })).toBeNull()
  })
})
