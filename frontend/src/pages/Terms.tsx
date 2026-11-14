import { useTranslation } from 'react-i18next'
import { h1, h2, muted } from '../ui'

const SECTIONS = [1, 2, 3, 4, 5, 6, 7] as const

// F-028: the Terms and Conditions, public. The text is a draft that has to be reviewed legally.
export default function Terms() {
  const { t } = useTranslation()
  return (
    <article className="grid max-w-2xl gap-2">
      <h1 className={h1}>{t('terms.title')}</h1>
      <p className={muted}>{t('terms.draft')}</p>
      {SECTIONS.map((n) => (
        <section key={n}>
          <h2 className={h2}>{t(`terms.s${n}.h`)}</h2>
          <p>{t(`terms.s${n}.p`)}</p>
        </section>
      ))}
    </article>
  )
}
