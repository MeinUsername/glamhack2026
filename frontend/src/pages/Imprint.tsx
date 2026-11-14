import { useTranslation } from 'react-i18next'
import { h1, h2 } from '../ui'

const FIELDS = ['operator', 'address', 'contact', 'responsible'] as const

// F-028: the imprint, public. The details are not known yet and are marked as placeholders.
export default function Imprint() {
  const { t } = useTranslation()
  return (
    <article className="grid max-w-2xl gap-2">
      <h1 className={h1}>{t('imprint.title')}</h1>
      <p role="note" className="rounded-field border-2 border-ink bg-coral-soft px-4 py-3 text-ink">
        {t('imprint.todo')}
      </p>
      {FIELDS.map((f) => (
        <section key={f}>
          <h2 className={h2}>{t(`imprint.${f}`)}</h2>
          <p data-placeholder className="font-mono text-danger">
            {t('imprint.todo.value')}
          </p>
        </section>
      ))}
    </article>
  )
}
