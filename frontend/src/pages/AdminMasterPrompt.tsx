import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { useBasket } from '../basket/useBasket'
import { localeFor, renderPrompt, unknownVariables } from '../prompt/render'
import { pickLocalized } from '../prompt/localized'
import { LANGUAGES, LANGUAGE_NAMES } from '../i18n'
import type { Idea } from '../types'
import AdminFeedbackPrompts from './AdminFeedbackPrompts'
import { button, card, cell, errorText, h1, h2, input, linkButton, muted, noticeText, table } from '../ui'

// F-008/F-018: editor for the prompt levels (Detailgrade). Only admins get here (the server checks too).
interface Version {
  number: number
  text: string
  authorEmail: string
  createdAt: string
}

interface Level {
  id: string
  titles: Record<string, string>
  descriptions: Record<string, string>
  text: string
  version: number
  versions: Version[]
}

interface VersionResult {
  version: number
  created: boolean
  id?: string
}

const NEW = 'new'

export default function AdminMasterPrompt() {
  const me = useMe()
  const { t } = useTranslation()
  if (me.status === 'loading') return <p className={muted}>{t('common.loading')}</p>
  if (me.status === 'anonymous') return <Navigate to="/login" replace />
  if (me.me.role !== 'admin') return <p role="alert" className={errorText}>{t('admin.onlyAdmins')}</p>
  return <Categories />
}

// F-025: two categories of prompts. Existing prompts are master prompts.
function Categories() {
  const { t } = useTranslation()
  const [category, setCategory] = useState<'master' | 'feedback'>('master')
  const tab = (active: boolean) =>
    `cursor-pointer rounded-t-lg border border-b-0 px-3 py-1 text-sm ${
      active ? 'border-slate-300 bg-white font-medium dark:border-slate-700 dark:bg-slate-900' : 'border-transparent text-slate-500 dark:text-slate-400'
    }`
  return (
    <>
      <div role="tablist" aria-label={t('feedback.admin.category')} className="mb-4 flex gap-1">
        <button type="button" role="tab" aria-selected={category === 'master'} className={tab(category === 'master')} onClick={() => setCategory('master')}>
          {t('feedback.admin.master')}
        </button>
        <button type="button" role="tab" aria-selected={category === 'feedback'} className={tab(category === 'feedback')} onClick={() => setCategory('feedback')}>
          {t('feedback.admin.feedback')}
        </button>
      </div>
      {category === 'master' ? <Levels /> : <AdminFeedbackPrompts />}
    </>
  )
}

