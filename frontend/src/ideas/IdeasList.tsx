import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import BasketButton from '../basket/BasketButton'
import { errorText, h1, label, mark, muted } from '../ui'

interface IdeaRow {
  id: string
  title: string
  imageCount: number
  description: string
}

// The overview of all ideas (F-011). Public since F-012 (D1); the basket button marks bought ideas (D1, D2).
export default function IdeasList() {
  return <Overview />
}

function Overview() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<IdeaRow[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api<IdeaRow[]>('/api/ideas')
      .then(setRows)
      .catch(() => setFailed(true))
  }, [])

  return (
    <>
      <h1 className={h1}>
        <span className={mark}>{t('ideas.list.title')}</span>
      </h1>
      {failed && <p role="alert" className={errorText}>{t('ideas.list.loadError')}</p>}
      {rows === null && !failed && <p className={muted}>{t('common.loading')}</p>}
      {rows !== null && rows.length === 0 && <p className={muted}>{t('ideas.list.empty')}</p>}
      {rows !== null && rows.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-6">
          {rows.map((row, index) => (
            <li key={row.id} className="flex flex-col border-2 border-ink bg-paper">
              <div className={`${label} border-b-2 border-ink px-4 py-3`}>
                {t('ideas.list.number', { n: String(index + 1).padStart(2, '0') })}
              </div>
              {row.imageCount > 0 && (
                <img
                  src={`/api/ideas/${row.id}/images/0`}
                  alt=""
                  className="aspect-[16/10] w-full border-b-2 border-ink object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-6">
                <h2 className="m-0 text-[clamp(26px,2.2vw,28px)] leading-[1.1] font-bold tracking-[-0.02em]">
                  <Link to={`/ideas/${row.id}`} className="text-ink no-underline hover:text-ink hover:underline">
                    {row.title || t('ideas.untitled')}
                  </Link>
                </h2>
                {row.description && (
                  <p className="m-0 whitespace-pre-line text-base leading-[1.55] text-ink-2">{row.description}</p>
                )}
              </div>
              <BasketButton ideaId={row.id} variant="bar" />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
