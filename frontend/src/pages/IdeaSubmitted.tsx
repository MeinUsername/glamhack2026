import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { buttonSecondary, h1Compact, muted } from '../ui'

// F-030 O1: after submitting, a non-admin cannot see the idea until it is published, so this page confirms it.
export default function IdeaSubmitted() {
  const { t } = useTranslation()
  return (
    <section className="grid max-w-2xl gap-4">
      <h1 className={`${h1Compact} mb-0`}>{t('submitted.title')}</h1>
      <p className={muted}>{t('submitted.text')}</p>
      <p>
        <Link to="/ideas" className={buttonSecondary}>
          {t('submitted.back')}
        </Link>
      </p>
    </section>
  )
}
