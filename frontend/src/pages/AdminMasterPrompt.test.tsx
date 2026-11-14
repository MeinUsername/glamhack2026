import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import i18n from '../i18n'
import { BASKET_KEY } from '../basket/basket'
import { renderAt, routeFetch } from '../test/helpers'

const admin = { 'GET /api/me': () => ({ json: { email: 'admin@example.ch', role: 'admin' } }) }
const versions = [
  { number: 2, text: 'Neu {{ideas}}', authorEmail: 'admin@example.ch', createdAt: '2026-11-13T10:00:00Z' },
  { number: 1, text: 'Alt', authorEmail: 'admin@example.ch', createdAt: '2026-11-12T10:00:00Z' },
]
const level = (versionList: typeof versions, extra = {}) => ({
  id: 'standard',
  titles: { en: 'Standard' },
  descriptions: { en: 'Std' },
  text: versionList[0].text,
  version: versionList[0].number,
  versions: versionList,
  ...extra,
})
const idea = (id: string, title: string) => ({
  id,
  title,
  description: `Beschreibung ${title}`,
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
})

describe('AdminMasterPrompt', () => {
  beforeEach(() => localStorage.clear())
  afterEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage(undefined)
  })

  it('AC-008-4 speichert nicht, solange der Text dem aktuellen Stand entspricht', async () => {
    routeFetch({ ...admin, 'GET /api/admin/prompt-levels': () => ({ json: [level(versions)] }) })
    renderAt('/admin/master-prompt')
    const textarea = await screen.findByLabelText('Text', { selector: 'textarea' })
    await waitFor(() => expect(textarea).toHaveValue('Neu {{ideas}}'))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await userEvent.setup().type(textarea, ' x')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('AC-008-4 meldet keine Änderung, wenn der Server keine Version anlegt', async () => {
    routeFetch({
      ...admin,
      'GET /api/admin/prompt-levels': () => ({ json: [level(versions)] }),
      'PUT /api/admin/prompt-levels/standard': () => ({ json: { version: 2, created: false } }),
    })
    renderAt('/admin/master-prompt')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Text', { selector: 'textarea' }), '!')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('No change, no version was created.')).toBeInTheDocument()
  })

  it('AC-008-5 nennt unbekannte Variablen vor dem Absenden und sendet nicht', async () => {
    const { calls } = routeFetch({ ...admin, 'GET /api/admin/prompt-levels': () => ({ json: [level(versions)] }) })
    renderAt('/admin/master-prompt')
    const textarea = await screen.findByLabelText('Text', { selector: 'textarea' })
    // fireEvent: user-event reads "{{" as a key escape, so the placeholder would not be typed as written.
    fireEvent.change(textarea, { target: { value: 'Hallo {{foo}}' } })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Unknown variables: foo. Allowed are ideas and language.')).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('AC-008-3 stellt eine ältere Version als neue Version wieder her', async () => {
    let current = versions
    const { calls } = routeFetch({
      ...admin,
      'GET /api/admin/prompt-levels': () => ({ json: [level(current)] }),
      'POST /api/admin/prompt-levels/standard/versions/1/restore': () => {
        current = [{ number: 3, text: 'Alt', authorEmail: 'admin@example.ch', createdAt: '2026-11-13T11:00:00Z' }, ...versions]
        return { json: { version: 3, created: true } }
      },
    })
    renderAt('/admin/master-prompt')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Restore' }))
    expect(await screen.findByText('Version 1 restored as new version 3.')).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'POST' && c.url === '/api/admin/prompt-levels/standard/versions/1/restore')).toBe(true)
    expect(screen.getByLabelText('Text', { selector: 'textarea' })).toHaveValue('Alt')
  })

  it('AC-008-6 zeigt in der Vorschau die Ideen aus dem Korb und die Sprache auf Deutsch', async () => {
    localStorage.setItem(BASKET_KEY, JSON.stringify(['a', 'b']))
    await i18n.changeLanguage('de')
    routeFetch({
      ...admin,
      'GET /api/admin/prompt-levels': () => ({ json: [level([{ ...versions[0], text: 'Ideen: {{ideas}} Sprache: {{language}}' }])] }),
      'GET /api/ideas/a': () => ({ json: idea('a', 'Erste') }),
      'GET /api/ideas/b': () => ({ json: idea('b', 'Zweite') }),
    })
    renderAt('/admin/master-prompt')
    await screen.findByLabelText('Text', { selector: 'textarea' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Vorschau' }))

    expect(await screen.findByText(/### Erste/)).toBeInTheDocument()
    expect(screen.getByText(/### Zweite/)).toBeInTheDocument()
    expect(screen.getByText(/Sprache: de \(Deutsch\)/)).toBeInTheDocument()
  })

  // AC-008-7: with an empty basket, {{ideas}} disappears from the preview.
  it('AC-008-7 ersetzt {{ideas}} in der Vorschau bei leerem Korb durch nichts', async () => {
    routeFetch({ ...admin, 'GET /api/admin/prompt-levels': () => ({ json: [level([{ ...versions[0], text: 'Start{{ideas}}Ende' }])] }) })
    renderAt('/admin/master-prompt')
    await screen.findByLabelText('Text', { selector: 'textarea' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Preview' }))
    await waitFor(() => expect(screen.getByText('StartEnde')).toBeInTheDocument())
  })

  // AC-018-1: a new level needs the English title and description, then it is created with POST.
  it('AC-018-1 legt einen Detailgrad mit englischem Titel und Beschreibung an', async () => {
    const { calls } = routeFetch({
      ...admin,
      'GET /api/admin/prompt-levels': () => ({ json: [level(versions)] }),
      'POST /api/admin/prompt-levels': () => ({ status: 201, json: { id: 'n1', version: 1, created: true } }),
    })
    renderAt('/admin/master-prompt')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'New detail level' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.type(screen.getByLabelText('Title (English)'), 'Short')
    await user.type(screen.getByLabelText('Description (English)'), 'Briefly')
    await user.type(screen.getByLabelText('Text', { selector: 'textarea' }), 'Kurz')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Detail level created.')).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST')
    expect(JSON.parse(String(post?.body))).toEqual({ titles: { en: 'Short' }, descriptions: { en: 'Briefly' }, text: 'Kurz' })
  })

  // AC-018-2: the last level cannot be deleted; with two it can.
  it('AC-018-2 sperrt das Löschen des letzten Detailgrads', async () => {
    routeFetch({ ...admin, 'GET /api/admin/prompt-levels': () => ({ json: [level(versions)] }) })
    renderAt('/admin/master-prompt')
    expect(await screen.findByRole('button', { name: 'Delete' })).toBeDisabled()
  })

  it('AC-018-2 ändert die Reihenfolge über die API', async () => {
    const two = [level(versions), level(versions, { id: 'b', titles: { en: 'Second' } })]
    const { calls } = routeFetch({
      ...admin,
      'GET /api/admin/prompt-levels': () => ({ json: two }),
      'PUT /api/admin/prompt-levels/order': () => ({ json: { ok: true } }),
    })
    renderAt('/admin/master-prompt')
    const down = (await screen.findAllByRole('button', { name: 'Move down' }))[0]
    await userEvent.setup().click(down)
    await waitFor(() => {
      const put = calls.find((c) => c.method === 'PUT')
      expect(JSON.parse(String(put?.body))).toEqual({ ids: ['b', 'standard'] })
    })
  })
})

describe('AdminMasterPrompt: Kategorie Feedback-Prompt (F-025)', () => {
  it('AC-025-4/5 wechselt die Kategorie, legt einen Feedback-Prompt an und zeigt Serverfehler', async () => {
    const { calls } = routeFetch({
      ...admin,
      'GET /api/admin/prompt-levels': () => ({ json: [level(versions)] }),
      'GET /api/admin/feedback-prompts': () => ({ json: [] }),
      'POST /api/admin/feedback-prompts': (req) => {
        const body = JSON.parse(String(req.body))
        return body.text.includes('{{ideas}}')
          ? { status: 400, json: { error: 'unbekannte Variablen: ideas', unknown: ['ideas'] } }
          : { status: 201, json: { id: 'f1' } }
      },
    })
    renderAt('/admin/master-prompt')
    const u = userEvent.setup()
    // the master prompts stay the default and are unchanged (AC-025-5)
    expect(await screen.findByRole('tab', { name: 'Master prompts' })).toHaveAttribute('aria-selected', 'true')
    expect(calls.some((c) => c.url === '/api/admin/feedback-prompts')).toBe(false)

    await u.click(screen.getByRole('tab', { name: 'Feedback prompts' }))
    expect(await screen.findByText('There are no feedback prompts yet.')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'New feedback prompt' }))
    await u.type(screen.getByLabelText('Title'), 'Feedback')
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Alle: {{ideas}}' } })
    await u.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('unbekannte Variablen: ideas')

    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Alle: {{allideas}}' } })
    await u.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    const post = calls.filter((c) => c.method === 'POST').at(-1)
    expect(JSON.parse(String(post?.body))).toMatchObject({ title: 'Feedback', text: 'Alle: {{allideas}}' })
  })
})
