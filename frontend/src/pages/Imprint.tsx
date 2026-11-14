import { useTranslation } from 'react-i18next'
import { h1, h2 } from '../ui'

const FIELDS = ['operator', 'address', 'contact', 'responsible'] as const

// F-028: the imprint, public. The details are not known yet and are marked as placeholders.
export default function Imprint() {
  const { t } = useTranslation()
  return (
    <article className="grid max-w-2xl gap-2">
      <h1 className={h1}>{t('imprint.title')}</h1>
      <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        {t('imprint.todo')}
      </p>
      {FIELDS.map((f) => (
        <section key={f}>
          <h2 className={h2}>{t(`imprint.${f}`)}</h2>
          <p data-placeholder className="font-mono text-amber-700 dark:text-amber-300">
            {t('imprint.todo.value')}
          </p>
        </section>
      ))}
    </article>
  )
}
