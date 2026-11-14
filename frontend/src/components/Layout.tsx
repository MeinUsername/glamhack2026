import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '../auth/useMe'
import { useBasket } from '../basket/useBasket'
import { navLink, navLinkActive } from '../ui'
import LanguageSwitch from './LanguageSwitch'

const navClass = ({ isActive }: { isActive: boolean }) => `${navLink} ${isActive ? navLinkActive : ''}`

const basketClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink py-[7px] pr-[8px] pl-[18px] font-sans text-base font-bold no-underline hover:bg-ink hover:text-on-accent ${
    isActive ? 'bg-ink text-on-accent' : 'bg-paper text-ink'
  }`

// Header and navigation, shared by all pages.
export default function Layout() {
  const me = useMe()
  const { ids } = useBasket()
  const { t } = useTranslation()
  // The idea overview uses the full width, so its filter side panel starts at the left edge.
  const wide = useLocation().pathname === '/ideas'
  const width = wide ? 'max-w-none' : 'max-w-7xl'

  return (
    <div className="flex min-h-screen flex-col">
      <header>
        <div className={`mx-auto flex ${width} flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-8`}>
          <Link to="/" className="flex min-h-11 items-center gap-3 font-display text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink no-underline hover:text-ink">
            <span
              aria-hidden="true"
              className="inline-block h-[30px] w-[30px] shrink-0 rotate-[8deg] rounded-[10px] border-2 border-ink bg-coral"
            />
            {t('app.name')}
          </Link>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <NavLink to="/ideas" className={navClass}>
              {t('nav.ideas')}
            </NavLink>
            <NavLink to="/feedback-prompts" className={navClass}>
              {t('nav.feedback')}
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
                <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-coral px-1.5 font-mono text-[13px] text-ink">
                  {ids.length}
                </span>
              </NavLink>
              <LanguageSwitch />
            </span>
          </nav>
        </div>
      </header>
      <main className={`mx-auto w-full ${width} flex-1 px-4 pt-6 pb-16 sm:px-8 sm:pt-10`}>
        <Outlet />
      </main>
      <footer className="border-t-2 border-ink">
        <div className={`mx-auto flex ${width} flex-wrap items-center gap-x-6 gap-y-1 px-4 py-5 font-mono text-[13px] sm:px-8`}>
          <Link to="/imprint" className="inline-flex min-h-11 items-center text-ink no-underline hover:text-accent hover:underline">
            {t('footer.imprint')}
          </Link>
          <Link to="/terms" className="inline-flex min-h-11 items-center text-ink no-underline hover:text-accent hover:underline">
            {t('footer.terms')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