function Levels() {
  const { t, i18n } = useTranslation()
  const [levels, setLevels] = useState<Level[] | null>(null)
  const [selected, setSelected] = useState<string>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async (): Promise<Level[]> => {
    const list = await api<Level[]>('/api/admin/prompt-levels')
    setLevels(list)
    return list
  }, [])

  useEffect(() => {
    load()
      .then((list) => setSelected((cur) => cur || list[0]?.id || NEW))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('masterPrompt.loadError')))
  }, [load, t])

  async function move(index: number, delta: number) {
    if (!levels) return
    const ids = levels.map((l) => l.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setMessage('')
    setError('')
    try {
      await api('/api/admin/prompt-levels/order', { method: 'PUT', json: { ids } })
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('masterPrompt.orderError'))
    }
  }

  async function remove(level: Level) {
    if (!window.confirm(t('masterPrompt.deleteConfirm', { title: pickLocalized(level.titles, i18n.resolvedLanguage) }))) return
    setMessage('')
    setError('')
    try {
      await api(`/api/admin/prompt-levels/${level.id}`, { method: 'DELETE' })
      const list = await load()
      setSelected(list[0]?.id ?? NEW)
      setMessage(t('masterPrompt.deleted'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('masterPrompt.deleteError'))
    }
  }

  const current = levels?.find((l) => l.id === selected)

  return (
    <>
      <h1 className={h1}>{t('masterPrompt.title')}</h1>
      <p className={muted}>{t('masterPrompt.intro')}</p>

      <h2 className={h2}>{t('masterPrompt.levels')}</h2>
      {levels !== null && levels.length === 0 && <p className={muted}>{t('masterPrompt.noLevels')}</p>}
      <ul className="grid gap-2">
        {levels?.map((l, i) => (
          <li key={l.id} className={`${card} flex items-center gap-2 py-2`}>
            <button
              type="button"
              aria-pressed={selected === l.id}
              onClick={() => setSelected(l.id)}
              className={`flex-1 cursor-pointer bg-transparent text-left ${selected === l.id ? 'font-semibold' : ''}`}
            >
              {pickLocalized(l.titles, i18n.resolvedLanguage)}
            </button>
            <button type="button" className={linkButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('masterPrompt.moveUp')}>
              ↑
            </button>
            <button type="button" className={linkButton} disabled={i === levels.length - 1} onClick={() => move(i, 1)} aria-label={t('masterPrompt.moveDown')}>
              ↓
            </button>
            <button type="button" className={linkButton} disabled={levels.length <= 1} onClick={() => remove(l)} aria-label={t('masterPrompt.delete')}>
              {t('masterPrompt.delete')}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <button type="button" className={button} onClick={() => setSelected(NEW)}>
          {t('masterPrompt.new')}
        </button>
      </div>
      {message && <p role="status" className={`${noticeText} mt-2`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-2`}>{error}</p>}

      {levels !== null && (selected === NEW || current) && (
        <LevelEditor
          key={selected}
          level={selected === NEW ? undefined : current}
          onSaved={async (id, msg) => {
            await load()
            setSelected(id)
            setMessage(msg)
            setError('')
          }}
        />
      )}
    </>
  )
}

function LevelEditor({ level, onSaved }: { level?: Level; onSaved: (id: string, message: string) => Promise<void> }) {
  const { t, i18n } = useTranslation()
  const basket = useBasket()
  const [titles, setTitles] = useState<Record<string, string>>(level?.titles ?? {})
  const [descs, setDescs] = useState<Record<string, string>>(level?.descriptions ?? {})
  const [text, setText] = useState(level?.text ?? '')
  const [versions, setVersions] = useState<Version[]>(level?.versions ?? [])
  const [mode, setMode] = useState<'source' | 'preview'>('source')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const changed =
    !level ||
    text !== level.text ||
    LANGUAGES.some((l) => (titles[l] ?? '') !== (level.titles[l] ?? '') || (descs[l] ?? '') !== (level.descriptions[l] ?? ''))
  const incomplete = text.trim() === '' || !(titles.en ?? '').trim() || !(descs.en ?? '').trim()

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
      const body = { titles, descriptions: descs, text }
      const res = level
        ? await api<VersionResult>(`/api/admin/prompt-levels/${level.id}`, { method: 'PUT', json: body })
        : await api<VersionResult>('/api/admin/prompt-levels', { method: 'POST', json: body })
      const msg = !level ? t('masterPrompt.created') : res.created ? t('masterPrompt.saved', { n: res.version }) : t('masterPrompt.unchanged')
      await onSaved(level?.id ?? res.id ?? '', msg)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('masterPrompt.saveError'))
    } finally {
      setBusy(false)
    }
  }

  async function restore(v: Version) {
    if (!level) return
    setMessage('')
    setError('')
    setBusy(true)
    try {
      const res = await api<VersionResult>(`/api/admin/prompt-levels/${level.id}/versions/${v.number}/restore`, { method: 'POST' })
      const list = await api<Level[]>('/api/admin/prompt-levels')
      const fresh = list.find((l) => l.id === level.id)
      if (fresh) {
        setVersions(fresh.versions)
        setText(fresh.text)
      }
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
    <section>
      <h2 className={h2}>{level ? t('masterPrompt.edit') : t('masterPrompt.new')}</h2>
      <div className="grid gap-3">
        {LANGUAGES.map((lang) => (
          <fieldset key={lang} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <legend className="px-1 text-sm font-medium">
              {LANGUAGE_NAMES[lang]}
              {lang === 'en' && <span className={muted}> ({t('masterPrompt.required')})</span>}
            </legend>
            <input
              aria-label={t('masterPrompt.titleField', { lang: LANGUAGE_NAMES[lang] })}
              className={input}
              value={titles[lang] ?? ''}
              onChange={(e) => setTitles({ ...titles, [lang]: e.target.value })}
            />
            <textarea
              aria-label={t('masterPrompt.descField', { lang: LANGUAGE_NAMES[lang] })}
              className={input}
              rows={2}
              value={descs[lang] ?? ''}
              onChange={(e) => setDescs({ ...descs, [lang]: e.target.value })}
            />
          </fieldset>
        ))}
      </div>

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
        <button type="button" className={button} disabled={busy || !changed || incomplete} onClick={save}>
          {t('masterPrompt.save')}
        </button>
      </div>
      {message && <p role="status" className={`${noticeText} mt-2`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-2`}>{error}</p>}

      {level && (
        <>
          <h2 className={h2}>{t('masterPrompt.versions')}</h2>
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
        </>
      )}
    </section>
  )
}
