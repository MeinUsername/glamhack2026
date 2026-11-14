import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import i18n from '../i18n'
import { renderAt, routeFetch } from '../test/helpers'
import { fileName } from './PromptGenerator'

const user = { 'GET /api/me': () => ({ json: { email: 'u@example.ch', role: 'user' } }) }
const visitor = { 'GET /api/me': () => ({ status: 401, json: { error: 'nicht angemeldet' } }) }
const level = (id: string, title: string, text: string) => ({
  id,
  titles: { en: title, de: `${title} (de)` },
  descriptions: { en: `About ${title}` },
  text,
  version: 1,
})
const levels = (...list: ReturnType<typeof level>[]) => ({ 'GET /api/prompt-levels': () => ({ json: list }) })
const master = (text: string) => levels(level('standard', 'Standard', text))
const idea = (id: string, title: string) => ({
  [`GET /api/ideas/${id}`]: () => ({
    json: {
      id,
      title,
      description: `Text ${title}`,
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
  }),
})

// jsdom's Blob is not readable with Response, so the file is read with FileReader.
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(blob)
  })
}

function setBasket(ids: string[]) {
  localStorage.setItem('hackathon-basket', JSON.stringify(ids))
}

describe('PromptGenerator', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }))
  })
  afterEach(async () => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    await i18n.changeLanguage(undefined)
  })

  // AC-003-1: the preview shows the current master prompt with both ideas and the language.
  it('AC-003-1 zeigt die Vorschau mit beiden Ideen aus dem Korb und der Sprache Deutsch', async () => {
    setBasket(['a', 'b'])
    await i18n.changeLanguage('de')
    routeFetch({ ...user, ...master('Ideen:\n{{ideas}}\nSprache: {{language}}'), ...idea('a', 'Erste'), ...idea('b', 'Zweite') })
    renderAt('/basket')
    expect(await screen.findByText(/### Erste/)).toBeInTheDocument()
    expect(screen.getByText(/### Zweite/)).toBeInTheDocument()
    expect(screen.getByText(/Sprache: de \(Deutsch\)/)).toBeInTheDocument()
  })

  // AC-003-2: the file has exactly the preview text and the name prompt-JJJJ-MM-TT.md.
  it('AC-003-2 lädt genau den Text der Vorschau als .md-Datei herunter', async () => {
    setBasket(['a'])
    routeFetch({ ...user, ...master('Start {{ideas}} Ende'), ...idea('a', 'Erste') })
    const names: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download)
    })
    renderAt('/basket')
    await screen.findByText(/### Erste/)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Download' }))

    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/markdown;charset=utf-8')
    expect(await readBlob(blob)).toBe('Start ### Erste\n- Beschreibung: Text Erste Ende')
    expect(names).toEqual([fileName(new Date())])
  })

  // AC-003-3: the clipboard gets the same text as the preview.
  it('AC-003-3 legt denselben Text in die Zwischenablage', async () => {
    setBasket(['a'])
    const writeText = vi.fn(async () => {})
    routeFetch({ ...user, ...master('X {{ideas}}'), ...idea('a', 'Erste') })
    renderAt('/basket')
    const clicks = userEvent.setup() // user-event replaces navigator.clipboard, so the stub goes in after it
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await screen.findByText(/### Erste/)
    await clicks.click(screen.getByRole('button', { name: 'Copy to clipboard' }))

    expect(writeText).toHaveBeenCalledWith('X ### Erste\n- Beschreibung: Text Erste')
    expect(await screen.findByText('Copied to the clipboard.')).toBeInTheDocument()
  })

  // AC-003-4: the interface language French gives fr (Französisch).
  it('AC-003-4 setzt {{language}} bei Französisch auf fr (Französisch)', async () => {
    setBasket(['a'])
    await i18n.changeLanguage('fr')
    routeFetch({ ...user, ...master('{{language}}'), ...idea('a', 'Erste') })
    renderAt('/basket')
    expect(await screen.findByText('fr (Französisch)')).toBeInTheDocument()
  })

  // AC-003-5: a visitor does not get the generator and no master prompt is requested.
  it('AC-003-5 zeigt Besuchern keinen Generator und ruft den Master-Prompt nicht ab', async () => {
    setBasket(['a'])
    const { calls } = routeFetch({ ...visitor, ...master('{{ideas}}'), ...idea('a', 'Erste') })
    renderAt('/basket')
    expect(await screen.findByText('Sign in to build the prompt from your basket.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument()
    expect(calls.some((c) => c.url === '/api/prompt-levels')).toBe(false)
  })

  // AC-003-6: an empty basket disables both actions and explains why.
  it('AC-003-6 deaktiviert Herunterladen und Kopieren bei leerem Korb', async () => {
    routeFetch({ ...user, ...master('{{ideas}}') })
    renderAt('/basket')
    expect(await screen.findByText('Your basket is empty. Add ideas to build the prompt.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeDisabled()
  })

  // Q-003-11 (draft): without a master prompt, the hint replaces the preview and both actions are off.
  it('deaktiviert die Aktionen ohne Master-Prompt-Version und zeigt einen Hinweis', async () => {
    setBasket(['a'])
    routeFetch({ ...user, 'GET /api/prompt-levels': () => ({ json: [] }), ...idea('a', 'Erste') })
    renderAt('/basket')
    expect(await screen.findByText('There is no master prompt yet. An admin has to save one.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()
  })

  // AC-018-4: with two levels, copy asks first and runs with the chosen prompt.
  it('AC-018-4 fragt bei zwei Detailgraden nach der Wahl und kopiert den gewählten Prompt', async () => {
    setBasket(['a'])
    const writeText = vi.fn(async () => {})
    routeFetch({ ...user, ...levels(level('l1', 'Short', 'Kurz {{ideas}}'), level('l2', 'Long', 'Lang {{ideas}}')), ...idea('a', 'Erste') })
    renderAt('/basket')
    const clicks = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await screen.findByText(/Kurz ### Erste/)
    await clicks.click(screen.getByRole('button', { name: 'Copy to clipboard' }))

    expect(writeText).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('About Long')
    expect(screen.getByRole('radio', { name: /Short/ })).toBeChecked()
    await clicks.click(screen.getByRole('radio', { name: /Long/ }))
    await clicks.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(writeText).toHaveBeenCalledWith('Lang ### Erste\n- Beschreibung: Text Erste')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('AC-018-4 zeigt Titel und Beschreibung in der UI-Sprache, Rückfall Englisch', async () => {
    setBasket(['a'])
    await i18n.changeLanguage('de')
    routeFetch({ ...user, ...levels(level('l1', 'Short', 'K'), { ...level('l2', 'Long', 'L'), titles: { en: 'Long', de: '' } }), ...idea('a', 'Erste') })
    renderAt('/basket')
    await userEvent.setup().click(await screen.findByRole('button', { name: 'In die Zwischenablage' }))
    expect(await screen.findByRole('radio', { name: /Short \(de\)/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Long/ })).toBeInTheDocument()
  })

  it('AC-018-4 bricht ohne Aktion ab', async () => {
    setBasket(['a'])
    const writeText = vi.fn(async () => {})
    routeFetch({ ...user, ...levels(level('l1', 'Short', 'K'), level('l2', 'Long', 'L')), ...idea('a', 'Erste') })
    renderAt('/basket')
    const clicks = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await clicks.click(await screen.findByRole('button', { name: 'Copy to clipboard' }))
    await clicks.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(writeText).not.toHaveBeenCalled()
  })

  // AC-018-5: a single level runs without a dialog.
  it('AC-018-5 führt die Aktion bei einem Detailgrad ohne Dialog aus', async () => {
    setBasket(['a'])
    routeFetch({ ...user, ...master('X {{ideas}}'), ...idea('a', 'Erste') })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderAt('/basket')
    await screen.findByText(/### Erste/)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Download' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})
