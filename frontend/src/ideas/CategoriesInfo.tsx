import { useId, useState, type KeyboardEvent, type FocusEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from './categories'

// Keyboard focus only counts as "visible" when the browser says so; unknown selectors count as visible.
function isFocusVisible(el: HTMLElement): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

// The info button next to the field title. It opens on hover and on keyboard focus, and closes
// on leave, blur or Escape. On touch devices (hover: none) it is not rendered (Q-009-06).
export default function CategoriesInfo() {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [touch] = useState(() => window.matchMedia?.('(hover: none)')?.matches === true)
  if (touch) return null

  function handleFocus(event: FocusEvent<HTMLButtonElement>) {
    if (isFocusVisible(event.currentTarget)) setOpen(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') setOpen(false)
  }

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={t('ideas.categories.about')}
        aria-describedby={id}
        className="ml-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center border-2 border-ink bg-paper font-mono text-xs normal-case hover:bg-accent hover:text-on-accent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={handleFocus}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      >
        i
      </button>
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        className="absolute top-full left-0 z-10 mt-2 grid w-80 max-w-[80vw] gap-2 border-2 border-ink bg-paper p-4 font-sans text-sm font-normal normal-case tracking-normal text-ink"
      >
        <span>{t('categories.intro')}</span>
        {CATEGORIES.map((c) => (
          <span key={c.key} className="grid gap-0.5">
            <span className="font-bold">{c.label}</span>
            <span>{t(c.explanation)}</span>
          </span>
        ))}
        <span className="text-xs text-ink-2">{t('categories.source')}</span>
      </span>
    </span>
  )
}
