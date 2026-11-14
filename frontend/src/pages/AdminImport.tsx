import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { button, cell, errorText, h1, h2, headCell, input, label, muted, noticeText, table, tableWrap } from '../ui'
import { ICOM_GROUPS, LOCATION_LABEL, LOCATIONS, pick } from '../ideas/icom'

// F-021: which IDs the optional columns «ICOM categories» and «Location» accept.
function IcomColumnsHelp() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  const groups = [
    ...ICOM_GROUPS.map((g) => ({ id: g.id, title: pick(g.label, lang), items: g.categories })),
    { id: 'location', title: pick(LOCATION_LABEL, lang), items: LOCATIONS },
  ]
  return (
    <details className="mt-4 max-w-3xl overflow-hidden rounded-card border-2 border-ink bg-paper">
      <summary className={`${label} flex min-h-11 cursor-pointer items-center px-5 py-2 hover:bg-coral-soft`}>
        {t('admin.import.icomTitle')}
      </summary>
      <div className="grid gap-4 border-t-2 border-ink px-4 py-4">
        <p className={`${muted} m-0`}>{t('admin.import.icomHint')}</p>
        {groups.map((g) => (
          <div key={g.id} className="grid gap-1">
            <h3 className="m-0 text-sm font-bold">{g.title}</h3>
            <ul className="m-0 grid gap-1 p-0">
              {g.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline gap-x-3">
                  <code className="font-mono text-sm text-accent">{item.id}</code>
                  <span className="text-sm text-ink-2">{pick(item.label, lang)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

// F-015: CSV import of ideas. Two steps: preview (stores nothing), then confirm (same file again).
interface RowInfo {
  line: number
  title: string
  status: 'skipped' | 'invalid'
  message: string
}

interface ImportResult {
  new: number
  skipped: number
  invalid: number
  created: number
  rows: RowInfo[]
}

export default function AdminImport() {
  const me = useMe()
  const { t } = useTranslation()
  if (me.status === 'loading') return <p className={muted}>{t('common.loading')}</p>
  if (me.status === 'anonymous') return <Navigate to="/login" replace />
  if (me.me.role !== 'admin') return <p role="alert" className={errorText}>{t('admin.onlyAdmins')}</p>
  return <Importer />
}

function Importer() {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [done, setDone] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function body(f: File): FormData {
    const form = new FormData()
    form.append('file', f)
    return form
  }

  async function run<T>(path: string, f: File, after: (r: T) => void) {
    setBusy(true)
    setError('')
    try {
      after(await api<T>(path, { method: 'POST', body: body(f) }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('admin.import.error'))
    } finally {
      setBusy(false)
    }
  }

  function handlePreview(event: FormEvent) {
    event.preventDefault()
    if (!file || busy) return
    setDone(null)
    setPreview(null)
    void run<ImportResult>('/api/admin/import/ideas/preview', file, setPreview)
  }

  function handleImport() {
    if (!file || busy) return
    void run<ImportResult>('/api/admin/import/ideas', file, (r) => {
      setDone(r)
      setPreview(null)
    })
  }

  const shown = done ?? preview
  return (
    <>
      <h1 className={h1}>{t('admin.import.title')}</h1>
      <p className={muted}>{t('admin.import.intro')}</p>
      <IcomColumnsHelp />
      <form onSubmit={handlePreview} className="mt-6 flex max-w-3xl flex-wrap items-end gap-3">
        <label className="grid min-w-0 flex-1 basis-72 gap-2">
          <span className={label}>{t('admin.import.file')}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className={input}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setPreview(null)
              setDone(null)
            }}
          />
        </label>
        <button type="submit" className={button} disabled={!file || busy}>
          {t('admin.import.preview')}
        </button>
      </form>
      {error && <p role="alert" className={`${errorText} mt-3`}>{error}</p>}
      {shown && (
        <section>
          <h2 className={h2}>{done ? t('admin.import.result') : t('admin.import.previewTitle')}</h2>
          <p className={done ? noticeText : undefined}>
            {done && t('admin.import.created', { count: done.created }) + ' · '}
            {t('admin.import.countNew', { count: shown.new })} · {t('admin.import.countSkipped', { count: shown.skipped })} ·{' '}
            {t('admin.import.countInvalid', { count: shown.invalid })}
          </p>
          {shown.rows.length > 0 && (
            <div className={`${tableWrap} mt-4`}>
            <table className={table}>
              <thead>
                <tr>
                  <th className={headCell}>{t('admin.import.colLine')}</th>
                  <th className={headCell}>{t('admin.import.colTitle')}</th>
                  <th className={headCell}>{t('admin.import.colStatus')}</th>
                  <th className={headCell}>{t('admin.import.colMessage')}</th>
                </tr>
              </thead>
              <tbody>
                {shown.rows.map((r) => (
                  <tr key={r.line}>
                    <td className={cell}>{r.line}</td>
                    <td className={cell}>{r.title}</td>
                    <td className={cell}>{t(`admin.import.status.${r.status}`)}</td>
                    <td className={cell}>{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          {preview && (
            <div className="mt-4">
              <button type="button" className={button} disabled={busy || preview.new === 0} onClick={handleImport}>
                {t('admin.import.confirm', { count: preview.new })}
              </button>
            </div>
          )}
        </section>
      )}
    </>
  )
}
