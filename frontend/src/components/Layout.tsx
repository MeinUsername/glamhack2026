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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-inherit no-underline hover:no-underline">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-indigo-600" />
          {t('app.name')}
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link to="/basket">{t('nav.basket')}</Link>
          <Link to="/ideas">{t('nav.ideas')}</Link>
          <Link to="/feedback-prompts">{t('nav.feedback')}</Link>
          {me.status === 'ready' && me.me.role === 'admin' && (
            <>
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
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 max-sm:py-5">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-x-4 gap-y-1 px-4 py-4 text-sm">
          <Link to="/imprint">{t('footer.imprint')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
        </div>
      </footer>
    </div>
  )
}
