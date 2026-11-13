import { useTranslation } from 'react-i18next'
import { chooseLanguage, LANGUAGE_NAMES, LANGUAGES, type Language } from '../i18n'

// The language choice in the header. The choice is saved, so it wins over the browser language next time.
export default function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'en') as Language
  return (
    <select
      aria-label={t('nav.language')}
      value={current}
      onChange={(e) => chooseLanguage(e.target.value as Language)}
      className="rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-sm dark:border-slate-700 dark:bg-slate-900"
    >
      {LANGUAGES.map((lng) => (
        <option key={lng} value={lng}>
          {LANGUAGE_NAMES[lng]}
        </option>
      ))}
    </select>
  )
}
