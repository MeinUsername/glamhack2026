import { useTranslation } from 'react-i18next'
import { CONTACT_EMAIL, PROJECT_TITLE } from '../brand'
import { h1, h2 } from '../ui'

const FIELDS = ['operator', 'address', 'responsible'] as const

// F-028: the imprint, public. The details are not known yet and are marked as placeholders.
export default function Imprint() {
  const { t } = useTranslation()
  return (
    <article className="grid max-w-2xl gap-2">
      <h1 className={h1}>{t('imprint.title')}</h1>
      <p role="note" className="rounded-field border-2 border-ink bg-coral-soft px-4 py-3 text-ink">
        {t('imprint.todo')}
      </p>
      <p className="font-medium">{PROJECT_TITLE}</p>
      <section>
        <h2 className={h2}>{t('imprint.contact')}</h2>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
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
