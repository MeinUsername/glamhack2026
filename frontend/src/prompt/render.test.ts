import { describe, expect, it } from 'vitest'
import type { Idea } from '../types'
import { formatIdea, localeFor, renderPrompt, unknownVariables } from './render'

const base: Idea = {
  id: '1',
  title: 'Lichtkabine',
  description: 'Eine Kabine aus Licht.',
  audience: 'Schulklassen',
  goal: '',
  sustainability: '',
  accessibility: 'Rollstuhlgerecht',
  space: { areaM2: 2.5, volumeM3: null },
  equipment: ['Beamer', 'Lautsprecher'],
  categories: [],
  budget: 'M',
  images: [],
  createdAt: '2026-11-13T10:00:00Z',
}
const second: Idea = {
  ...base,
  id: '2',
  title: 'Zweite',
  description: '',
  audience: '',
  accessibility: '',
  equipment: [],
  budget: null,
  space: { areaM2: null, volumeM3: null },
}
const de = localeFor('de')

// AC-008-6 (the rendering part; the page test covers the basket).
describe('renderPrompt', () => {
  it('ersetzt {{ideas}} durch alle Felder der Ideen in Korbreihenfolge', () => {
    const out = renderPrompt('Start {{ideas}} Ende', [base, second], de)
    expect(out).toBe(
      'Start ### Lichtkabine\n- Beschreibung: Eine Kabine aus Licht.\n- Zielgruppe: Schulklassen\n- Barrierefreiheit: Rollstuhlgerecht\n- Fläche: 2,5 m²\n- Ausstattung: Beamer, Lautsprecher\n- Budget: M\n\n### Zweite Ende',
    )
  })

  it('setzt {{language}} als code (Name) ein', () => {
    expect(renderPrompt('{{language}}', [], de)).toBe('de (Deutsch)')
    expect(renderPrompt('{{language}}', [], localeFor('fr'))).toBe('fr (Französisch)')
    expect(renderPrompt('{{language}}', [], localeFor('it'))).toBe('it (Italienisch)')
  })

  // AC-008-7: an empty basket leaves an empty text.
  it('ersetzt {{ideas}} bei leerem Korb durch einen leeren Text', () => {
    expect(renderPrompt('A{{ideas}}B', [], de)).toBe('AB')
  })

  it('lässt unbekannte Platzhalter stehen', () => {
    expect(renderPrompt('{{foo}} {{ideas}}', [], de)).toBe('{{foo}} ')
  })

  it('fügt keine leeren Felder und keine Bilder ein', () => {
    expect(formatIdea(second)).toBe('### Zweite')
  })
})

describe('unknownVariables', () => {
  it('nennt nur Namen, die weder ideas noch language sind', () => {
    expect(unknownVariables('{{ideas}} {{foo}} {{ language }} {{foo}} {{bar}}')).toEqual(['foo', 'bar'])
  })
})
