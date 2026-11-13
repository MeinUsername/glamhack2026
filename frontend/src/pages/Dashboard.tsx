import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import type { FileItem, Invitation } from '../types'
import { button, cell, errorText, h1, h2, input, muted, noticeText, table } from '../ui'

export const MAX_UPLOAD_BYTES = 1024 * 1024 // same limit as the server (files.go)

export function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

export default function Dashboard() {
  const me = useMe()
  const { t } = useTranslation()
  if (me.status === 'loading') return <p className={muted}>{t('common.loading')}</p>
  if (me.status === 'anonymous') return <Navigate to="/login" replace />
  if (me.me.role !== 'admin') return <p role="alert" className={errorText}>{t('admin.onlyAdmins')}</p>
  return <Files email={me.me.email} />
}

function Files({ email }: { email: string }) {
  const { t, i18n } = useTranslation()
  const [files, setFiles] = useState<FileItem[]>([])
  const [picked, setPicked] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0) // remounts the file input after a reset
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [invite, setInvite] = useState<Invitation | null>(null)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    api<FileItem[]>('/api/files')
      .then(setFiles)
      .catch(() => setError(t('files.loadError')))
  }, [t])

  function resetPicker() {
    setPicked(null)
    setInputKey((k) => k + 1)
  }

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    setMessage('')
    setError('')
    const file = event.target.files?.[0] ?? null
    if (file && file.size > MAX_UPLOAD_BYTES) {
      setError(t('files.tooLarge'))
      resetPicker()
      return
    }
    setPicked(file)
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!picked) return
    setBusy(true)
    setMessage('')
    setError('')
    const form = new FormData()
    form.append('file', picked)
    try {
      const saved = await api<FileItem>('/api/files', { method: 'POST', body: form })
      setFiles((prev) => [saved, ...prev])
      setMessage(t('files.uploaded', { name: saved.name }))
      resetPicker()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('files.uploadError'))
    } finally {
      setBusy(false)
    }
  }

  async function handleInvite() {
    setInviteError('')
    try {
      setInvite(await api<Invitation>('/api/invitations', { method: 'POST' }))
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : t('files.invite.error'))
    }
  }

  return (
    <>
      <h1 className={h1}>{t('files.title')}</h1>
      <p className={muted}>{t('files.intro', { email })}</p>

      <form onSubmit={handleUpload} className="my-4 flex flex-wrap items-center gap-3">
        <input
          key={inputKey}
          type="file"
          aria-label={t('files.pick')}
          onChange={handlePick}
          className="text-sm"
        />
        <button type="submit" className={button} disabled={!picked || busy}>
          {busy ? t('files.uploading') : t('files.upload')}
        </button>
      </form>
      {message && <p role="status" className={noticeText}>{message}</p>}
      {error && <p role="alert" className={errorText}>{error}</p>}

      {files.length > 0 ? (
        <table className={table}>
          <thead>
            <tr>
              <th className={cell}>{t('files.colFile')}</th>
              <th className={cell}>{t('files.colSize')}</th>
              <th className={cell}>{t('files.colUploaded')}</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td className={cell}>
                  <a href={`/files/${f.id}`}>{f.name}</a>
                </td>
                <td className={cell}>{formatSize(f.bytes)}</td>
                <td className={cell}>{f.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={muted}>{t('files.none')}</p>
      )}

      <h2 className={h2}>{t('files.invite.title')}</h2>
      <p className={muted}>{t('files.invite.hint')}</p>
      <button type="button" className={`${button} mt-2`} onClick={handleInvite}>
        {t('files.invite.create')}
      </button>
      {inviteError && <p role="alert" className={errorText}>{inviteError}</p>}
      {invite && (
        <div className="mt-3">
          <p className={noticeText}>
            {t('files.invite.created')}
          </p>
          <code className={`${input} mt-2 block break-all`}>{invite.link}</code>
        </div>
      )}
    </>
  )
}
