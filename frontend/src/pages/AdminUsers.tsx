import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import type { AdminUser, Role } from '../types'
import { cell, errorText, h1, muted, noticeText, table } from '../ui'

export default function AdminUsers() {
  const me = useMe()
  if (me.status === 'loading') return <p className={muted}>Lade…</p>
  if (me.status === 'anonymous') return <Navigate to="/login" replace />
  if (me.me.role !== 'admin') return <p role="alert" className={errorText}>Nur für Admins.</p>
  return <UserTable />
}

function UserTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api<AdminUser[]>('/api/admin/users')
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Die Nutzer konnten nicht geladen werden.'))
  }, [])

  // Each action returns the refreshed list. The rules (own role, last admin) are checked on the server.
  async function run(request: () => Promise<AdminUser[]>, done: string) {
    setMessage('')
    setError('')
    try {
      setUsers(await request())
      setMessage(done)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Interner Fehler.')
    }
  }

  const setRole = (uid: string, role: Role) =>
    run(() => api<AdminUser[]>(`/api/admin/users/${uid}/role`, { method: 'POST', json: { role } }), 'Rolle gespeichert.')

  const setBlocked = (u: AdminUser) =>
    run(
      () => api<AdminUser[]>(`/api/admin/users/${u.uid}/disabled`, { method: 'POST', json: { disabled: !u.disabled } }),
      u.disabled ? 'Sperre aufgehoben.' : 'Nutzer gesperrt.',
    )

  return (
    <>
      <h1 className={h1}>Benutzer</h1>
      <p className={muted}>Rollen vergeben und Konten sperren. Du kannst deine eigene Rolle und Sperre nicht ändern.</p>
      {message && <p role="status" className={noticeText}>{message}</p>}
      {error && <p role="alert" className={errorText}>{error}</p>}
      {users.length > 0 ? (
        <table className={`${table} mt-4`}>
          <thead>
            <tr>
              <th className={cell}>E-Mail</th>
              <th className={cell}>Rolle</th>
              <th className={cell}>Status</th>
              <th className={cell} />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td className={cell}>{u.email}</td>
                <td className={cell}>
                  <select
                    aria-label={`Rolle von ${u.email}`}
                    value={u.role}
                    onChange={(e) => setRole(u.uid, e.target.value as Role)}
                    className="rounded border border-gray-400/50 bg-transparent px-1"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className={cell}>
                  {u.disabled ? <span className={errorText}>gesperrt</span> : 'aktiv'}
                </td>
                <td className={cell}>
                  <button type="button" className="cursor-pointer bg-transparent p-0 text-blue-600 dark:text-blue-400" onClick={() => setBlocked(u)}>
                    {u.disabled ? 'Entsperren' : 'Sperren'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={`${muted} mt-4`}>Noch keine Nutzer.</p>
      )}
    </>
  )
}
