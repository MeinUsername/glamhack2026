import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { button, card, h1 } from '../ui'

// The start page: what the app is for and where to go next.
export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      <section className={`${card} px-6 py-10 text-center max-sm:px-4`}>
        <h1 className={`${h1} mt-0`}>{t('home.title')}</h1>
        <p className="mx-auto mb-6 max-w-xl text-slate-600 dark:text-slate-300">{t('home.intro')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/ideas" className={`${button} text-white no-underline hover:no-underline`}>
            {t('nav.ideas')}
          </Link>
          <Link
            to="/ideas/new"
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 font-medium text-inherit no-underline transition hover:bg-slate-100 hover:no-underline dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {t('home.newIdea')}
          </Link>
        </div>
      </section>
    </>
  )
}
