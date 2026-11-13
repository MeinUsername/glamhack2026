import { Link, Outlet } from 'react-router'
import { useMe } from '../auth/useMe'
import { linkButton } from '../ui'

// Header and navigation, shared by all pages.
export default function Layout() {
  const me = useMe()

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-400/50 p-4">
        <Link to="/" className="font-semibold text-inherit no-underline">
          Hackathon App
        </Link>
        <nav className="flex flex-wrap items-center gap-3">
          {me.status === 'ready' && (
            <>
              <Link to="/dashboard">Dateien</Link>
              {me.me.role === 'admin' && <Link to="/admin/users">Benutzer</Link>}
              <form action="/logout" method="post" className="inline">
                <button type="submit" className={linkButton}>
                  Abmelden
                </button>
              </form>
            </>
          )}
          {me.status === 'anonymous' && (
            <>
              <Link to="/login">Anmelden</Link>
              <Link to="/register">Registrieren</Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-2xl p-4 max-sm:p-3">
        <Outlet />
      </main>
    </>
  )
}
