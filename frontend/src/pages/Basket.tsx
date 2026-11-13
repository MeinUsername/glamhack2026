import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { useBasket } from '../basket/useBasket'
import type { Idea } from '../types'
import { button, errorText, h1, muted } from '../ui'

// The basket page. Public: visitors without login see it too (Q-006-06).
export default function Basket() {
  const { t } = useTranslation()
  const { ids, remove } = useBasket()

  return (
    <>
      <h1 className={h1}>{t('basket.title')}</h1>
      {ids.length === 0 ? (
        <p className={muted}>{t('basket.empty')}</p>
      ) : (
        <ul className="grid gap-3">
          {ids.map((id) => (
            <BasketEntry key={id} id={id} onGone={() => remove(id)} />
          ))}
        </ul>
      )}
    </>
  )
}

type Entry = { status: 'loading' } | { status: 'ready'; idea: Idea } | { status: 'failed' }

// One basket entry: loads the idea by ID. An idea that no longer exists is dropped from the basket (D4).
function BasketEntry({ id, onGone }: { id: string; onGone: () => void }) {
  const { t } = useTranslation()
  const [entry, setEntry] = useState<Entry>({ status: 'loading' })

  useEffect(() => {
    let active = true
    api<Idea>(`/api/ideas/${encodeURIComponent(id)}`)
      .then((idea) => active && setEntry({ status: 'ready', idea }))
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 404) {
          onGone() // silently, D4
          return
        }
        setEntry({ status: 'failed' })
      })
    return () => {
      active = false
    }
  }, [id])

  if (entry.status === 'loading') return <li className={muted}>{t('common.loading')}</li>
  if (entry.status === 'failed') {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-gray-400/50 p-3">
        <span className={errorText}>{t('ideas.loadError')}</span>
        <RemoveButton title={id} onClick={onGone} />
      </li>
    )
  }
  const { idea } = entry
  const title = idea.title || t('ideas.untitled')
  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-400/50 p-3">
      {idea.images.length > 0 && (
        <img
          src={`/api/ideas/${idea.id}/images/0`}
          alt=""
          className="h-16 w-16 rounded object-cover"
        />
      )}
      <Link to={`/ideas/${idea.id}`} className="flex-1 font-medium">
        {title}
      </Link>
      <RemoveButton title={title} onClick={onGone} />
    </li>
  )
}

function RemoveButton({ title, onClick }: { title: string; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={t('basket.removeNamed', { title })}
      className={`${button} px-2 py-1 text-sm`}
      onClick={onClick}
    >
      {t('basket.remove')}
    </button>
  )
}
