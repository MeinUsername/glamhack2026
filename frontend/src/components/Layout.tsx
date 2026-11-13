import { Link, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '../auth/useMe'
import { linkButton } from '../ui'
import LanguageSwitch from './LanguageSwitch'

// Header and navigation, shared by all pages.
export default function Layout() {
  const me = useMe()
  const { t } = useTranslation()

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-400/50 p-4">
        <Link to="/" className="font-semibold text-inherit no-underline">
          Hackathon App
        </Link>
        <nav className="flex flex-wrap items-center gap-3">
          <Link to="/basket">{t('nav.basket')}</Link>
          <Link to="/ideas">{t('nav.ideas')}</Link>
          {me.status === 'ready' && me.me.role === 'admin' && (
            <>
              <Link to="/dashboard">{t('nav.files')}</Link>
              <Link to="/admin/users">{t('nav.users')}</Link>
              <Link to="/admin/master-prompt">{t('nav.masterPrompt')}</Link>
              <Link to="/admin/import">{t('nav.import')}</Link>
            </>
          )}
          {/* F-012 D6: /login and /register are not linked from the public interface. */}
          {me.status === 'ready' && (
            <form action="/logout" method="post" className="inline">
              <button type="submit" className={linkButton}>
                {t('nav.logout')}
              </button>
            </form>
          )}
          <LanguageSwitch />
        </nav>
      </header>
      <main className="mx-auto max-w-2xl p-4 max-sm:p-3">
        <Outlet />
      </main>
    </>
  )
}
