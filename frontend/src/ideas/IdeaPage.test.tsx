import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
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
