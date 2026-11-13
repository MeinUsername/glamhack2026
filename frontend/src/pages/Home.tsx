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
      {me.status === 'ready' && (
        <>
          <p className="mt-4">{t('home.signedInAs', { email: me.me.email })}</p>
          <p className="mt-2">
            <Link to="/dashboard">{t('home.toFiles')}</Link>
          </p>
        </>
      )}
      {me.status === 'anonymous' && (
        <p className="mt-4">
          <Link to="/login">{t('nav.login')}</Link> {t('home.or')}{' '}
          <Link to="/register">{t('home.createAccount')}</Link>.
        </p>
      )}
    </>
  )
}
