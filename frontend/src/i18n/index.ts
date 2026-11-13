import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { de } from './locales/de'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { it } from './locales/it'

export const LANGUAGES = ['de', 'en', 'fr', 'it'] as const
export type Language = (typeof LANGUAGES)[number]

// The language names are shown in their own language, so they are not translated.
export const LANGUAGE_NAMES: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
}

export const STORAGE_KEY = 'lang'

// Order: a saved choice (localStorage), then the browser languages. Unknown languages fall back to English.
// The browser language is never written to storage: only an explicit choice is saved (Q-007-11).
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
      it: { translation: it },
    },
    supportedLngs: [...LANGUAGES],
    fallbackLng: 'en',
    load: 'languageOnly',
    interpolation: { escapeValue: false }, // React escapes the output
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: [],
    },
  })

// <html lang> follows the language on every change, including the first one.
function syncHtmlLang(lng: string) {
  document.documentElement.lang = lng
}
syncHtmlLang(i18n.resolvedLanguage ?? 'en')
i18n.on('languageChanged', syncHtmlLang)

// Saves an explicit choice (AC-007-3). Storage can be blocked; then the choice lasts for this page only.
export function chooseLanguage(lng: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // ignore: private mode or blocked storage
  }
  void i18n.changeLanguage(lng)
}

export default i18n
