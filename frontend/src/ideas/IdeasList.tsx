import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import BasketButton from '../basket/BasketButton'
import { card, errorText, h1, muted } from '../ui'

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
      <h1 className={h1}>{t('ideas.list.title')}</h1>
      {failed && <p role="alert" className={errorText}>{t('ideas.list.loadError')}</p>}
      {rows === null && !failed && <p className={muted}>{t('common.loading')}</p>}
      {rows !== null && rows.length === 0 && <p className={muted}>{t('ideas.list.empty')}</p>}
      {rows !== null && rows.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id} className={`${card} flex items-start gap-4 transition hover:shadow-md`}>
              {row.imageCount > 0 && (
                <img src={`/api/ideas/${row.id}/images/0`} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Link to={`/ideas/${row.id}`} className="text-base font-semibold">
                  {row.title || t('ideas.untitled')}
                </Link>
                {row.description && <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{row.description}</p>}
                <div className="mt-auto flex items-center gap-3 pt-1">
                  <BasketButton ideaId={row.id} />
                  <Link to={`/ideas/${row.id}/edit`} className="text-sm">
                    {t('ideas.edit')}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
