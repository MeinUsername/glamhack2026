import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '../auth/useMe'
import { h1, muted } from '../ui'

export default function Home() {
  const me = useMe()
  const { t } = useTranslation()

  return (
    <>
      <h1 className={h1}>{t('home.title')}</h1>
      <p className={muted}>{t('home.intro')}</p>
      <p className="mt-4">
        <Link to="/ideas">{t('nav.ideas')}</Link>
      </p>
      {me.status === 'ready' && me.me.role === 'admin' && (
        <p className="mt-2">
          <Link to="/dashboard">{t('home.toFiles')}</Link>
        </p>
      )}
    </>
  )
}
