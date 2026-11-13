import { Link } from 'react-router'
import { useMe } from '../auth/useMe'
import { h1, muted } from '../ui'

export default function Home() {
  const me = useMe()

  return (
    <>
      <h1 className={h1}>Hello World</h1>
      <p className={muted}>
        Eine kleine Hackathon-App: Go-Cloud-Function mit React, Login per E-Mail und Datei-Upload mit
        maximal 1 MB.
      </p>
      {me.status === 'ready' && (
        <>
          <p className="mt-4">
            Angemeldet als <strong>{me.me.email}</strong>.
          </p>
          <p className="mt-2">
            <Link to="/dashboard">Zu meinen Dateien</Link>
          </p>
        </>
      )}
      {me.status === 'anonymous' && (
        <p className="mt-4">
          <Link to="/login">Anmelden</Link> oder <Link to="/register">Konto erstellen</Link>.
        </p>
      )}
    </>
  )
}
