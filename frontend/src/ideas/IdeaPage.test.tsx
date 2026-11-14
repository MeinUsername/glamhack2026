import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'

const base = {
  id: 'i1',
  title: 'Lichtinstallation',
  description: '',
  targetGroup: '',
  descriptionOfInteraction: '',
  staffNeeded: '',
  exhibitRelated: '',
  goal: '',
  sustainability: '',
  accessibility: '',
  space: { areaM2: null, volumeM3: null },
  equipment: [],
  budget: null,
  images: [],
  createdAt: '2026-11-13T10:00:00Z',
}

describe('IdeaPage mediation concept', () => {
  it('AC-023-4 rendert das Concept als Markdown und führt kein HTML aus', async () => {
    routeFetch({
      'GET /api/ideas/i1': () => ({
        json: { ...base, categories: [], mediationConcept: '## Ablauf\n\n- eins\n- zwei\n\n<script>alert(1)</script>' },
      }),
    })
    const { container } = renderAt('/ideas/i1')
    expect(await screen.findByRole('heading', { name: 'Mediation concept' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ablauf' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
    expect(container.querySelector('script')).toBeNull()
  })

  it('AC-026-1 zeigt das Concept als letzten Abschnitt nach Budget', async () => {
    routeFetch({
      'GET /api/ideas/i1': () => ({ json: { ...base, categories: [], mediationConcept: 'Text' } }),
    })
    renderAt('/ideas/i1')
    await screen.findByRole('heading', { name: 'Mediation concept' })
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(names.at(-1)).toBe('Mediation concept')
    expect(names.at(-2)).toBe('Budget')
  })

  it('AC-023-6 blendet den Abschnitt ohne Concept aus, auch bei fehlendem Feld', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [] } }) })
    renderAt('/ideas/i1')
    expect(await screen.findByRole('heading', { name: 'Lichtinstallation' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mediation concept' })).toBeNull()
  })

  it('AC-023-6 blendet den Abschnitt bei Leerzeichen-Concept aus', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [], mediationConcept: '  \n ' } }) })
    renderAt('/ideas/i1')
    expect(await screen.findByRole('heading', { name: 'Lichtinstallation' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mediation concept' })).toBeNull()
  })
})

describe('IdeaPage categories', () => {
  it('AC-009-5 zeigt gewählte Kategorien als Chips unter dem Titel', async () => {
    routeFetch({
      'GET /api/ideas/i1': () => ({ json: { ...base, categories: ['affirmative', 'transformation'] } }),
    })
    renderAt('/ideas/i1')

    const list = await screen.findByRole('list', { name: 'Categories' })
    expect(list).toHaveTextContent('Affirmative')
    expect(list).toHaveTextContent('Transformation')
    expect(list.querySelectorAll('li')).toHaveLength(2)
    expect(list.querySelector('button')).toBeNull() // chips are not clickable
  })

  it('AC-009-6 zeigt keinen Chip-Block ohne Kategorie', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [] } }) })
    renderAt('/ideas/i1')

    expect(await screen.findByRole('heading', { name: 'Lichtinstallation' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Categories' })).toBeNull()
  })

describe('IdeaPage edit entry', () => {
  it('AC-020-1 zeigt einen Bearbeiten-Button, der zum Formular führt', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [] } }) })
    renderAt('/ideas/i1')
    const link = await screen.findByRole('link', { name: 'Edit' })
    expect(link).toHaveAttribute('href', '/ideas/i1/edit')
  })
})
})

describe('IdeaPage image URLs (F-029)', () => {
  it('AC-029-1/2 nutzt die Version in der Bild-URL, eine neue Version ergibt eine neue URL', async () => {
    const withImage = (version: string) => ({
      json: { ...base, categories: [], images: [{ contentType: 'image/png', bytes: 1, version }] },
    })
    routeFetch({ 'GET /api/ideas/i1': () => withImage('alt') })
    const first = renderAt('/ideas/i1')
    expect((await screen.findAllByRole('img'))[0]).toHaveAttribute('src', '/api/ideas/i1/images/0?v=alt')
    first.unmount()

    routeFetch({ 'GET /api/ideas/i1': () => withImage('neu') })
    renderAt('/ideas/i1')
    expect((await screen.findAllByRole('img'))[0]).toHaveAttribute('src', '/api/ideas/i1/images/0?v=neu')
  })
})

describe('IdeaPage credit line (F-027)', () => {
  it('AC-027-5/7 zeigt den Abschnitt vor dem Concept mit mailto-Link, ohne Login', async () => {
    routeFetch({
      'GET /api/ideas/i1': () => ({
        json: { ...base, categories: [], creditFirstName: 'Ada', creditLastName: 'Lovelace', creditEmail: 'ada@example.org', mediationConcept: 'Text' },
      }),
    })
    renderAt('/ideas/i1')
    const heading = await screen.findByRole('heading', { name: 'Credit line and contact information' })
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ada@example.org' })).toHaveAttribute('href', 'mailto:ada@example.org')
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(names.indexOf('Credit line and contact information')).toBe(names.indexOf('Mediation concept') - 1)
    expect(heading).toBeInTheDocument()
  })

  it('AC-027-6 zeigt ohne Angaben keinen Abschnitt, auch wenn die Felder fehlen', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [] } }) })
    renderAt('/ideas/i1')
    await screen.findByRole('heading', { name: 'Lichtinstallation' })
    expect(screen.queryByRole('heading', { name: 'Credit line and contact information' })).toBeNull()
  })
})

