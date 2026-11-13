import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import i18n, { chooseLanguage, STORAGE_KEY } from './index'
import LanguageSwitch from '../components/LanguageSwitch'
import { de } from './locales/de'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { it as itDict } from './locales/it'

// Sets what the browser reports and re-runs the detection (changeLanguage without a language).
function setBrowser(languages: string[]) {
  Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true })
}

async function detectWith(browser: string[]): Promise<string | undefined> {
  setBrowser(browser)
  await i18n.changeLanguage(undefined)
  return i18n.resolvedLanguage
}

describe('i18n', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  // AC-007-1: the browser language decides on the first visit (de-CH and fr-CA are reduced to the language).
  it('AC-007-1 nutzt die Browsersprache fr-CH als Französisch', async () => {
    expect(await detectWith(['fr-CH'])).toBe('fr')
  })

  // AC-007-5: an unsupported browser language falls back to English.
  it('AC-007-5 fällt bei nicht unterstützter Sprache (es) auf Englisch zurück', async () => {
    expect(await detectWith(['es-ES'])).toBe('en')
  })

  // AC-007-3: a saved choice wins over the browser language.
  it('AC-007-3 gewinnt die gespeicherte Wahl gegen die Browsersprache', async () => {
    localStorage.setItem(STORAGE_KEY, 'de')
    expect(await detectWith(['fr-CH'])).toBe('de')
  })

  // AC-007-2: switching changes the texts at once, on the same page, and saves the choice.
  it('AC-007-2 wechselt die Sprache sofort und speichert die Wahl', async () => {
    await i18n.changeLanguage('en')
    render(<LanguageSwitch />)
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'it')

    expect(i18n.resolvedLanguage).toBe('it')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('it')
    expect(document.documentElement.lang).toBe('it')
    expect(i18n.t('nav.files')).toBe('File')
  })

  it('chooseLanguage speichert die Wahl im localStorage', async () => {
    chooseLanguage('fr')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('fr')
    await i18n.changeLanguage('en')
  })

  // AC-007-4: every key exists in all four languages and is not empty.
  it('AC-007-4 hat in allen Sprachen für jeden Schlüssel einen nicht leeren Text', () => {
    const dictionaries = { de, fr, it: itDict }
    for (const [lng, dict] of Object.entries(dictionaries)) {
      for (const key of Object.keys(en)) {
        const value = dict[key as keyof typeof en]
        expect(value, `${lng}: ${key}`).toBeTruthy()
      }
    }
  })
})
