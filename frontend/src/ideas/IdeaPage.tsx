import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import type { Idea } from '../types'
import { errorText, h1, h2, muted } from '../ui'
import { CATEGORY_LABEL } from './categories'
import BasketButton from '../basket/BasketButton'

type State =
  | { status: 'loading' }
  | { status: 'ready'; idea: Idea }
  | { status: 'missing' }
  | { status: 'failed' }

// The idea page at /ideas/:id. Images are fetched through the server; the bucket stays private.
export default function IdeaPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    api<Idea>(`/api/ideas/${encodeURIComponent(id)}`)
      .then((idea) => active && setState({ status: 'ready', idea }))
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 404) setState({ status: 'missing' })
        else setState({ status: 'failed' })
      })
    return () => {
      active = false
    }
  }, [id])

  if (state.status === 'loading') return <p className={muted}>{t('common.loading')}</p>
  if (state.status === 'missing') return <p className={errorText}>{t('ideas.notFound')}</p>
  if (state.status === 'failed') return <p className={errorText}>{t('ideas.loadError')}</p>
  return <Show idea={state.idea} />
}

function Show({ idea }: { idea: Idea }) {
  const { t } = useTranslation()
  const { space } = idea
  const title = idea.title || t('ideas.untitled')
  return (
    <article className="grid max-w-2xl gap-4">
      <h1 className={h1}>{title}</h1>
      <BasketButton ideaId={idea.id} />
      <p>
        <Link to={`/ideas/${idea.id}/edit`}>{t('ideas.edit')}</Link>
      </p>
      {idea.categories.length > 0 && (
        <ul aria-label={t('ideas.categories.chips')} className="flex flex-wrap gap-2">
          {idea.categories.map((key) => (
            <li key={key} className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-sm">
              {CATEGORY_LABEL[key]}
            </li>
          ))}
        </ul>
      )}
      {idea.images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {idea.images.map((_, n) => (
            <li key={n}>
              <img
                src={`/api/ideas/${idea.id}/images/${n}`}
                alt={t('ideas.imageAlt', { title, n: n + 1 })}
                className="w-full rounded-lg object-cover"
              />
            </li>
          ))}
        </ul>
      )}
      <Section title={t('ideas.field.description')} text={idea.description} />
      <Section title={t('ideas.field.descriptionOfInteraction')} text={idea.descriptionOfInteraction} />
      <Section title={t('ideas.field.targetGroup')} text={idea.targetGroup} />
      <Section title={t('ideas.goal')} text={idea.goal} />
      <Section title={t('ideas.sustainability')} text={idea.sustainability} />
      <Section title={t('ideas.field.staffNeeded')} text={idea.staffNeeded} />
      <Section title={t('ideas.field.exhibitRelated')} text={idea.exhibitRelated} />
      <Section title={t('ideas.accessibility')} text={idea.accessibility} />
      <section>
        <h2 className={h2}>{t('ideas.space.legend')}</h2>
        <p>
          {space.areaM2 == null ? '—' : `${space.areaM2} m²`} · {space.volumeM3 == null ? '—' : `${space.volumeM3} m³`}
        </p>
      </section>
      <section>
        <h2 className={h2}>{t('ideas.equipment.label')}</h2>
        {idea.equipment.length === 0 ? (
          <p className={muted}>{t('ideas.equipment.none')}</p>
        ) : (
          <ul className="list-disc pl-5">
            {idea.equipment.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className={h2}>{t('ideas.budget')}</h2>
        <p>{idea.budget ?? t('ideas.budget.notSet')}</p>
      </section>
    </article>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className={h2}>{title}</h2>
      {text ? <p className="whitespace-pre-line">{text}</p> : <p className={muted}>—</p>}
    </section>
  )
}
