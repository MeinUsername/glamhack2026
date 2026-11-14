import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { button, card, errorText, h1, muted, noticeText } from '../ui'
import type { FeedbackPrompt } from '../types'

// F-025: public page with the feedback prompts. The server fills in {{allideas}} and {{language}}.
export default function FeedbackPrompts() {
  const { t, i18n } = useTranslation()
  const [list, setList] = useState<FeedbackPrompt[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api<FeedbackPrompt[]>('/api/feedback-prompts')
      .then(setList)
      .catch(() => setFailed(true))
  }, [])

  const lang = (i18n.resolvedLanguage ?? 'en').slice(0, 2)
  const url = (id: string) => `/api/feedback-prompts/${encodeURIComponent(id)}/render?lang=${encodeURIComponent(lang)}`

  async function fetchText(p: FeedbackPrompt): Promise<string> {
    const res = await fetch(url(p.id), { credentials: 'same-origin' })
    if (!res.ok) throw new Error(String(res.status))
    return res.text()
  }

  async function copy(p: FeedbackPrompt) {
    setMessage('')
    setError('')
    try {
      await navigator.clipboard.writeText(await fetchText(p))
      setMessage(t('feedback.copied'))
    } catch {
      setError(t('feedback.error'))
    }
  }

  async function download(p: FeedbackPrompt) {
    setMessage('')
    setError('')
    try {
      const blob = new Blob([await fetchText(p)], { type: 'text/markdown;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName(p.title, new Date())
      a.click()
      URL.revokeObjectURL(a.href)
      setMessage(t('feedback.downloaded'))
    } catch {
      setError(t('feedback.error'))
    }
  }

  return (
    <>
      <h1 className={h1}>{t('feedback.title')}</h1>
      <p className={muted}>{t('feedback.intro')}</p>
      {failed && <p role="alert" className={errorText}>{t('feedback.loadError')}</p>}
      {list === null && !failed && <p className={muted}>{t('common.loading')}</p>}
      {list !== null && list.length === 0 && <p className={muted}>{t('feedback.empty')}</p>}
      {list !== null && list.length > 0 && (
        <ul className="mt-4 grid gap-4">
          {list.map((p) => (
            <li key={p.id} className={card}>
              <h2 className="text-base font-semibold">{p.title}</h2>
              {p.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{p.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={button} onClick={() => download(p)}>
                  {t('prompt.download')}
                </button>
                <button type="button" className={button} onClick={() => copy(p)}>
                  {t('prompt.copy')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {message && <p role="status" className={`${noticeText} mt-3`}>{message}</p>}
      {error && <p role="alert" className={`${errorText} mt-3`}>{error}</p>}
    </>
  )
}

// feedback-prompt-<title>-JJJJ-MM-TT.md; the server sends the same name when ?download=1 is used.
function fileName(title: string, date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const slug = title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `feedback-prompt-${slug || 'prompt'}-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.md`
}
