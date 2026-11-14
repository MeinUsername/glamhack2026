import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { label as labelClass } from '../ui'
import { ICOM_GROUPS, LOCATION_LABEL, LOCATIONS, pick } from './icom'

// Chips of the ICOM filter (F-021) in the «Objektschild» style: square, 2px frame,
// active = accent background with white text.

const chipFace =
  'inline-flex min-h-11 items-center border-2 border-ink px-3 py-2 text-left text-[15px] leading-tight font-medium transition-colors'

// A toggle chip for the filter bar (button with aria-pressed).
export function FilterChip({
  pressed,
  onClick,
  title,
  children,
}: {
  pressed: boolean
  onClick: () => void
  title?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title}
      onClick={onClick}
      className={`${chipFace} cursor-pointer bg-paper text-ink hover:bg-[#eef0fb] aria-pressed:bg-accent aria-pressed:text-on-accent aria-pressed:hover:bg-ink`}
    >
      {children}
    </button>
  )
}

// A checkbox that looks like a chip, for forms. The real checkbox stays for keyboard and screen readers.
export function ChipCheckbox({
  checked,
  onChange,
  title,
  children,
}: {
  checked: boolean
  onChange: () => void
  title?: string
  children: ReactNode
}) {
  return (
    <label title={title} className="inline-flex cursor-pointer">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        className={`${chipFace} bg-paper text-ink hover:bg-[#eef0fb] peer-checked:bg-accent peer-checked:text-on-accent peer-checked:hover:bg-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent`}
      >
        {children}
      </span>
    </label>
  )
}

// Category and location chips for the idea form.
export function IcomPicker({
  categories,
  locations,
  onToggleCategory,
  onToggleLocation,
}: {
  categories: string[]
  locations: string[]
  onToggleCategory: (id: string) => void
  onToggleLocation: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage
  return (
    <>
      <fieldset className="grid gap-4">
        <legend className={`${labelClass} mb-2`}>{t('ideas.filter.categories')}</legend>
        {ICOM_GROUPS.map((g) => (
          <fieldset key={g.id} className="grid gap-2">
            <legend className="mb-1 text-sm font-bold">{pick(g.label, lang)}</legend>
            <div className="flex flex-wrap gap-2">
              {g.categories.map((c) => (
                <ChipCheckbox
                  key={c.id}
                  checked={categories.includes(c.id)}
                  onChange={() => onToggleCategory(c.id)}
                  title={pick(c.description, lang)}
                >
                  {pick(c.label, lang)}
                </ChipCheckbox>
              ))}
            </div>
          </fieldset>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className={`${labelClass} mb-2`}>{pick(LOCATION_LABEL, lang)}</legend>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((o) => (
            <ChipCheckbox key={o.id} checked={locations.includes(o.id)} onChange={() => onToggleLocation(o.id)}>
              {pick(o.label, lang)}
            </ChipCheckbox>
          ))}
        </div>
      </fieldset>
    </>
  )
}
