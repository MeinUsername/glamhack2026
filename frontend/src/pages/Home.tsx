import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PROJECT_CLAIM, PROJECT_NAME } from '../brand'
import { h1Long, markLong } from '../ui'

const card =
  'grid gap-2 rounded-card border-2 border-ink bg-paper p-8 text-ink no-underline hover:bg-coral-soft hover:text-ink max-sm:p-5'

// F-033: the landing page. Name and claim are not translated; the two cards are.
export default function Home() {
  const { t } = useTranslation()

  return (
    <section className="grid gap-8">
      <div className="rounded-card border-2 border-ink bg-paper px-8 py-14 max-sm:px-5">
        <h1 className={h1Long}>
          <span className={markLong}>{PROJECT_NAME}</span>
        </h1>
        <p className="m-0 max-w-2xl text-lg leading-[1.55] text-ink-2">{PROJECT_CLAIM}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/ideas" className={card}>
          <span className="font-display text-2xl font-semibold">{t('home.card.ideas.title')}</span>
          <span className="text-ink-2">{t('home.card.ideas.text')}</span>
        </Link>
        <Link to="/feedback-prompts" className={card}>
          <span className="font-display text-2xl font-semibold">{t('home.card.feedback.title')}</span>
          <span className="text-ink-2">{t('home.card.feedback.text')}</span>
        </Link>
      </div>
    </section>
  )
}
