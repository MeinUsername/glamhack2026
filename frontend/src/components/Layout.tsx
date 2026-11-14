import { Link, NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '../auth/useMe'
import { useBasket } from '../basket/useBasket'
import { navLink, navLinkActive } from '../ui'
import LanguageSwitch from './LanguageSwitch'

const navClass = ({ isActive }: { isActive: boolean }) => `${navLink} ${isActive ? navLinkActive : ''}`

const basketClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center gap-1 border-2 border-ink px-[14px] py-[8px] font-mono text-sm font-medium uppercase tracking-[0.04em] no-underline hover:bg-accent hover:text-on-accent ${
    isActive ? 'bg-ink text-on-accent' : 'bg-paper text-ink'
  }`

// Header and navigation, shared by all pages.
export default function Layout() {
  const me = useMe()
  const { ids } = useBasket()
  const { t } = useTranslation()

  return (
    <>
      <header className="bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3 text-xl font-bold tracking-[-0.02em] text-ink no-underline hover:text-ink">
            <span aria-hidden="true" className="inline-block h-7 w-7 shrink-0 border-2 border-ink bg-accent" />
            {t('app.name')}
          </Link>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <NavLink to="/ideas" className={navClass}>
              {t('nav.ideas')}
            </NavLink>
            {me.status === 'ready' && me.me.role === 'admin' && (
              <>
                <NavLink to="/admin/users" className={navClass}>
                  {t('nav.users')}
                </NavLink>
                <NavLink to="/admin/master-prompt" className={navClass}>
                  {t('nav.masterPrompt')}
                </NavLink>
                <NavLink to="/admin/import" className={navClass}>
                  {t('nav.import')}
                </NavLink>
              </>
            )}
            {/* F-012 D6: /login and /register are not linked from the public interface. */}
            {me.status === 'ready' && (
              <form action="/logout" method="post" className="inline-flex">
                <button type="submit" className={`${navLink} cursor-pointer bg-transparent`}>
                  {t('nav.logout')}
                </button>
              </form>
            )}
            <span className="ml-2 inline-flex flex-wrap items-center gap-2">
              <NavLink to="/basket" className={basketClass}>
                {t('nav.basket')}{' '}
                <span>
                  <span aria-hidden="true">[</span>
                  {ids.length}
                  <span aria-hidden="true">]</span>
                </span>
              </NavLink>
              <LanguageSwitch />
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-10">
        <Outlet />
      </main>
    </>
  )
}
