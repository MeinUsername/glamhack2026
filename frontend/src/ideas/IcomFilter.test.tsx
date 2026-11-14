import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import App from '../App'
import i18n from '../i18n'
import { renderAt, routeFetch } from '../test/helpers'
import { matchesFilter, parseIdList, ICOM_CATEGORY_IDS } from './icom'

const user = { json: { email: 'a@example.ch', role: 'user' } }
const rows = [
  { id: 'a', title: 'Talking hour', imageCount: 0, description: '', icomCategories: ['accessibility', 'dialogue-exchange'], locations: ['onsite'] },
  { id: 'b', title: 'Online archive', imageCount: 0, description: '', icomCategories: ['digital-mediation'], locations: ['online'] },
  { id: 'c', title: 'Old idea', imageCount: 0, description: '', icomCategories: [], locations: [] },
]

function mockIdeas() {
  return routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas': () => ({ json: rows }) })
}

function shownTitles() {
  return screen.queryAllByRole('link').map((a) => a.textContent).filter((t) => rows.some((r) => r.title === t))
}

// Shows the current search string next to the app, to check what goes into the URL.
function Probe() {
  const { search } = useLocation()
  return <output data-testid="search">{search}</output>
}

describe('ICOM filter (F-024)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('zeigt ohne Filter alle Ideen und die Anzahl', async () => {
    mockIdeas()
    renderAt('/ideas')
    expect(await screen.findByText('3 of 3 ideas')).toBeInTheDocument()
    expect(shownTitles()).toEqual(['Talking hour', 'Online archive', 'Old idea'])
    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeDisabled()
  })

  it('verknüpft Kategorien mit ODER und Kategorie und Ort mit UND', async () => {
    mockIdeas()
    renderAt('/ideas')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('switch', { name: 'Show all subcategories' }))
    await u.click(screen.getByRole('button', { name: 'Accessibility & Access' }))
    await u.click(screen.getByRole('button', { name: 'Digital Mediation' }))
    expect(screen.getByRole('button', { name: 'Accessibility & Access' })).toHaveAttribute('aria-pressed', 'true')
    expect(shownTitles()).toEqual(['Talking hour', 'Online archive'])
    expect(screen.getByText('2 of 3 ideas')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Online' }))
    expect(shownTitles()).toEqual(['Online archive'])
    expect(screen.getByText('1 of 3 ideas')).toBeInTheDocument()
  })

  it('liest den Filter aus der URL und meldet, wenn nichts passt', async () => {
    mockIdeas()
    renderAt('/ideas?categories=dialogue-exchange&locations=online')
    expect(await screen.findByText('0 of 3 ideas')).toBeInTheDocument()
    expect(screen.getByText('No idea matches this filter.')).toBeInTheDocument()
    // A chosen category turns the switch on by itself.
    expect(screen.getByRole('switch', { name: 'Show all subcategories' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Dialogue & Exchange' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Online' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('schreibt die Auswahl in die URL und setzt sie zurück', async () => {
    mockIdeas()
    render(
      <MemoryRouter initialEntries={['/ideas']}>
        <App />
        <Probe />
      </MemoryRouter>,
    )
    const u = userEvent.setup()
    await u.click(await screen.findByRole('switch', { name: 'Show all subcategories' }))
    await u.click(screen.getByRole('button', { name: 'Digital Mediation' }))
    await u.click(screen.getByRole('button', { name: 'Accessibility & Access' }))
    await u.click(screen.getByRole('button', { name: 'Onsite' }))
    // Categories in the order of the JSON file, not in click order.
    expect(screen.getByTestId('search')).toHaveTextContent('?categories=accessibility%2Cdigital-mediation&locations=onsite')

    await u.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/)
    expect(screen.getByText('3 of 3 ideas')).toBeInTheDocument()
  })

  it('zeigt die Kategorien in der gewählten Sprache', async () => {
    await i18n.changeLanguage('de')
    mockIdeas()
    renderAt('/ideas')
    const filter = within(await screen.findByRole('region', { name: 'Filter' }))
    await userEvent.setup().click(filter.getByRole('switch', { name: 'Alle Unterkategorien zeigen' }))
    expect(filter.getByRole('group', { name: 'Zugang & Inklusion' })).toBeInTheDocument()
    expect(filter.getByRole('button', { name: 'Barrierefreiheit & Zugang' })).toBeInTheDocument()
    expect(filter.getByRole('button', { name: 'Im Museum' })).toBeInTheDocument()
  })
})

describe('Schalter für alle Unterkategorien', () => {
  beforeEach(() => localStorage.clear())

  it('zeigt die Unterkategorien nur alle oder keine', async () => {
    mockIdeas()
    renderAt('/ideas')
    const u = userEvent.setup()
    const toggle = await screen.findByRole('switch', { name: 'Show all subcategories' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    // Main categories are headings, not buttons: there is no way to open just one.
    expect(screen.getByRole('heading', { name: 'Access & Inclusion' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Access & Inclusion' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Accessibility & Access' })).toBeNull()

    await u.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    for (const name of ['Participation & Co-creation', 'Accessibility & Access', 'Digital Mediation', 'Sustainability & Climate']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    await u.click(screen.getByRole('button', { name: 'Accessibility & Access' }))
    expect(screen.getByText('1 of 3 ideas')).toBeInTheDocument()

    // Switching off hides all chips but keeps the choice.
    await u.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByRole('button', { name: 'Sustainability & Climate' })).toBeNull()
    expect(screen.getByText('1 of 3 ideas')).toBeInTheDocument()
  })
})

describe('matchesFilter / parseIdList', () => {
  it('ignoriert unbekannte IDs in der URL', () => {
    expect(parseIdList('nope,accessibility,accessibility', ICOM_CATEGORY_IDS)).toEqual(['accessibility'])
    expect(parseIdList(null, ICOM_CATEGORY_IDS)).toEqual([])
  })

  it('behandelt fehlende Felder wie leere Listen', () => {
    expect(matchesFilter({}, [], [])).toBe(true)
    expect(matchesFilter({}, ['accessibility'], [])).toBe(false)
  })
})

describe('Idee bearbeiten (F-024)', () => {
  it('sendet gewählte ICOM-Kategorien und Orte', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 201, json: { id: 'i1' } }),
      'GET /api/ideas/i1': () => ({
        json: {
          id: 'i1', title: '', description: '', targetGroup: '', descriptionOfInteraction: '', staffNeeded: '',
          exhibitRelated: '', goal: '', sustainability: '', accessibility: '',
          space: { areaM2: null, volumeM3: null }, equipment: [], categories: [],
          icomCategories: ['sustainability'], locations: ['online'], budget: null, images: [],
          createdAt: '2026-11-14T10:00:00Z',
        },
      }),
    })
    renderAt('/ideas/new')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('checkbox', { name: 'Sustainability & Climate' }))
    await u.click(screen.getByRole('checkbox', { name: 'Dialogue & Exchange' }))
    await u.click(screen.getByRole('checkbox', { name: 'Online' }))
    // F-028: saving needs the confirmed terms.
    await u.click(screen.getByRole('checkbox', { name: /I confirm that my content/ }))
    await u.click(screen.getByRole('button', { name: 'Save idea' }))

    const post = calls.find((c) => c.method === 'POST')
    const body = post?.body
    if (!(body instanceof FormData)) throw new Error('expected FormData')
    const data = JSON.parse(String(body.get('data')))
    expect(data.icomCategories).toEqual(['sustainability', 'dialogue-exchange'])
    expect(data.locations).toEqual(['online'])

    // The idea page that follows shows them and links to the filtered overview.
    const link = await screen.findByRole('link', { name: 'Sustainability & Climate' })
    expect(link).toHaveAttribute('href', '/ideas?categories=sustainability')
  })
})
