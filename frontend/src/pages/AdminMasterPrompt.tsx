import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { useBasket } from '../basket/useBasket'
import { localeFor, renderPrompt, unknownVariables } from '../prompt/render'
import type { Idea } from '../types'
import { button, cell, errorText, h1, h2, input, linkButton, muted, noticeText, table } from '../ui'

// F-008: editor for the master prompt. Only admins get here (the server checks too).
interface Version {
  number: number
  text: string
  authorEmail: string
  createdAt: string
}

interface Listing {
  versions: Version[]
}

interface VersionResult {
  version: number
  created: boolean
}

export default function AdminMasterPrompt() {
  const me = useMe()
  const { t } = useTranslation()
  if (me.status === 'loading') return <p className={muted}>{t('common.loading')}</p>
  if (me.status === 'anonymous') return <Navigate to="/login" replace />
  if (me.me.role !== 'admin') return <p role="alert" className={errorText}>{t('admin.onlyAdmins')}</p>
  return <Editor />
}

function Editor() {
  const { t, i18n } = useTranslation()
  const basket = useBasket()
  const [versions, setVersions] = useState<Version[] | null>(null)
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'source' | 'preview'>('source')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // The list is newest first, so the first entry is the current text.
  const currentText = versions?.[0]?.text ?? ''
  const unchanged = text === currentText
  const empty = text.trim() === ''

  const load = useCallback(async (): Promise<Version[]> => {
    const data = await api<Listing>('/api/admin/master-prompt')
    setVersions(data.versions)
    return data.versions
  }, [])

  useEffect(() => {
    load()
      .then((vs) => setText(vs[0]?.text ?? ''))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('masterPrompt.loadError')))
  }, [load, t])

  // The preview uses the ideas in this browser's basket (D4 of F-008).
  const idsKey = basket.ids.join(',')
  useEffect(() => {
    if (mode !== 'preview') return
    let cancelled = false
    const ids = idsKey ? idsKey.split(',') : []
    Promise.all(ids.map((id) => api<Idea>(`/api/ideas/${id}`).catch(() => null))).then((list) => {
      if (!cancelled) setIdeas(list.filter((idea): idea is Idea => idea !== null))
    })
    return () => {
      cancelled = true
    }
  }, [mode, idsKey])

  async function save() {
    setMessage('')
    setError('')
    // Checked here too, so the names show before anything is sent (AC-008-5). The server checks again.
    const unknown = unknownVariables(text)
    if (unknown.length > 0) {
      setError(t('masterPrompt.unknown', { names: unknown.join(', ') }))
      return
    }
    setBusy(true)
    try {
      const res = await api<VersionResult>('/api/admin/master-prompt', { method: 'POST', json: { text } })
      await load()
      setMessage(res.created ? t('masterPrompt.saved', { n: res.version }) : t('masterPrompt.unchanged'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('masterPrompt.saveError'))
    } finally {
      setBusy(false)
    }
  }

  async function restore(v: Version) {
    setMessage('')
    setError('')
    setBusy(true)
    try {
      const res = await api<VersionResult>(`/api/admin/master-prompt/versions/${v.number}/restore`, { method: 'POST' })
      const list = await load()
      setText(list[0]?.text ?? '')
      setMessage(res.created ? t('masterPrompt.restored', { from: v.number, n: res.version }) : t('masterPrompt.alreadyCurrent'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('masterPrompt.restoreError'))
    } finally {
      setBusy(false)
    }
  }

  const modeButton = (value: 'source' | 'preview', label: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => setMode(value)}
      className={`cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1 ${mode === value ? 'font-semibold' : ''}`}
    >
      {label}
    </button>
  )

  return (
    <>
      <h1 className={h1}>{t('masterPrompt.title')}</h1>
      <p className={muted}>{t('masterPrompt.intro')}</p>

      <div className="mt-4 flex gap-2">
        {modeButton('source', t('masterPrompt.modeSource'))}
        {modeButton('preview', t('masterPrompt.modePreview'))}
      </div>

      {mode === 'source' ? (
        <textarea
          aria-label={t('masterPrompt.text')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={18}
          className={`${input} mt-3 w-full font-mono text-sm`}
        />
      ) : (
        <>
          <p className={`${muted} mt-3`}>{t('masterPrompt.previewNote', { n: ideas.length })}</p>
          <pre className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 whitespace-pre-wrap text-sm">
            {renderPrompt(text, ideas, localeFor(i18n.resolvedLanguage))}
          </pre>
        </>
      )}

      <div className="mt-3">
        <button type="button" className={button} disabled={busy || unchanged || empty} onClick={save}>
          {t('masterPrompt.save')}
        </button>
      </div>
      {message && <p role="status" className={`${noticeText} mt-2`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-2`}>{error}</p>}

      <h2 className={h2}>{t('masterPrompt.versions')}</h2>
      {versions !== null && versions.length === 0 && <p className={muted}>{t('masterPrompt.none')}</p>}
      {versions !== null && versions.length > 0 && (
        <table className={table}>
          <thead>
            <tr>
              <th className={cell}>{t('masterPrompt.colVersion')}</th>
              <th className={cell}>{t('masterPrompt.colDate')}</th>
              <th className={cell}>{t('masterPrompt.colAuthor')}</th>
              <th className={cell} />
            </tr>
          </thead>
          <tbody>
            {versions.map((v, i) => (
              <tr key={v.number}>
                <td className={cell}>
                  {v.number} {i === 0 && <span className={muted}>({t('masterPrompt.current')})</span>}
                </td>
                <td className={cell}>{new Date(v.createdAt).toLocaleString(i18n.language)}</td>
                <td className={cell}>{v.authorEmail}</td>
                <td className={cell}>
                  {i > 0 && (
                    <button type="button" className={linkButton} disabled={busy} onClick={() => restore(v)}>
                      {t('masterPrompt.restore')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
