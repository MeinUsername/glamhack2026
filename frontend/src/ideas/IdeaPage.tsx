import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import type { Idea } from '../types'
import { buttonSecondary, chip, errorText, h1Compact, label, muted } from '../ui'
import { CATEGORY_LABEL } from './categories'
import BasketButton from '../basket/BasketButton'
import { icomCategory, location, LOCATION_LABEL, pick } from './icom'

const tagLink =
  'inline-flex min-h-11 items-center border-2 border-ink bg-paper px-3 py-2 text-[15px] leading-tight font-medium text-ink no-underline hover:bg-accent hover:text-on-accent'

// F-021: the ICOM categories and locations of the idea. Each one links to the overview filtered by it.
function IcomTags({ idea }: { idea: Idea }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  const cats = (idea.icomCategories ?? []).flatMap((id) => {
    const c = icomCategory(id)
    return c ? [c] : []
  })
  const locs = (idea.locations ?? []).flatMap((id) => {
    const o = location(id)
    return o ? [o] : []
  })
  if (cats.length === 0 && locs.length === 0) return null
  return (
    <div className="grid gap-3">
      {cats.length > 0 && (
        <div className="grid gap-2">
          <h2 className={`${label} m-0`}>{t('ideas.filter.categories')}</h2>
          <ul className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <li key={c.id}>
                <Link to={`/ideas?categories=${c.id}`} title={pick(c.description, lang)} className={tagLink}>
                  {pick(c.label, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {locs.length > 0 && (
        <div className="grid gap-2">
          <h2 className={`${label} m-0`}>{pick(LOCATION_LABEL, lang)}</h2>
          <ul className="flex flex-wrap gap-2">
            {locs.map((o) => (
              <li key={o.id}>
                <Link to={`/ideas?locations=${o.id}`} className={tagLink}>
                  {pick(o.label, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

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
    <article className="grid max-w-3xl gap-5">
      <h1 className={`${h1Compact} mb-0`}>{title}</h1>
      <div className="flex flex-wrap gap-3">
        <BasketButton ideaId={idea.id} />
        <Link to={`/ideas/${idea.id}/edit`} className={buttonSecondary}>
          {t('ideas.edit')}
        </Link>
      </div>
      {idea.categories.length > 0 && (
        <ul aria-label={t('ideas.categories.chips')} className="flex flex-wrap gap-2">
          {idea.categories.map((key) => (
            <li key={key} className={chip}>
              {CATEGORY_LABEL[key]}
            </li>
          ))}
        </ul>
      )}
      <IcomTags idea={idea} />
      {idea.images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {idea.images.map((_, n) => (
            <li key={n}>
              <img
                src={`/api/ideas/${idea.id}/images/${n}`}
                alt={t('ideas.imageAlt', { title, n: n + 1 })}
                className="aspect-[16/10] w-full border-2 border-ink object-cover"
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
        <h2 className={sectionHead}>{t('ideas.space.legend')}</h2>
        <p>
          {space.areaM2 == null ? '—' : `${space.areaM2} m²`} · {space.volumeM3 == null ? '—' : `${space.volumeM3} m³`}
        </p>
      </section>
      <section>
        <h2 className={sectionHead}>{t('ideas.equipment.label')}</h2>
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
        <h2 className={sectionHead}>{t('ideas.budget')}</h2>
        <p>{idea.budget ?? t('ideas.budget.notSet')}</p>
      </section>
    </article>
  )
}

// Section heads look like the metadata lines of an object label.
const sectionHead = `${label} mb-2 border-t-2 border-ink pt-3`

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className={sectionHead}>{title}</h2>
      {text ? <p className="m-0 whitespace-pre-line leading-[1.55]">{text}</p> : <p className={muted}>—</p>}
    </section>
  )
}
