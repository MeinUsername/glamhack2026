// Renders the master prompt in the browser (F-003 T1, reused by F-008 for the preview).
// Pure functions: no React, no storage, no network.
import type { Idea } from '../types'

export type LocaleCode = 'de' | 'en' | 'fr' | 'it'

export interface Locale {
  code: LocaleCode
  name: string // German name, as the spec requires (D5 of F-003)
}

// Names in German, whatever the interface language is.
const GERMAN_NAMES: Record<LocaleCode, string> = {
  de: 'Deutsch',
  en: 'Englisch',
  fr: 'Französisch',
  it: 'Italienisch',
}

const KNOWN_VARIABLES = ['ideas', 'language'] as const

// Turns an interface language into a Locale. Unknown codes fall back to English.
export function localeFor(code: string | undefined): Locale {
  const short = (code ?? '').slice(0, 2).toLowerCase()
  const known: LocaleCode = (['de', 'en', 'fr', 'it'] as const).includes(short as LocaleCode)
    ? (short as LocaleCode)
    : 'en'
  return { code: known, name: GERMAN_NAMES[known] }
}

// `de (Deutsch)`, `fr (Französisch)` (AC-003-4).
export function formatLanguage(locale: Locale): string {
  return `${locale.code} (${locale.name})`
}

// German decimal comma, as the prompt is read by German-speaking staff.
function number(n: number): string {
  return String(n).replace('.', ',')
}

// One block per idea. Empty fields are left out; images are not text and are not included.
export function formatIdea(idea: Idea): string {
  const lines: string[] = [`### ${idea.title.trim() || 'Idee ohne Titel'}`]
  const add = (label: string, value: string | null | undefined) => {
    const v = value?.trim()
    if (v) lines.push(`- ${label}: ${v}`)
  }
  add('Beschreibung', idea.description)
  add('Zielgruppe', idea.targetGroup)
  add('Ziel', idea.goal)
  add('Nachhaltigkeit', idea.sustainability)
  add('Barrierefreiheit', idea.accessibility)

  const space: string[] = []
  if (idea.space.areaM2 !== null) space.push(`${number(idea.space.areaM2)} m²`)
  if (idea.space.volumeM3 !== null) space.push(`Volumen ${number(idea.space.volumeM3)} m³`)
  add('Fläche', space.join(', '))

  if (idea.equipment.length > 0) lines.push(`- Ausstattung: ${idea.equipment.join(', ')}`)
  add('Budget', idea.budget)
  const credit = [[idea.creditFirstName, idea.creditLastName].map((v) => v?.trim()).filter(Boolean).join(' '), idea.creditInstitute?.trim(), idea.creditEmail?.trim()]
    .filter(Boolean)
    .join(', ')
  add('Credit Line', credit)
  const concept = idea.mediationConcept?.trim()
  if (concept) lines.push('', '#### Mediation Concept', concept)
  return lines.join('\n')
}

// Replaces {{ideas}} and {{language}}. Other {{…}} stay as they are.
// An empty basket turns {{ideas}} into an empty text (AC-008-7).
export function renderPrompt(template: string, ideas: Idea[], locale: Locale): string {
  const ideasText = ideas.map(formatIdea).join('\n\n')
  return template
    .replace(/\{\{ideas\}\}/g, () => ideasText)
    .replace(/\{\{language\}\}/g, () => formatLanguage(locale))
}

// Names used in {{…}} that the prompt does not know (AC-008-5). Same rule as the server.
export function unknownVariables(template: string): string[] {
  const names = new Set<string>()
  for (const m of template.matchAll(/\{\{([^{}]*)\}\}/g)) {
    const name = m[1].trim()
    if (!(KNOWN_VARIABLES as readonly string[]).includes(name)) names.add(name)
  }
  return [...names]
}
