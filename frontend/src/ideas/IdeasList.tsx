import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import BasketButton from '../basket/BasketButton'
import { imageUrl } from './imageUrl'
import StatusBadge from '../components/StatusBadge'
import type { IdeaStatus } from '../types'
import FittedImage from './FittedImage'
import { buttonOnAccent, errorText, h1, label, mark, muted } from '../ui'
import { FilterChip } from './IcomChips'
import {
  ICOM_CATEGORY_IDS,
  ICOM_GROUPS,
  icomCategory,
  location,
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
  coverVersion?: string
  status?: IdeaStatus
  icomCategories?: string[]
  locations?: string[]
}

// URL parameters of the filter (F-024), so that a filtered view can be shared.
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
  const panel = useScrollable<HTMLElement>()

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
        // Filter as a side panel on the left; on narrow screens it stacks above the ideas.
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Scrolls on its own when taller than the window, without a visible scrollbar; the up/down
              cursor shows that it can scroll (only when it really can). */}
          <aside
            ref={panel.ref}
            className={`w-full [scrollbar-width:none] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-[360px] lg:shrink-0 lg:overflow-y-auto lg:rounded-card 2xl:w-[400px] [&::-webkit-scrollbar]:hidden ${
              panel.scrollable ? 'lg:cursor-ns-resize' : ''
            }`}
          >
            <FilterBar
              categories={categories}
              locations={locations}
              shown={shown.length}
              total={rows.length}
              onToggleCategory={(id) => update(CATEGORIES_PARAM, toggle(categories, id), ICOM_CATEGORY_IDS)}
              onToggleLocation={(id) => update(LOCATIONS_PARAM, toggle(locations, id), LOCATION_IDS)}
              onReset={reset}
            />
          </aside>
          <div className="min-w-0 flex-1">
            {shown.length === 0 ? (
              <p className={`${muted} m-0 pt-2`}>{t('ideas.filter.noMatch')}</p>
            ) : (
              <ul className="m-0 grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-x-6 gap-y-10 p-0 pt-4">
                {shown.map(({ row, number }) => (
                  <IdeaCard key={row.id} row={row} number={number} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Tells whether an element is taller than its visible area (so it can scroll). Follows resizes and
// content changes; without ResizeObserver (old browsers, tests) it stays false.
function useScrollable<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [scrollable, setScrollable] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const check = () => setScrollable(el.scrollHeight > el.clientHeight + 1)
    const observer = new ResizeObserver(check)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    window.addEventListener('resize', check)
    check()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', check)
    }
  })
  return { ref, scrollable }
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

  // One switch shows or hides the sub-categories of all main categories at once; there is no
  // single-group toggle. It starts off, and turns on when a category is chosen (e.g. from a shared link).
  const [showAll, setShowAll] = useState(categories.length > 0)
  const categoriesKey = categories.join(',')
  useEffect(() => {
    if (categoriesKey) setShowAll(true)
  }, [categoriesKey])
  const panelIds = ICOM_GROUPS.map((g) => `filter-panel-${g.id}`).join(' ')

  return (
    <section aria-labelledby="idea-filter-title" className="overflow-hidden rounded-card border-2 border-ink bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-accent px-5 py-3 text-on-accent">
        <h2 id="idea-filter-title" className="m-0 font-mono text-[13px] font-medium tracking-[0.05em] uppercase">
          {t('ideas.filter.title')}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <p role="status" aria-live="polite" className="m-0 rounded-full bg-coral px-3 py-1 font-mono text-[13px] text-ink">
            {t('ideas.filter.count', { shown, total })}
          </p>
          <button type="button" className={buttonOnAccent} disabled={!active} onClick={onReset}>
            {t('ideas.filter.reset')}
          </button>
        </div>
      </div>
      <div className="grid gap-4 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={`${label} m-0`}>{t('ideas.filter.categories')}</h3>
          {/* On/off switch: the whole pill is the control, the track shows the state. */}
          <button
            type="button"
            role="switch"
            aria-checked={showAll}
            aria-controls={panelIds}
            onClick={() => setShowAll((v) => !v)}
            className="group inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-full py-1 pr-1 pl-3 font-sans text-base font-semibold text-ink hover:bg-coral-soft"
          >
            <span>{t('ideas.filter.expandAll')}</span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-ink transition-colors ${
                showAll ? 'bg-accent' : 'bg-paper'
              }`}
            >
              <span
                className={`absolute left-[3px] h-[22px] w-[22px] rounded-full border-2 border-ink transition-transform duration-200 ${
                  showAll ? 'translate-x-6 bg-coral' : 'translate-x-0 bg-paper'
                }`}
              />
            </span>
          </button>
        </div>
        {/* Each main category sits right above its own sub-categories (one column in the side panel). */}
        <div className="grid items-start gap-y-4">
          {ICOM_GROUPS.map((g) => {
            const chosen = g.categories.filter((c) => categories.includes(c.id)).length
            return (
              <div key={g.id} className="grid gap-2">
                <h4
                  id={`filter-group-${g.id}`}
                  className="m-0 flex min-h-11 items-center justify-between gap-2.5 rounded-full border-2 border-ink bg-ink py-2 pr-3 pl-5 font-display text-[17px] font-semibold tracking-[-0.01em] text-on-accent"
                >
                  <span>{pick(g.label, lang)}</span>
                  {chosen > 0 && (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-coral px-1.5 font-mono text-xs text-ink"
                    >
                      {chosen}
                    </span>
                  )}
                </h4>
                <div
                  id={`filter-panel-${g.id}`}
                  hidden={!showAll}
                  role="group"
                  aria-labelledby={`filter-group-${g.id}`}
                  className="flex flex-wrap gap-2 px-1 pt-1 pb-2"
                >
                  {g.categories.map((c) => (
                    <div key={c.id} className="grid basis-full gap-1">
                      <div>
                        <FilterChip pressed={categories.includes(c.id)} onClick={() => onToggleCategory(c.id)} describedBy={`filter-desc-${c.id}`}>
                          {pick(c.label, lang)}
                        </FilterChip>
                      </div>
                      <p id={`filter-desc-${c.id}`} className={`${muted} m-0 px-1 text-sm leading-snug`}>
                        {pick(c.description, lang)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div role="group" aria-labelledby="filter-group-location" className="grid gap-2 border-t-2 border-ink px-5 py-5">
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
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  const nr = String(number).padStart(2, '0')
  const locations = (row.locations ?? []).flatMap((id) => {
    const o = location(id)
    return o ? [pick(o.label, lang)] : []
  })
  const categories = (row.icomCategories ?? []).flatMap((id) => {
    const c = icomCategory(id)
    return c ? [pick(c.label, lang)] : []
  })
  const odd = number % 2 === 1
  return (
    <li className="relative flex flex-col rounded-card border-2 border-ink bg-paper">
      {/* Number sticker, tilted a little; odd and even lean different ways. */}
      <span
        className={`absolute -top-4 left-5 z-[1] inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-ink bg-coral font-display text-lg font-bold tracking-[-0.02em] text-ink ${
          odd ? '-rotate-[8deg]' : 'rotate-[6deg]'
        }`}
      >
        <span className="sr-only">{t('ideas.list.number', { n: nr })}</span>
        <span aria-hidden="true">{nr}</span>
      </span>
      {/* Fixed 16:10 frame, set in from the card edge: the photo is laid over it, so tall or wide
          photos never change its size. */}
      <div className="relative mx-3 mt-3 aspect-[16/10] shrink-0 overflow-hidden rounded-[18px]">
        {row.imageCount > 0 ? (
          <FittedImage src={imageUrl(row.id, 0, row.coverVersion)} alt="" />
        ) : (
          // No picture: soft shapes in the accents, so the grid stays even.
          <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${odd ? 'bg-accent' : 'bg-coral-soft'}`}>
            <div className="absolute top-[14%] -right-[8%] aspect-square w-[44%] rounded-full bg-coral" />
            <div
              className={`absolute top-[28%] left-[18%] aspect-square w-[26%] rounded-full border-2 ${odd ? 'border-paper' : 'border-ink'}`}
            />
          </div>
        )}
        {row.imageCount > 1 && (
          <span className="absolute right-3 bottom-3 rounded-full border-2 border-ink bg-paper px-3 py-0.5 font-mono text-xs uppercase">
            {t('ideas.list.images', { count: row.imageCount })}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-6 pt-5 pb-6">
        {locations.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {locations.map((name) => (
              <li key={name} className="rounded-full border-2 border-ink px-3 py-0.5 font-mono text-xs">
                {name}
              </li>
            ))}
          </ul>
        )}
        <StatusBadge status={row.status} />
        <h2 className="m-0 font-display text-[30px] leading-[1.08] font-semibold tracking-[-0.03em]">
          <Link to={`/ideas/${row.id}`} className="text-ink no-underline hover:text-accent">
            {row.title || t('ideas.untitled')}
          </Link>
        </h2>
        {row.description && (
          <p className="m-0 whitespace-pre-line text-[17px] leading-[1.6] text-ink-2">{row.description}</p>
        )}
        {categories.length > 0 && <p className={`${label} m-0 mt-auto pt-1 text-xs text-ink-2`}>{categories.join(' · ')}</p>}
      </div>
      <div className="flex items-center gap-2 px-6 pb-6">
        <div className="min-w-0 flex-1">
          <BasketButton ideaId={row.id} variant="bar" />
        </div>
        {/* F-020: every card leads to editing its idea. */}
        <Link
          to={`/ideas/${row.id}/edit`}
          className="inline-flex min-h-[52px] shrink-0 items-center rounded-full border-2 border-ink bg-paper px-5 font-semibold text-ink no-underline hover:bg-ink hover:text-on-accent"
        >
          {t('ideas.edit')}
        </Link>
      </div>
    </li>
  )
}
