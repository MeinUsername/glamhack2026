import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { localeFor, renderPrompt } from './render'
import type { Idea } from '../types'
import { button, errorText, h2, muted, noticeText } from '../ui'

// F-003: the prompt generator on the basket page. Visitors do not see it (AC-003-5).
export default function PromptGenerator({ ids }: { ids: string[] }) {
  const me = useMe()
  const { t } = useTranslation()
  if (me.status === 'loading') return null
  if (me.status === 'anonymous') {
    return (
      <section className="mt-8">
        <h2 className={h2}>{t('prompt.title')}</h2>
        <p className={muted}>
          {t('prompt.loginHint')} <Link to="/login">{t('nav.login')}</Link>
        </p>
      </section>
    )
  }
  return <Generator ids={ids} />
}

type Master = { status: 'loading' } | { status: 'none' } | { status: 'error' } | { status: 'ready'; text: string }

function Generator({ ids }: { ids: string[] }) {
  const { t, i18n } = useTranslation()
  const [master, setMaster] = useState<Master>({ status: 'loading' })
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ text: string }>('/api/master-prompt')
      .then((d) => setMaster({ status: 'ready', text: d.text }))
      .catch((err: unknown) =>
        setMaster(err instanceof ApiError && err.status === 404 ? { status: 'none' } : { status: 'error' }),
      )
  }, [])

  // The ideas come in basket order; a missing idea is skipped (the basket page removes it, D4 of F-006).
  const idsKey = ids.join(',')
  useEffect(() => {
    let active = true
    const list = idsKey ? idsKey.split(',') : []
    Promise.all(list.map((id) => api<Idea>(`/api/ideas/${encodeURIComponent(id)}`).catch(() => null))).then((all) => {
      if (active) setIdeas(all.filter((idea): idea is Idea => idea !== null))
    })
    return () => {
      active = false
    }
  }, [idsKey])

  const text = master.status === 'ready' ? renderPrompt(master.text, ideas, localeFor(i18n.resolvedLanguage)) : ''
  const emptyBasket = ids.length === 0
  const disabled = emptyBasket || master.status !== 'ready'

  function download() {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName(new Date())
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function copy() {
    setMessage('')
    setError('')
    try {
      await navigator.clipboard.writeText(text)
      setMessage(t('prompt.copied'))
    } catch {
      setError(t('prompt.copyError'))
    }
  }

  return (
    <section className="mt-8">
      <h2 className={h2}>{t('prompt.title')}</h2>
      {master.status === 'loading' && <p className={muted}>{t('common.loading')}</p>}
      {master.status === 'none' && <p className={muted}>{t('prompt.noVersion')}</p>}
      {master.status === 'error' && <p role="alert" className={errorText}>{t('prompt.loadError')}</p>}
      {emptyBasket && <p className={muted}>{t('prompt.emptyBasket')}</p>}

      {master.status === 'ready' && (
        <pre className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 whitespace-pre-wrap text-sm">{text}</pre>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={disabled} onClick={download}>
          {t('prompt.download')}
        </button>
        <button type="button" className={button} disabled={disabled} onClick={copy}>
          {t('prompt.copy')}
        </button>
      </div>
      {message && <p role="status" className={`${noticeText} mt-2`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-2`}>{error}</p>}
    </section>
  )
}

// prompt-JJJJ-MM-TT.md, with the date of the download (D8 of F-003).
export function fileName(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `prompt-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.md`
}
