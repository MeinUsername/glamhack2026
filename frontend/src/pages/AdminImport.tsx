import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { button, cell, errorText, h1, h2, input, muted, noticeText, table } from '../ui'

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
      <form onSubmit={handlePreview} className="mt-4 flex flex-wrap items-center gap-3">
        <label className="grid gap-1">
          <span className="font-medium">{t('admin.import.file')}</span>
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
            <table className={`${table} mt-3`}>
              <thead>
                <tr>
                  <th className={cell}>{t('admin.import.colLine')}</th>
                  <th className={cell}>{t('admin.import.colTitle')}</th>
                  <th className={cell}>{t('admin.import.colStatus')}</th>
                  <th className={cell}>{t('admin.import.colMessage')}</th>
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
