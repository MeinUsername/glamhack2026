import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { button, card, errorText, h2, input, linkButton, muted, noticeText } from '../ui'
import type { FeedbackPrompt } from '../types'

const NEW = 'new'

// F-025: admin view of the category "Feedback-Prompt": title, description and one text, no versions.
export default function AdminFeedbackPrompts() {
  const { t } = useTranslation()
  const [list, setList] = useState<FeedbackPrompt[] | null>(null)
  const [editing, setEditing] = useState<string>('') // '' = none, NEW = creating, else the ID
  const [form, setForm] = useState({ title: '', description: '', text: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => setList(await api<FeedbackPrompt[]>('/api/admin/feedback-prompts')), [])
  useEffect(() => {
    load().catch(() => setError(t('feedback.loadError')))
  }, [load, t])

  function startNew() {
    setEditing(NEW)
    setForm({ title: '', description: '', text: '' })
    setMessage('')
    setError('')
  }

  function startEdit(p: FeedbackPrompt) {
    setEditing(p.id)
    setForm({ title: p.title, description: p.description, text: p.text ?? '' })
    setMessage('')
    setError('')
  }

  async function run(action: () => Promise<unknown>, done: string) {
    setMessage('')
    setError('')
    try {
      await action()
      await load()
      setMessage(done)
      return true
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('feedback.error'))
      return false
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const ok = await run(
      () =>
        editing === NEW
          ? api('/api/admin/feedback-prompts', { method: 'POST', json: form })
          : api(`/api/admin/feedback-prompts/${encodeURIComponent(editing)}`, { method: 'PUT', json: form }),
      t('feedback.admin.saved'),
    )
    if (ok) setEditing('')
  }

  async function remove(p: FeedbackPrompt) {
    if (!window.confirm(t('feedback.admin.confirmDelete', { title: p.title }))) return
    await run(() => api(`/api/admin/feedback-prompts/${encodeURIComponent(p.id)}`, { method: 'DELETE' }), t('feedback.admin.deleted'))
    if (editing === p.id) setEditing('')
  }

  async function move(index: number, delta: number) {
    if (!list) return
    const ids = list.map((p) => p.id)
    const j = index + delta
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    await run(() => api('/api/admin/feedback-prompts/order', { method: 'PUT', json: { ids } }), t('feedback.admin.moved'))
  }

  return (
    <section>
      <h2 className={h2}>{t('feedback.admin.title')}</h2>
      <p className={muted}>{t('feedback.admin.variables')}</p>
      {list === null && !error && <p className={muted}>{t('common.loading')}</p>}
      {list !== null && list.length === 0 && <p className={muted}>{t('feedback.empty')}</p>}
      {list !== null && list.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {list.map((p, i) => (
            <li key={p.id} className={`${card} flex flex-wrap items-center gap-3`}>
              <span className="min-w-0 flex-1 font-medium">{p.title}</span>
              <button type="button" className={linkButton} disabled={i === 0} aria-label={t('feedback.admin.up', { title: p.title })} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" className={linkButton} disabled={i === list.length - 1} aria-label={t('feedback.admin.down', { title: p.title })} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button type="button" className={linkButton} onClick={() => startEdit(p)}>
                {t('feedback.admin.edit')}
              </button>
              <button type="button" className={linkButton} onClick={() => remove(p)}>
                {t('feedback.admin.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing === '' && (
        <p className="mt-3">
          <button type="button" className={button} onClick={startNew}>
            {t('feedback.admin.new')}
          </button>
        </p>
      )}
      {editing !== '' && (
        <form onSubmit={save} className="mt-4 grid max-w-2xl gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">{t('feedback.admin.fieldTitle')}</span>
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">{t('feedback.admin.fieldDescription')}</span>
            <textarea className={input} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">{t('feedback.admin.fieldText')}</span>
            <textarea className={`${input} font-mono`} rows={12} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className={button}>
              {t('feedback.admin.save')}
            </button>
            <button type="button" className={linkButton} onClick={() => setEditing('')}>
              {t('feedback.admin.cancel')}
            </button>
          </div>
        </form>
      )}
      {message && <p role="status" className={`${noticeText} mt-3`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-3`}>{error}</p>}
    </section>
  )
}
