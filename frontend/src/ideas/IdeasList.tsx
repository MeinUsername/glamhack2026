import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import BasketButton from '../basket/BasketButton'
import { buttonSecondary, errorText, h1, label, mark, muted } from '../ui'
import { FilterChip } from './IcomChips'
import {
  ICOM_CATEGORY_IDS,
  ICOM_GROUPS,
  LOCATION_IDS,
  LOCATION_LABEL,
  LOCATIONS,
  matchesFilter,
  parseIdList,
  pick,
} from './icom'

interface IdeaRow {
  id: string
  title: string
  imageCount: number
  description: string
  icomCategories?: string[]
  locations?: string[]
}

// URL parameters of the filter (F-021), so that a filtered view can be shared.
const CATEGORIES_PARAM = 'categories'
const LOCATIONS_PARAM = 'locations'

// The overview of all ideas (F-011). Public since F-012 (D1); the basket button marks bought ideas (D1, D2).
export default function IdeasList() {
  return <Overview />
}

function Overview() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<IdeaRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [params, setParams] = useSearchParams()

  const categories = parseIdList(params.get(CATEGORIES_PARAM), ICOM_CATEGORY_IDS)
  const locations = parseIdList(params.get(LOCATIONS_PARAM), LOCATION_IDS)
  const categoriesKey = categories.join(',')
  const locationsKey = locations.join(',')

  useEffect(() => {
    api<IdeaRow[]>('/api/ideas')
      .then(setRows)
      .catch(() => setFailed(true))
  }, [])

  // Numbers stay with the idea, so «Nr. 03» is the same with and without a filter.
  const shown = useMemo(() => {
    const cats = categoriesKey ? categoriesKey.split(',') : []
    const locs = locationsKey ? locationsKey.split(',') : []
    return (rows ?? [])
      .map((row, index) => ({ row, number: index + 1 }))
      .filter(({ row }) => matchesFilter(row, cats, locs))
  }, [rows, categoriesKey, locationsKey])

  function update(name: string, list: string[], valid: string[]) {
    const next = new URLSearchParams(params)
    const ordered = valid.filter((id) => list.includes(id)) // stable order in the URL
    if (ordered.length > 0) next.set(name, ordered.join(','))
    else next.delete(name)
    setParams(next, { replace: true })
  }

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  function reset() {
    const next = new URLSearchParams(params)
    next.delete(CATEGORIES_PARAM)
    next.delete(LOCATIONS_PARAM)
    setParams(next, { replace: true })
  }

  return (
    <>
      <h1 className={h1}>
        <span className={mark}>{t('ideas.list.title')}</span>
      </h1>
      {failed && <p role="alert" className={errorText}>{t('ideas.list.loadError')}</p>}
      {rows === null && !failed && <p className={muted}>{t('common.loading')}</p>}
      {rows !== null && rows.length === 0 && <p className={muted}>{t('ideas.list.empty')}</p>}
      {rows !== null && rows.length > 0 && (
        <>
          <FilterBar
            categories={categories}
            locations={locations}
            shown={shown.length}
            total={rows.length}
            onToggleCategory={(id) => update(CATEGORIES_PARAM, toggle(categories, id), ICOM_CATEGORY_IDS)}
            onToggleLocation={(id) => update(LOCATIONS_PARAM, toggle(locations, id), LOCATION_IDS)}
            onReset={reset}
          />
          {shown.length === 0 ? (
            <p className={`${muted} mt-6`}>{t('ideas.filter.noMatch')}</p>
          ) : (
            <ul className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-6">
              {shown.map(({ row, number }) => (
                <IdeaCard key={row.id} row={row} number={number} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}

function FilterBar({
  categories,
  locations,
  shown,
  total,
  onToggleCategory,
  onToggleLocation,
  onReset,
}: {
  categories: string[]
  locations: string[]
  shown: number
  total: number
  onToggleCategory: (id: string) => void
  onToggleLocation: (id: string) => void
  onReset: () => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  const active = categories.length + locations.length > 0
  return (
    <section aria-labelledby="idea-filter-title" className="border-2 border-ink bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink px-4 py-3">
        <h2 id="idea-filter-title" className={`${label} m-0`}>
          {t('ideas.filter.title')}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" aria-live="polite" className={`${label} m-0`}>
            {t('ideas.filter.count', { shown, total })}
          </p>
          <button type="button" className={buttonSecondary} disabled={!active} onClick={onReset}>
            {t('ideas.filter.reset')}
          </button>
        </div>
      </div>
      <div className="grid gap-6 px-4 py-5 lg:grid-cols-2">
        {ICOM_GROUPS.map((g) => (
          <div key={g.id} role="group" aria-labelledby={`filter-group-${g.id}`} className="grid content-start gap-2">
            <h3 id={`filter-group-${g.id}`} className={`${label} m-0`}>
              {pick(g.label, lang)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {g.categories.map((c) => (
                <FilterChip
                  key={c.id}
                  pressed={categories.includes(c.id)}
                  onClick={() => onToggleCategory(c.id)}
                  title={pick(c.description, lang)}
                >
                  {pick(c.label, lang)}
                </FilterChip>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div role="group" aria-labelledby="filter-group-location" className="grid gap-2 border-t-2 border-ink px-4 py-5">
        <h3 id="filter-group-location" className={`${label} m-0`}>
          {pick(LOCATION_LABEL, lang)}
        </h3>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((o) => (
            <FilterChip key={o.id} pressed={locations.includes(o.id)} onClick={() => onToggleLocation(o.id)}>
              {pick(o.label, lang)}
            </FilterChip>
          ))}
        </div>
        <p className={`${muted} m-0 mt-2 text-sm`}>{t('ideas.filter.hint')}</p>
      </div>
    </section>
  )
}

function IdeaCard({ row, number }: { row: IdeaRow; number: number }) {
  const { t } = useTranslation()
  return (
    <li className="flex flex-col border-2 border-ink bg-paper">
      <div className={`${label} border-b-2 border-ink px-4 py-3`}>
        {t('ideas.list.number', { n: String(number).padStart(2, '0') })}
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
  )
}
