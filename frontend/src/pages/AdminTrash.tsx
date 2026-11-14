import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { button, card, errorText, h1Compact, muted, noticeText } from '../ui'

interface TrashRow {
  id: string
  title: string
  deletedAt: string
}

// F-033: the removed ideas. Restoring brings the idea back with all fields and images.
export default function AdminTrash() {
  const { t, i18n } = useTranslation()
  const me = useMe()
  const [list, setList] = useState<TrashRow[] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => setList(await api<TrashRow[]>('/api/admin/trash')), [])
  useEffect(() => {
    load().catch(() => setError(t('trash.loadError')))
  }, [load, t])

  if (me.status === 'ready' && me.me.role !== 'admin') return <p role="alert" className={errorText}>{t('admin.onlyAdmins')}</p>

  async function restore(row: TrashRow) {
    setMessage('')
    setError('')
    try {
      await api(`/api/admin/trash/${encodeURIComponent(row.id)}/restore`, { method: 'POST' })
      setList((l) => (l ?? []).filter((r) => r.id !== row.id))
      setMessage(t('trash.restored', { title: row.title || t('ideas.untitled') }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('trash.error'))
    }
  }

  return (
    <section>
      <h1 className={h1Compact}>{t('trash.title')}</h1>
      <p className={muted}>{t('trash.help')}</p>
      {list === null && !error && <p className={muted}>{t('common.loading')}</p>}
      {list !== null && list.length === 0 && <p className={muted}>{t('trash.empty')}</p>}
      {list !== null && list.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {list.map((r) => (
            <li key={r.id} className={`${card} flex flex-wrap items-center gap-3`}>
              <span className="min-w-0 flex-1 font-medium">{r.title || t('ideas.untitled')}</span>
              <span className={muted}>{new Date(r.deletedAt).toLocaleDateString(i18n.resolvedLanguage)}</span>
              <button type="button" className={button} onClick={() => restore(r)}>
                {t('trash.restore')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p role="status" className={`${noticeText} mt-3`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-3`}>{error}</p>}
      <p className="mt-4"><Link to="/ideas">{t('nav.ideas')}</Link></p>
    </section>
  )
}
