import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen, within } from '@testing-library/react'
import { renderAt, routeFetch } from '../test/helpers'

const user = { json: { email: 'a@example.ch', role: 'user' } }

// A complete idea as GET /api/ideas/{id} returns it, for the page that follows a save.
const savedIdea = {
  json: {
    id: 'i1',
    title: '',
    description: '',
    audience: '',
    goal: '',
    sustainability: '',
    accessibility: '',
    space: { areaM2: null, volumeM3: null },
    equipment: [],
    budget: null,
    images: [],
    createdAt: '2026-11-13T10:00:00Z',
  },
}

function formData(body: BodyInit | null | undefined): FormData {
  if (!(body instanceof FormData)) throw new Error('expected FormData')
  return body
}

describe('IdeaForm', () => {
  it('AC-002-2 speichert ein leeres Formular', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 201, json: { id: 'i1' } }),
      'GET /api/ideas/i1': () => savedIdea,
    })
    renderAt('/ideas/new')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Save idea' }))

    const post = calls.find((c) => c.method === 'POST')
    expect(post?.url).toBe('/api/ideas')
    const data = JSON.parse(String(formData(post?.body).get('data')))
    expect(data.title).toBe('')
    expect(data.budget).toBe('')
  })

  it('AC-002-3 lehnt mehr als 5 Bilder ab und sendet nichts', async () => {
    const { calls } = routeFetch({ 'GET /api/me': () => user })
    renderAt('/ideas/new')
    const picker = await screen.findByLabelText(/^Images/)

    const six = Array.from({ length: 6 }, (_, i) => new File(['x'], `bild${i}.png`, { type: 'image/png' }))
    await userEvent.setup().upload(picker, six)

    expect(await screen.findByText('At most 5 images can be uploaded.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save idea' })).toBeDisabled()
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('AC-002-3 lehnt ein Bild über 5 MB ab', async () => {
    routeFetch({ 'GET /api/me': () => user })
    renderAt('/ideas/new')
    const picker = await screen.findByLabelText(/^Images/)

    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'gross.png', { type: 'image/png' })
    await userEvent.setup().upload(picker, big)

    expect(await screen.findByText('Each image must be at most 5 MB.')).toBeInTheDocument()
  })

  it('AC-002-3 lehnt ein anderes Format als JPG, PNG oder WebP ab', async () => {
    routeFetch({ 'GET /api/me': () => user })
    renderAt('/ideas/new')
    const picker = await screen.findByLabelText(/^Images/)

    // applyAccept: false, because the accept attribute would filter the GIF out before the check runs.
    const u = userEvent.setup({ applyAccept: false })
    await u.upload(picker, new File(['GIF89a'], 'bild.gif', { type: 'image/gif' }))

    expect(await screen.findByText('Images must be JPG, PNG or WebP.')).toBeInTheDocument()
  })

  it('AC-002-4 bietet genau S, M, L und XL als Budget an', async () => {
    routeFetch({ 'GET /api/me': () => user })
    renderAt('/ideas/new')
    const select = await screen.findByLabelText('Budget')

    const options = within(select).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['—', 'S', 'M', 'L', 'XL'])
  })

  it('AC-002-5 sendet Fläche und Volumen als Zahlen-Text, Komma wird akzeptiert', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 201, json: { id: 'i1' } }),
      'GET /api/ideas/i1': () => savedIdea,
    })
    renderAt('/ideas/new')
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText('Area (m²)'), '2,5')
    await u.type(screen.getByLabelText('Volume (m³)'), '12.25')
    await u.click(screen.getByRole('button', { name: 'Save idea' }))

    const post = calls.find((c) => c.method === 'POST')
    const data = JSON.parse(String(formData(post?.body).get('data')))
    expect(data.space).toEqual({ areaM2: '2,5', volumeM3: '12.25' })
  })

  it('zeigt den Serverfehler und behält die Eingaben', async () => {
    routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 400, json: { error: 'Budget must be S, M, L, XL or empty.' } }),
    })
    renderAt('/ideas/new')
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText('Title'), 'Lichtinstallation')
    await u.click(screen.getByRole('button', { name: 'Save idea' }))

    expect(await screen.findByText('Budget must be S, M, L, XL or empty.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Lichtinstallation')
  })
})
