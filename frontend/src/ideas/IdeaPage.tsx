import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import type { Idea } from '../types'
import { buttonSecondary, chip, errorText, h1Compact, label, muted } from '../ui'
import { CATEGORY_LABEL } from './categories'
import BasketButton from '../basket/BasketButton'
import { icomCategory, location, LOCATION_LABEL, pick } from './icom'
import Gallery from './Gallery'
import StatusBadge from '../components/StatusBadge'
import MarkdownView from '../components/MarkdownView'
import { useMe } from '../auth/useMe'
import { groupLinks } from './links'
import { useLinkTypes } from './useLinkTypes'

const tagLink =
  'inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-paper px-[18px] py-2 text-[15px] leading-tight font-medium text-ink no-underline hover:bg-coral hover:text-ink'

// F-024: the ICOM categories and locations of the idea. Each one links to the overview filtered by it.
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
      <StatusBadge status={idea.status} />
      {idea.status === 'rejected' && idea.rejectionReason && (
        <p role="note" className="m-0">
          <strong>{t('status.reason')}:</strong> {idea.rejectionReason}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <BasketButton ideaId={idea.id} />
        <Link to={`/ideas/${idea.id}/edit`} className={buttonSecondary}>
          {t('ideas.edit')}
        </Link>
        <DeleteButton ideaId={idea.id} />
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
      <Gallery ideaId={idea.id} versions={idea.images.map((img) => img.version)} title={title} />
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
      <Credit idea={idea} />
      <Links idea={idea} />
      {idea.mediationConcept?.trim() && (
        <section>
          <h2 className={sectionHead}>{t('ideas.field.mediationConcept')}</h2>
          <MarkdownView text={idea.mediationConcept} />
        </section>
      )}
    </article>
  )
}

// F-033: only admins see it. The idea goes to the trash (soft delete) and can be restored there.
function DeleteButton({ ideaId }: { ideaId: string }) {
  const { t } = useTranslation()
  const me = useMe()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  if (me.status !== 'ready' || me.me.role !== 'admin') return null

  async function remove() {
    if (!window.confirm(t('ideas.delete.confirm'))) return
    setError('')
    try {
      await api(`/api/ideas/${encodeURIComponent(ideaId)}`, { method: 'DELETE' })
      navigate('/ideas')
    } catch {
      setError(t('ideas.delete.error'))
    }
  }

  return (
    <>
      <button type="button" className={buttonSecondary} onClick={remove}>
        {t('ideas.delete')}
      </button>
      {error && <p role="alert" className={`${errorText} m-0`}>{error}</p>}
    </>
  )
}

// Section heads look like the metadata lines of an object label.
const sectionHead = `${label} mb-2 border-t border-ink/20 pt-4`

// F-027: credit line and contact; only the filled parts, and nothing at all if all are empty.
function Credit({ idea }: { idea: Idea }) {
  const { t } = useTranslation()
  const name = [idea.creditFirstName, idea.creditLastName].map((v) => v?.trim()).filter(Boolean).join(' ')
  const institute = idea.creditInstitute?.trim()
  const email = idea.creditEmail?.trim()
  if (!name && !institute && !email) return null
  return (
    <section>
      <h2 className={sectionHead}>{t('ideas.credit.legend')}</h2>
      {name && <p className="m-0">{name}</p>}
      {institute && <p className="m-0">{institute}</p>}
      {email && (
        <p className="m-0">
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      )}
    </section>
  )
}

// F-031: links grouped by type, after the credit line. Nothing if the idea has no links.
function Links({ idea }: { idea: Idea }) {
  const { t } = useTranslation()
  const types = useLinkTypes()
  const links = idea.links ?? []
  if (links.length === 0 || types === null) return null
  return (
    <section>
      <h2 className={sectionHead}>{t('links.title')}</h2>
      {groupLinks(links, types).map((g) => (
        <div key={g.typeName} className="mb-3">
          {g.typeName && <h3 className="m-0 font-mono text-[13px] font-medium tracking-[0.05em] uppercase">{g.typeName}</h3>}
          <ul className="m-0 list-disc pl-5">
            {g.links.map((l, i) => (
              <li key={i} className="break-all">
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.title?.trim() || l.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className={sectionHead}>{title}</h2>
      {text ? <p className="m-0 whitespace-pre-line leading-[1.55]">{text}</p> : <p className={muted}>—</p>}
    </section>
  )
}
