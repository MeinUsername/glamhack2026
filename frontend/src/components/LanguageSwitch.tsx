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
      className="rounded border border-gray-400/50 bg-transparent px-1 text-sm"
    >
      {LANGUAGES.map((lng) => (
        <option key={lng} value={lng}>
          {LANGUAGE_NAMES[lng]}
        </option>
      ))}
    </select>
  )
}
