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
const idea = (id: string, title: string) => ({
  id,
  title,
  description: `Beschreibung ${title}`,
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
})

describe('AdminMasterPrompt', () => {
  beforeEach(() => localStorage.clear())
  afterEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage(undefined)
  })

  it('AC-008-4 speichert nicht, solange der Text dem aktuellen Stand entspricht', async () => {
    routeFetch({ ...admin, 'GET /api/admin/master-prompt': () => ({ json: { versions } }) })
    renderAt('/admin/master-prompt')
    const textarea = await screen.findByLabelText('Text')
    await waitFor(() => expect(textarea).toHaveValue('Neu {{ideas}}'))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await userEvent.setup().type(textarea, ' x')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('AC-008-4 meldet keine Änderung, wenn der Server keine Version anlegt', async () => {
    routeFetch({
      ...admin,
      'GET /api/admin/master-prompt': () => ({ json: { versions } }),
      'POST /api/admin/master-prompt': () => ({ json: { version: 2, created: false } }),
    })
    renderAt('/admin/master-prompt')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Text'), '!')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('No change, no version was created.')).toBeInTheDocument()
  })

  it('AC-008-5 nennt unbekannte Variablen vor dem Absenden und sendet nicht', async () => {
    const { calls } = routeFetch({ ...admin, 'GET /api/admin/master-prompt': () => ({ json: { versions } }) })
    renderAt('/admin/master-prompt')
    const textarea = await screen.findByLabelText('Text')
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
      'GET /api/admin/master-prompt': () => ({ json: { versions: current } }),
      'POST /api/admin/master-prompt/versions/1/restore': () => {
        current = [{ number: 3, text: 'Alt', authorEmail: 'admin@example.ch', createdAt: '2026-11-13T11:00:00Z' }, ...versions]
        return { json: { version: 3, created: true } }
      },
    })
    renderAt('/admin/master-prompt')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Restore' }))
    expect(await screen.findByText('Version 1 restored as new version 3.')).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'POST' && c.url === '/api/admin/master-prompt/versions/1/restore')).toBe(true)
    expect(screen.getByLabelText('Text')).toHaveValue('Alt')
  })

  it('AC-008-6 zeigt in der Vorschau die Ideen aus dem Korb und die Sprache auf Deutsch', async () => {
    localStorage.setItem(BASKET_KEY, JSON.stringify(['a', 'b']))
    await i18n.changeLanguage('de')
    routeFetch({
      ...admin,
      'GET /api/admin/master-prompt': () => ({ json: { versions: [{ ...versions[0], text: 'Ideen: {{ideas}} Sprache: {{language}}' }] } }),
      'GET /api/ideas/a': () => ({ json: idea('a', 'Erste') }),
      'GET /api/ideas/b': () => ({ json: idea('b', 'Zweite') }),
    })
    renderAt('/admin/master-prompt')
    await screen.findByLabelText('Text')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Vorschau' }))

    expect(await screen.findByText(/### Erste/)).toBeInTheDocument()
    expect(screen.getByText(/### Zweite/)).toBeInTheDocument()
    expect(screen.getByText(/Sprache: de \(Deutsch\)/)).toBeInTheDocument()
  })

  // AC-008-7: with an empty basket, {{ideas}} disappears from the preview.
  it('AC-008-7 ersetzt {{ideas}} in der Vorschau bei leerem Korb durch nichts', async () => {
    routeFetch({ ...admin, 'GET /api/admin/master-prompt': () => ({ json: { versions: [{ ...versions[0], text: 'Start{{ideas}}Ende' }] } }) })
    renderAt('/admin/master-prompt')
    await screen.findByLabelText('Text')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Preview' }))
    await waitFor(() => expect(screen.getByText('StartEnde')).toBeInTheDocument())
  })
})
