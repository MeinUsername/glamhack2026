import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import BasketButton from '../basket/BasketButton'
import { errorText, h1, muted } from '../ui'

interface IdeaRow {
  id: string
  title: string
  imageCount: number
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
        <ul className="grid gap-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-lg border border-gray-400/50 p-3">
              {row.imageCount > 0 && (
                <img src={`/api/ideas/${row.id}/images/0`} alt="" className="h-16 w-16 rounded object-cover" />
              )}
              <Link to={`/ideas/${row.id}`} className="flex-1 font-medium">
                {row.title || t('ideas.untitled')}
              </Link>
              <BasketButton ideaId={row.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
