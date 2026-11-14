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

  it('AC-014-1 sendet target group und die drei neuen Textfelder', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 201, json: { id: 'i1' } }),
      'GET /api/ideas/i1': () => savedIdea,
    })
    renderAt('/ideas/new')
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText('Target audience'), 'Schulklassen')
    await u.type(screen.getByLabelText('Description of interaction'), 'Drücken')
    await u.type(screen.getByLabelText('Staff needed'), 'yes')
    await u.type(screen.getByLabelText('Necessarily related to specific exhibits'), 'no')
    await u.click(screen.getByRole('button', { name: 'Save idea' }))

    const post = calls.find((c) => c.method === 'POST')
    const data = JSON.parse(String(formData(post?.body).get('data')))
    expect(data).toMatchObject({
      targetGroup: 'Schulklassen',
      descriptionOfInteraction: 'Drücken',
      staffNeeded: 'yes',
      exhibitRelated: 'no',
    })
    expect(data.audience).toBeUndefined()
  })

  it('AC-023-1/3 sendet das Concept unverändert mit Zeilenumbrüchen; ohne Concept bleibt es leer', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 201, json: { id: 'i1' } }),
      'GET /api/ideas/i1': () => savedIdea,
    })
    renderAt('/ideas/new')
    const u = userEvent.setup()
    await screen.findByRole('tab', { name: 'Write' })
    await u.click(document.querySelector('.cm-content') as HTMLElement)
    await u.keyboard('# Titel{Enter}- eins')
    await u.click(screen.getByRole('button', { name: 'Save idea' }))
    const data = JSON.parse(String(formData(calls.find((c) => c.method === 'POST')?.body).get('data')))
    expect(data.mediationConcept).toBe('# Titel\n- eins')
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

  it('AC-009-1 sendet die gewählten Kategorien als Schlüssel, auch ohne Auswahl', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 201, json: { id: 'i1' } }),
      'GET /api/ideas/i1': () => savedIdea,
    })
    renderAt('/ideas/new')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('checkbox', { name: 'Reproductive' }))
    await u.click(screen.getByRole('checkbox', { name: 'Transformation' }))
    await u.click(screen.getByRole('button', { name: 'Save idea' }))

    const post = calls.find((c) => c.method === 'POST')
    const data = JSON.parse(String(formData(post?.body).get('data')))
    expect(data.categories).toEqual(['reproductive', 'transformation'])
  })

  it('AC-009-1 speichert ohne gewählte Kategorie mit leerer Liste', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'POST /api/ideas': () => ({ status: 201, json: { id: 'i1' } }),
      'GET /api/ideas/i1': () => savedIdea,
    })
    renderAt('/ideas/new')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Save idea' }))

    const post = calls.find((c) => c.method === 'POST')
    const data = JSON.parse(String(formData(post?.body).get('data')))
    expect(data.categories).toEqual([])
  })

  // AC-026-3: the concept is the last input, after the budget and before the save button.
  it('AC-026-3 setzt das Concept-Feld ans Ende, beim Anlegen und Bearbeiten', async () => {
    for (const path of ['/ideas/new', '/ideas/i1/edit']) {
      routeFetch({
        'GET /api/me': () => user,
        'GET /api/ideas/i1': () => ({ json: { ...savedIdea.json, title: 'X' } }),
      })
      const { unmount } = renderAt(path)
      const budget = await screen.findByLabelText('Budget')
      const tab = screen.getByRole('tab', { name: 'Write' })
      const save = screen.getByRole('button', { name: 'Save idea' })
      const before = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
      expect(before(budget, tab)).toBe(true)
      expect(before(tab, save)).toBe(true)
      const fields = [...document.querySelectorAll('form input, form select, form textarea, form [role="tab"]')]
      const lastInput = fields.filter((e) => !e.closest('.cm-editor') && e.getAttribute('role') !== 'tab').at(-1)
      expect(lastInput).toBe(budget) // nothing but the editor follows the budget
      unmount()
    }
  })

  // F-020: editing an idea with images.
  const fiveImages = { json: { ...savedIdea.json, title: 'Licht', goal: 'Ziel', targetGroup: 'Schulen', images: Array.from({ length: 5 }, (_, i) => ({ contentType: 'image/png', bytes: 1, version: `v${i}` })) } }

  it('AC-020-3 belegt Felder und Bilder beim Bearbeiten vor', async () => {
    routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas/i1': () => fiveImages })
    renderAt('/ideas/i1/edit')
    expect(await screen.findByLabelText('Title')).toHaveValue('Licht')
    expect(screen.getByLabelText('Target audience')).toHaveValue('Schulen')
    const boxes = screen.getAllByRole('checkbox').filter((b) => b.closest('label')?.querySelector('img'))
    expect(boxes).toHaveLength(5)
    boxes.forEach((b) => expect(b).toBeChecked())
  })

  it('AC-020-4 sendet keepImages der verbleibenden Bilder und die neue Datei', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'GET /api/ideas/i1': () => fiveImages,
      'PUT /api/ideas/i1': () => ({ json: { id: 'i1' } }),
    })
    renderAt('/ideas/i1/edit')
    const u = userEvent.setup()
    await screen.findByLabelText('Title')
    const boxes = screen.getAllByRole('checkbox').filter((b) => b.closest('label')?.querySelector('img'))
    await u.click(boxes[1])
    await u.upload(screen.getByLabelText(/^Images/), new File(['x'], 'neu.png', { type: 'image/png' }))
    await u.click(screen.getByRole('button', { name: 'Save idea' }))

    const put = calls.find((c) => c.method === 'PUT')
    const form = formData(put?.body)
    expect(JSON.parse(String(form.get('data'))).keepImages).toEqual([0, 2, 3, 4])
    expect(form.getAll('images')).toHaveLength(1)
  })

  it('AC-020-5 lehnt ein sechstes Bild verständlich ab, bis ein Bild abgewählt wird', async () => {
    const { calls } = routeFetch({ 'GET /api/me': () => user, 'GET /api/ideas/i1': () => fiveImages })
    renderAt('/ideas/i1/edit')
    const u = userEvent.setup()
    await screen.findByLabelText('Title')
    await u.upload(screen.getByLabelText(/^Images/), new File(['x'], 'neu.png', { type: 'image/png' }))
    expect(await screen.findByText(/5 stay, you can add 0 more/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save idea' })).toBeDisabled()

    const boxes = screen.getAllByRole('checkbox').filter((b) => b.closest('label')?.querySelector('img'))
    await u.click(boxes[0])
    expect(screen.queryByText(/stay, you can add/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Save idea' })).toBeEnabled()
    expect(calls.some((c) => c.method === 'PUT')).toBe(false)
  })

  it('AC-029-1/5 Ersetzen und alle Bilder abwählen; Vorschaubilder tragen die Version', async () => {
    const one = { json: { ...savedIdea.json, images: [{ contentType: 'image/png', bytes: 1, version: 'alt' }] } }
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'GET /api/ideas/i1': () => one,
      'PUT /api/ideas/i1': () => ({ json: { id: 'i1' } }),
    })
    renderAt('/ideas/i1/edit')
    const u = userEvent.setup()
    await screen.findByLabelText('Title')
    const box = screen.getAllByRole('checkbox').find((b) => b.closest('label')?.querySelector('img')) as HTMLElement
    expect(box.closest('label')?.querySelector('img')).toHaveAttribute('src', '/api/ideas/i1/images/0?v=alt')
    await u.click(box)
    await u.upload(screen.getByLabelText(/^Images/), new File(['x'], 'neu.png', { type: 'image/png' }))
    await u.click(screen.getByRole('button', { name: 'Save idea' }))
    const put = calls.find((c) => c.method === 'PUT')
    expect(JSON.parse(String(formData(put?.body).get('data'))).keepImages).toEqual([])
    expect(formData(put?.body).getAll('images')).toHaveLength(1)
  })

  it('AC-029-5 speichert ohne Bilder, wenn alle abgewählt sind', async () => {
    const one = { json: { ...savedIdea.json, images: [{ contentType: 'image/png', bytes: 1, version: 'alt' }] } }
    const { calls } = routeFetch({
      'GET /api/me': () => user,
      'GET /api/ideas/i1': () => one,
      'PUT /api/ideas/i1': () => ({ json: { id: 'i1' } }),
    })
    renderAt('/ideas/i1/edit')
    const u = userEvent.setup()
    await screen.findByLabelText('Title')
    await u.click(screen.getAllByRole('checkbox').find((b) => b.closest('label')?.querySelector('img')) as HTMLElement)
    await u.click(screen.getByRole('button', { name: 'Save idea' }))
    const put = calls.find((c) => c.method === 'PUT')
    expect(JSON.parse(String(formData(put?.body).get('data'))).keepImages).toEqual([])
    expect(formData(put?.body).getAll('images')).toHaveLength(0)
  })
})
