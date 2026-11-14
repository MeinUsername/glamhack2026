import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { button, buttonSecondary, h1Long, markLong } from '../ui'

// The start page: what the app is for and where to go next.
export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      <section className="rounded-card border-2 border-ink bg-paper px-8 py-14 max-sm:px-5">
        <h1 className={h1Long}>
          <span className={markLong}>{t('home.title')}</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg leading-[1.55] text-ink-2">{t('home.intro')}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/ideas" className={button}>
            {t('nav.ideas')}
          </Link>
          <Link
            to="/ideas/new"
            className={buttonSecondary}
          >
            {t('home.newIdea')}
          </Link>
        </div>
      </section>
    </>
  )
}