describe('IdeaPage status (F-030)', () => {
  it('AC-030-3 kennzeichnet eine Idee in Prüfung und zeigt die Begründung einer abgelehnten', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [], status: 'pending' } }) })
    const first = renderAt('/ideas/i1')
    expect(await screen.findByText('In review')).toBeInTheDocument()
    first.unmount()

    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [], status: 'rejected', rejectionReason: 'zu vage' } }) })
    renderAt('/ideas/i1')
    expect(await screen.findByText('Rejected')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('zu vage')
  })

  it('AC-030-10 zeigt bei veröffentlichten und alten Ideen keine Kennzeichnung', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [] } }) })
    renderAt('/ideas/i1')
    await screen.findByRole('heading', { name: 'Lichtinstallation' })
    expect(screen.queryByText('In review')).toBeNull()
  })
})

describe('IdeaPage links (F-031)', () => {
  const types = [{ id: 't', name: 'Tools' }, { id: 'r', name: 'Reference' }]
  it('AC-031-5/6 zeigt Links nach Typ gruppiert, öffnet sie in neuem Tab und zeigt die URL ohne Titel', async () => {
    routeFetch({
      'GET /api/link-types': () => ({ json: types }),
      'GET /api/ideas/i1': () => ({
        json: { ...base, categories: [], links: [{ url: 'https://a.org', title: 'Titel A', typeId: 't' }, { url: 'https://b.org', title: '', typeId: 'r' }] },
      }),
    })
    renderAt('/ideas/i1')
    const a = await screen.findByRole('link', { name: 'Titel A' })
    expect(a).toHaveAttribute('href', 'https://a.org')
    expect(a).toHaveAttribute('target', '_blank')
    expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: 'https://b.org' })).toBeInTheDocument()
    const heads = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(heads).toEqual(['Reference', 'Tools'])
  })
  it('AC-031-7 ohne Links gibt es keinen Abschnitt', async () => {
    routeFetch({ 'GET /api/link-types': () => ({ json: types }), 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [] } }) })
    renderAt('/ideas/i1')
    await screen.findByRole('heading', { name: 'Lichtinstallation' })
    expect(screen.queryByRole('heading', { name: 'Links' })).toBeNull()
  })
})

describe('IdeaPage delete (F-033)', () => {
  const idea = { ...base, categories: [] }
  it('AC-033-1 nur Admins sehen «Delete»', async () => {
    routeFetch({ 'GET /api/me': () => ({ json: { email: 'u@example.ch', role: 'user' } }), 'GET /api/ideas/i1': () => ({ json: idea }) })
    renderAt('/ideas/i1')
    await screen.findByRole('heading', { name: 'Lichtinstallation' })
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })
  it('AC-033-2 Bestätigen löscht und leitet um, Abbrechen sendet nichts', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => ({ json: { email: 'a@example.ch', role: 'admin' } }),
      'GET /api/ideas/i1': () => ({ json: idea }),
      'DELETE /api/ideas/i1': () => ({ status: 204 }),
      'GET /api/ideas': () => ({ json: [] }),
    })
    const u = userEvent.setup()
    renderAt('/ideas/i1')
    const del = await screen.findByRole('button', { name: 'Delete' })
    vi.stubGlobal('confirm', () => false)
    await u.click(del)
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false)
    vi.stubGlobal('confirm', () => true)
    await u.click(del)
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.url === '/api/ideas/i1')).toBe(true))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Lichtinstallation' })).toBeNull())
  })
})

describe('IdeaPage ICOM references (F-035)', () => {
  it('AC-035-7 zeigt die Referenzen jeder Kategorie, ohne Kategorien nichts', async () => {
    routeFetch({
      'GET /api/ideas/i1': () => ({ json: { ...base, categories: [], icomCategories: ['participation-cocreation', 'visitor-feedback'] } }),
    })
    const { unmount } = renderAt('/ideas/i1')
    await screen.findByRole('heading', { name: 'Lichtinstallation' })
    expect(screen.getByLabelText('ICOM references: S.2, S.3, G.6')).toHaveTextContent('S.2 · S.3 · G.6')
    expect(screen.getByText(/E\.4/)).toBeInTheDocument()
    unmount()
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: { ...base, categories: [] } }) })
    renderAt('/ideas/i1')
    await screen.findByRole('heading', { name: 'Lichtinstallation' })
    expect(screen.queryByLabelText(/ICOM references/)).toBeNull()
  })
})
