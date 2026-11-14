import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { localeFor, renderPrompt } from './render'
import LevelDialog from './LevelDialog'
import type { Idea, PromptLevel } from '../types'
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

type Levels = { status: 'loading' } | { status: 'none' } | { status: 'error' } | { status: 'ready'; levels: PromptLevel[] }

type Action = 'copy' | 'download'

function Generator({ ids }: { ids: string[] }) {
  const { t, i18n } = useTranslation()
  const [levels, setLevels] = useState<Levels>({ status: 'loading' })
  const [selectedId, setSelectedId] = useState('')
  const [pending, setPending] = useState<Action | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api<PromptLevel[]>('/api/prompt-levels')
      .then((list) => {
        setLevels(list.length === 0 ? { status: 'none' } : { status: 'ready', levels: list })
        setSelectedId(list[0]?.id ?? '')
      })
      .catch(() => setLevels({ status: 'error' }))
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

  const list = levels.status === 'ready' ? levels.levels : []
  const locale = localeFor(i18n.resolvedLanguage)
  const render = (level: PromptLevel) => renderPrompt(level.text, ideas, locale)
  const selected = list.find((l) => l.id === selectedId) ?? list[0]
  const text = selected ? render(selected) : ''
  const emptyBasket = ids.length === 0
  const disabled = emptyBasket || levels.status !== 'ready'

  function download(body: string) {
    const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName(new Date())
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function copy(body: string) {
    setMessage('')
    setError('')
    try {
      await navigator.clipboard.writeText(body)
      setMessage(t('prompt.copied'))
    } catch {
      setError(t('prompt.copyError'))
    }
  }

  function perform(action: Action, level: PromptLevel) {
    const body = render(level)
    if (action === 'copy') void copy(body)
    else download(body)
  }

  // D2: with two or more levels the user chooses first; with one the action runs directly (AC-018-5).
  function start(action: Action) {
    if (!selected) return
    if (list.length >= 2) setPending(action)
    else perform(action, selected)
  }

  return (
    <section className="mt-8">
      <h2 className={h2}>{t('prompt.title')}</h2>
      {levels.status === 'loading' && <p className={muted}>{t('common.loading')}</p>}
      {levels.status === 'none' && <p className={muted}>{t('prompt.noVersion')}</p>}
      {levels.status === 'error' && <p role="alert" className={errorText}>{t('prompt.loadError')}</p>}
      {emptyBasket && <p className={muted}>{t('prompt.emptyBasket')}</p>}

      {levels.status === 'ready' && (
        <pre className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 whitespace-pre-wrap text-sm">{text}</pre>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={button} disabled={disabled} onClick={() => start('download')}>
          {t('prompt.download')}
        </button>
        <button type="button" className={button} disabled={disabled} onClick={() => start('copy')}>
          {t('prompt.copy')}
        </button>
      </div>
      {pending && (
        <LevelDialog
          levels={list}
          initialId={selected?.id ?? ''}
          onCancel={() => setPending(null)}
          onConfirm={(level) => {
            const action = pending
            setPending(null)
            setSelectedId(level.id)
            perform(action, level)
          }}
        />
      )}
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
