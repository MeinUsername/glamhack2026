import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { button, card, errorText, h1Compact, input, linkButton, muted, noticeText } from '../ui'
import type { LinkType } from '../types'

// F-031: admins maintain the link types. A type that an idea still uses cannot be deleted (the server answers 409).
export default function AdminLinkTypes() {
  const { t } = useTranslation()
  const me = useMe()
  const [list, setList] = useState<LinkType[] | null>(null)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState('')
  const [editName, setEditName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => setList(await api<LinkType[]>('/api/link-types')), [])
  useEffect(() => {
    load().catch(() => setError(t('linkTypes.loadError')))
  }, [load, t])

  if (me.status === 'ready' && me.me.role !== 'admin') return <p role="alert" className={errorText}>{t('admin.onlyAdmins')}</p>

  async function run(action: () => Promise<unknown>, done: string) {
    setMessage('')
    setError('')
    try {
      await action()
      await load()
      setMessage(done)
      return true
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('linkTypes.error'))
      return false
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault()
    if (await run(() => api('/api/admin/link-types', { method: 'POST', json: { name } }), t('linkTypes.added'))) setName('')
  }

  async function rename(event: FormEvent) {
    event.preventDefault()
    if (await run(() => api(`/api/admin/link-types/${encodeURIComponent(editing)}`, { method: 'PUT', json: { name: editName } }), t('linkTypes.renamed'))) setEditing('')
  }

  async function remove(ty: LinkType) {
    if (!window.confirm(t('linkTypes.confirmDelete', { name: ty.name }))) return
    await run(() => api(`/api/admin/link-types/${encodeURIComponent(ty.id)}`, { method: 'DELETE' }), t('linkTypes.deleted'))
  }

  return (
    <section>
      <h1 className={h1Compact}>{t('linkTypes.title')}</h1>
      <p className={muted}>{t('linkTypes.help')}</p>
      {list === null && !error && <p className={muted}>{t('common.loading')}</p>}
      {list !== null && list.length === 0 && <p className={muted}>{t('linkTypes.empty')}</p>}
      {list !== null && list.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {list.map((ty) => (
            <li key={ty.id} className={`${card} flex flex-wrap items-center gap-3`}>
              {editing === ty.id ? (
                <form onSubmit={rename} className="flex flex-1 flex-wrap gap-2">
                  <input className={input} aria-label={t('linkTypes.name')} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <button type="submit" className={button}>
                    {t('linkTypes.save')}
                  </button>
                  <button type="button" className={linkButton} onClick={() => setEditing('')}>
                    {t('linkTypes.cancel')}
                  </button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1 font-medium">{ty.name}</span>
                  <button type="button" className={linkButton} onClick={() => { setEditing(ty.id); setEditName(ty.name) }}>
                    {t('linkTypes.rename')}
                  </button>
                  <button type="button" className={linkButton} onClick={() => remove(ty)}>
                    {t('linkTypes.delete')}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="mt-4 flex max-w-xl flex-wrap gap-2">
        <input className={input} aria-label={t('linkTypes.newName')} placeholder={t('linkTypes.newName')} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className={button}>
          {t('linkTypes.add')}
        </button>
      </form>
      {message && <p role="status" className={`${noticeText} mt-3`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-3`}>{error}</p>}
    </section>
  )
}
