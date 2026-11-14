import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { label } from '../ui'
import { imageUrl } from './imageUrl'
import FittedImage from './FittedImage'

interface Props {
  ideaId: string
  // One version per image (F-029): it goes into the URL, so a replaced image is not taken from the cache.
  versions: string[]
  title: string
}

// The pictures of an idea: a large first image and thumbnails. Each opens the lightbox.
export default function Gallery({ ideaId, versions, title }: Props) {
  const { t } = useTranslation()
  const count = versions.length
  const [open, setOpen] = useState<number | null>(null)
  if (count === 0) return null

  // All tiles share one size: an even grid, every picture cropped to 4:3.
  return (
    <section aria-label={t('gallery.label')} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }, (_, n) => (
        <button
          key={n}
          type="button"
          onClick={() => setOpen(n)}
          aria-label={t('gallery.open', { title, n: n + 1, count })}
          className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-field border-2 border-ink bg-paper p-0"
        >
          <FittedImage
            src={imageUrl(ideaId, n, versions[n])}
            alt={t('ideas.imageAlt', { title, n: n + 1 })}
            className="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>
      ))}
      {open !== null && (
        <Lightbox ideaId={ideaId} versions={versions} title={title} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  )
}

interface LightboxProps extends Props {
  index: number
  onIndex: (n: number) => void
  onClose: () => void
}

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

function Lightbox({ ideaId, versions, title, index, onIndex, onClose }: LightboxProps) {
  const { t } = useTranslation()
  const count = versions.length
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)

  // Focus goes into the lightbox and back to the opening thumbnail afterwards; the page does not scroll behind it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      opener?.focus?.()
    }
  }, [])

  const go = (delta: number) => onIndex((index + delta + count) % count)

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowRight' && count > 1) {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowLeft' && count > 1) {
      e.preventDefault()
      go(-1)
    } else if (e.key === 'Tab' && dialog.current) {
      // Keep the focus inside the dialog.
      const items = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    const start = touchX.current
    touchX.current = null
    if (start === null || count < 2) return
    const dx = e.changedTouches[0].clientX - start
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
  }

  const arrow =
    'inline-flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-paper bg-transparent text-2xl text-paper hover:bg-paper hover:text-ink max-sm:h-12 max-sm:w-12'

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={t('gallery.dialog', { title })}
      onKeyDown={handleKeyDown}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-30 flex flex-col bg-ink/95 text-paper"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <p aria-live="polite" className={`${label} m-0 text-paper`}>
          {t('gallery.counter', { n: index + 1, count })}
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-paper bg-transparent px-5 font-sans text-base font-semibold text-paper hover:bg-paper hover:text-ink"
        >
          {t('gallery.close')} <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center gap-4 px-4 sm:px-8"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {count > 1 && (
          <button type="button" className={arrow} onClick={() => go(-1)} aria-label={t('gallery.prev')}>
            <span aria-hidden="true">←</span>
          </button>
        )}
        <img
          key={index}
          src={imageUrl(ideaId, index, versions[index])}
          alt={t('ideas.imageAlt', { title, n: index + 1 })}
          className="max-h-full min-w-0 max-w-full rounded-field object-contain"
        />
        {count > 1 && (
          <button type="button" className={arrow} onClick={() => go(1)} aria-label={t('gallery.next')}>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {count > 1 ? (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4 sm:px-8">
          {Array.from({ length: count }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => onIndex(n)}
              aria-label={t('gallery.show', { n: n + 1, count })}
              aria-current={n === index ? 'true' : undefined}
              className="h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-[10px] border-2 border-paper/40 bg-transparent p-0 opacity-60 hover:opacity-100 aria-[current=true]:border-coral aria-[current=true]:opacity-100"
            >
              <img src={imageUrl(ideaId, n, versions[n])} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="h-6" />
      )}
    </div>
  )
}
