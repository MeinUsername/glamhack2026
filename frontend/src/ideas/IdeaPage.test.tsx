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
})
