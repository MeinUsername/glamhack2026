import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PromptLevel } from '../types'
import { button } from '../ui'
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
      className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 p-4"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-dialog-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 id="level-dialog-title" className="mb-3 text-lg font-semibold">
          {t('prompt.level.title')}
        </h2>
        <div role="radiogroup" className="grid gap-2">
          {levels.map((l, i) => (
            <label
              key={l.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
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
                <span className="block font-medium">{pickLocalized(l.titles, i18n.resolvedLanguage)}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {pickLocalized(l.descriptions, i18n.resolvedLanguage)}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700"
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
