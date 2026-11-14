import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import i18n from '../i18n'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'

const prompts = [
  { id: 'f1', title: 'Feedback zur Idee', description: 'Für Rückmeldungen' },
  { id: 'f2', title: 'Zweiter', description: '' },
]

describe('FeedbackPrompts (F-025)', () => {
  it('AC-025-1 zeigt die Liste ohne Login mit Titel und Beschreibung', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized, 'GET /api/feedback-prompts': () => ({ json: prompts }) })
    renderAt('/feedback-prompts')
    expect(await screen.findByRole('heading', { name: 'Feedback zur Idee' })).toBeInTheDocument()
    expect(screen.getByText('Für Rückmeldungen')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Download' }).length).toBe(2)
  })

  it('AC-025-10 zeigt bei keinen Prompts einen Leerzustand statt eines Fehlers', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized, 'GET /api/feedback-prompts': () => ({ json: [] }) })
    renderAt('/feedback-prompts')
    expect(await screen.findByText('There are no feedback prompts yet.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('AC-025-3 kopiert den serverseitig gerenderten Text mit der Oberflächensprache', async () => {
    const urls: string[] = []
    const { fn } = routeFetch({ 'GET /api/me': () => unauthorized, 'GET /api/feedback-prompts': () => ({ json: prompts }) })
    const base = fn.getMockImplementation()!
    fn.mockImplementation(async (input, init) => {
      urls.push(String(input))
      return String(input).startsWith('/api/feedback-prompts/f1/render')
        ? new Response('Alle Ideen: ### X', { status: 200, headers: { 'Content-Type': 'text/markdown' } })
        : base(input, init)
    })
    await i18n.changeLanguage('de')
    renderAt('/feedback-prompts')
    const u = userEvent.setup()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await screen.findByRole('heading', { name: 'Feedback zur Idee' })
    await u.click(screen.getAllByRole('button', { name: 'In die Zwischenablage' })[0])
    expect(await screen.findByText('Prompt in die Zwischenablage kopiert.')).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith('Alle Ideen: ### X')
    expect(urls).toContain('/api/feedback-prompts/f1/render?lang=de')
  })

  it('AC-025-2 lädt den Prompt als Markdown-Datei herunter', async () => {
    const { fn } = routeFetch({ 'GET /api/me': () => unauthorized, 'GET /api/feedback-prompts': () => ({ json: prompts }) })
    const base = fn.getMockImplementation()!
    fn.mockImplementation(async (input, init) =>
      String(input).startsWith('/api/feedback-prompts/f1/render') ? new Response('Text', { status: 200 }) : base(input, init),
    )
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }))
    const names: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download)
    })
    renderAt('/feedback-prompts')
    await screen.findByRole('heading', { name: 'Feedback zur Idee' })
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Download' })[0])
    expect(await screen.findByText('Prompt downloaded.')).toBeInTheDocument()
    expect(names[0]).toMatch(/^feedback-prompt-feedback-zur-idee-\d{4}-\d{2}-\d{2}\.md$/)
    click.mockRestore()
  })
})
