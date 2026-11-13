import { useEffect, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { button, input, linkButton, muted } from '../ui'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

const SUGGEST_DELAY_MS = 250

// Chips for the devices an idea needs. Suggestions come from all devices entered so far.
export default function EquipmentInput({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    const q = text.trim()
    if (!q) {
      setSuggestions([])
      return
    }
    let active = true
    const timer = setTimeout(() => {
      api<string[]>(`/api/equipment?q=${encodeURIComponent(q)}`)
        .then((names) => active && setSuggestions(names))
        .catch(() => active && setSuggestions([]))
    }, SUGGEST_DELAY_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [text])

  // Adds a chip unless the name is empty or already there (ignoring case).
  function add(name: string) {
    const clean = name.trim()
    setText('')
    setSuggestions([])
    if (!clean) return
    if (value.some((v) => v.toLowerCase() === clean.toLowerCase())) return
    onChange([...value, clean])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(text)
    }
  }

  return (
    <div className="grid gap-2">
      <ul className="flex flex-wrap gap-2" aria-label={t('ideas.equipment.label')}>
        {value.map((name) => (
          <li key={name} className="flex items-center gap-1 rounded-full border border-gray-400/50 px-3 py-1">
            {name}
            <button
              type="button"
              aria-label={t('ideas.equipment.remove', { name })}
              className={linkButton}
              onClick={() => onChange(value.filter((v) => v !== name))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <input
        aria-label={t('ideas.equipment.add')}
        className={input}
        placeholder={t('ideas.equipment.placeholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t('ideas.equipment.suggestions')}>
          {suggestions.map((name) => (
            <li key={name}>
              <button type="button" className={button} onClick={() => add(name)}>
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {text.trim() && suggestions.length === 0 && (
        <p className={muted}>{t('ideas.equipment.enterHint', { name: text.trim() })}</p>
      )}
    </div>
  )
}
