import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PromptLevel } from '../types'
import { button, buttonSecondary } from '../ui'
import { pickLocalized } from './localized'

interface Props {
  levels: PromptLevel[]
  initialId: string
  onConfirm: (level: PromptLevel) => void
  onCancel: () => void
}

// F-018 D2: asks for the detail level before copying or downloading. Escape and «Cancel» do nothing.
export default function LevelDialog({ levels, initialId, onConfirm, onCancel }: Props) {
  const { t, i18n } = useTranslation()
  const [selected, setSelected] = useState(initialId)
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    first.current?.focus()
  }, [])

  const chosen = levels.find((l) => l.id === selected) ?? levels[0]

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/60 p-4"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-dialog-title"
        className="w-full max-w-md rounded-card border-2 border-ink bg-paper p-7"
      >
        <h2 id="level-dialog-title" className="mt-0 mb-4 font-display text-[30px] leading-tight font-semibold tracking-[-0.03em]">
          {t('prompt.level.title')}
        </h2>
        <div role="radiogroup" className="grid gap-2">
          {levels.map((l, i) => (
            <label
              key={l.id}
              className="group flex cursor-pointer items-start gap-3 rounded-field border-2 border-ink p-3 hover:bg-coral-soft has-checked:bg-accent has-checked:text-on-accent"
            >
              <input
                ref={i === 0 ? first : undefined}
                type="radio"
                name="prompt-level"
                value={l.id}
                checked={selected === l.id}
                onChange={() => setSelected(l.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-bold">{pickLocalized(l.titles, i18n.resolvedLanguage)}</span>
                <span className="block text-sm text-ink-2 group-has-checked:text-on-accent">
                  {pickLocalized(l.descriptions, i18n.resolvedLanguage)}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={buttonSecondary}
          >
            {t('prompt.level.cancel')}
          </button>
          <button type="button" className={button} onClick={() => chosen && onConfirm(chosen)}>
            {t('prompt.level.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
