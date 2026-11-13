import { useId, useState, type KeyboardEvent, type FocusEvent } from 'react'
import { CATEGORIES, CATEGORY_INTRO, CATEGORY_SOURCE } from './categories'

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
        aria-label="About the categories"
        aria-describedby={id}
        className="ml-1 cursor-pointer rounded-full border border-gray-400/60 px-1.5 text-xs leading-5"
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
        className="absolute top-full left-0 z-10 mt-2 grid w-80 max-w-[80vw] gap-2 rounded-lg border border-gray-400/50 bg-white p-3 text-sm font-normal shadow-lg dark:bg-gray-900"
      >
        <span>{CATEGORY_INTRO}</span>
        {CATEGORIES.map((c) => (
          <span key={c.key} className="grid gap-0.5">
            <span className="font-medium">{c.label}</span>
            <span>{c.explanation}</span>
          </span>
        ))}
        <span className="text-xs opacity-70">{CATEGORY_SOURCE}</span>
      </span>
    </span>
  )
}
