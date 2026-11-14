import { useCallback, useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import MarkdownView from '../components/MarkdownView'
import { imageUrl } from '../ideas/imageUrl'
import { button, buttonSecondary, card, errorText, h1Compact, input, muted, noticeText } from '../ui'
import type { Idea } from '../types'

// F-030: the approvals page. Admins publish or reject the ideas that wait for review.
export default function AdminApprovals() {
  const me = useMe()
  const { t } = useTranslation()
  if (me.status === 'loading') return <p className={muted}>{t('common.loading')}</p>
  if (me.status === 'anonymous') return <Navigate to="/login" replace />
  if (me.me.role !== 'admin') return <p role="alert" className={errorText}>{t('admin.onlyAdmins')}</p>
  return <Approvals />
}

function Approvals() {
  const { t } = useTranslation()
  const [list, setList] = useState<Idea[] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => setList(await api<Idea[]>('/api/admin/approvals')), [])
  useEffect(() => {
    load().catch(() => setError(t('approvals.loadError')))
  }, [load, t])

  // After a decision the idea leaves the list; a 409 means another admin was faster, so the list is reloaded.
  async function decide(id: string, action: 'publish' | 'reject', reason: string) {
    setMessage('')
    setError('')
    try {
      await api(`/api/admin/approvals/${encodeURIComponent(id)}/${action}`, { method: 'POST', json: { reason } })
      setList((l) => (l ? l.filter((i) => i.id !== id) : l))
      setMessage(t(action === 'publish' ? 'approvals.published' : 'approvals.rejected'))
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409 ? t('approvals.conflict') : t('approvals.error'))
      if (e instanceof ApiError && e.status === 409) await load().catch(() => {})
    }
  }

  return (
    <>
      <h1 className={`${h1Compact} mb-4`}>{t('approvals.title')}</h1>
      {list === null && !error && <p className={muted}>{t('common.loading')}</p>}
      {list !== null && list.length === 0 && <p className={muted}>{t('approvals.empty')}</p>}
      {list !== null && list.length > 0 && (
        <ul className="grid gap-5">
          {list.map((idea) => (
            <Pending key={idea.id} idea={idea} onDecide={decide} />
          ))}
        </ul>
      )}
      {message && <p role="status" className={`${noticeText} mt-4`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-4`}>{error}</p>}
    </>
  )
}

function Pending({ idea, onDecide }: { idea: Idea; onDecide: (id: string, action: 'publish' | 'reject', reason: string) => void }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const title = idea.title || t('ideas.untitled')
  const fields: [string, string][] = [
    [t('ideas.field.description'), idea.description],
    [t('ideas.field.targetGroup'), idea.targetGroup],
    [t('ideas.goal'), idea.goal],
  ]
  return (
    <li className={`${card} grid gap-3`}>
      <h2 className="m-0 font-display text-2xl font-semibold">{title}</h2>
      {idea.images.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {idea.images.map((img, n) => (
            <li key={n}>
              <img src={imageUrl(idea.id, n, img.version)} alt="" className="h-20 w-20 rounded-lg object-cover" />
            </li>
          ))}
        </ul>
      )}
      {fields.map(([label, value]) =>
        value ? (
          <p key={label} className="m-0 whitespace-pre-line">
            <strong>{label}:</strong> {value}
          </p>
        ) : null,
      )}
      {idea.mediationConcept?.trim() && <MarkdownView text={idea.mediationConcept} />}
      <p className="m-0">
        <Link to={`/ideas/${idea.id}`}>{t('approvals.open')}</Link>
      </p>
      <label className="grid gap-1">
        <span className="text-sm font-medium">{t('approvals.reason')}</span>
        <textarea className={input} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => onDecide(idea.id, 'publish', '')}>
          {t('approvals.publish')}
        </button>
        <button type="button" className={buttonSecondary} onClick={() => onDecide(idea.id, 'reject', reason)}>
          {t('approvals.reject')}
        </button>
      </div>
    </li>
  )
}
