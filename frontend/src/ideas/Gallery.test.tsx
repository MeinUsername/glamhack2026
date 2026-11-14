import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, within } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'

const image = { contentType: 'image/jpeg', bytes: 1000 }
const idea = (count: number) => ({
  id: 'i1',
  title: 'Talking hour',
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
  categories: [],
  budget: null,
  images: Array.from({ length: count }, () => image),
  createdAt: '2026-11-14T10:00:00Z',
})

function shownImage() {
  const dialog = screen.getByRole('dialog', { name: 'Talking hour: pictures' })
  return within(dialog).getByRole('img', { name: /^Talking hour, image \d$/ })
}

describe('Gallery on the idea page', () => {
  it('öffnet ein Bild gross und blättert mit Knöpfen und Pfeiltasten', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: idea(3) }) })
    renderAt('/ideas/i1')
    const u = userEvent.setup()

    await u.click(await screen.findByRole('button', { name: 'Enlarge Talking hour, image 2 of 3' }))
    expect(shownImage()).toHaveAttribute('src', '/api/ideas/i1/images/1')
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()

    await u.click(screen.getByRole('button', { name: 'Next image' }))
    expect(shownImage()).toHaveAttribute('src', '/api/ideas/i1/images/2')

    await u.keyboard('{ArrowRight}') // wraps around to the first
    expect(shownImage()).toHaveAttribute('src', '/api/ideas/i1/images/0')

    await u.keyboard('{ArrowLeft}')
    expect(shownImage()).toHaveAttribute('src', '/api/ideas/i1/images/2')

    await u.click(screen.getByRole('button', { name: 'Show image 2 of 3' }))
    expect(shownImage()).toHaveAttribute('src', '/api/ideas/i1/images/1')
    expect(screen.getByRole('button', { name: 'Show image 2 of 3' })).toHaveAttribute('aria-current', 'true')
  })

  it('schliesst mit Escape und gibt den Fokus zurück', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: idea(2) }) })
    renderAt('/ideas/i1')
    const u = userEvent.setup()
    const opener = await screen.findByRole('button', { name: 'Enlarge Talking hour, image 1 of 2' })

    await u.click(opener)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await u.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('zeigt bei einem Bild keine Blätter-Knöpfe', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: idea(1) }) })
    renderAt('/ideas/i1')
    const u = userEvent.setup()

    await u.click(await screen.findByRole('button', { name: 'Enlarge Talking hour, image 1 of 1' }))
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Previous image' })).toBeNull()
    await u.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('zeigt ohne Bilder keine Galerie', async () => {
    routeFetch({ 'GET /api/ideas/i1': () => ({ json: idea(0) }) })
    renderAt('/ideas/i1')
    expect(await screen.findByRole('heading', { name: 'Talking hour' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Pictures' })).toBeNull()
  })
})
