import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { api, ApiError } from '../api'
import { useMe } from '../auth/useMe'
import { button, errorText, h1, input, muted } from '../ui'
import EquipmentInput from './EquipmentInput'
import { BUDGETS, imageProblem, MAX_IDEA_IMAGES } from './rules'
import { CATEGORIES } from './categories'
import CategoriesInfo from './CategoriesInfo'
import type { Category } from '../types'

// Text fields of the form; the names are the English field names of the spec.
interface Draft {
  title: string
  description: string
  audience: string
  areaM2: string
  volumeM3: string
  equipment: string[]
  categories: Category[]
  goal: string
  sustainability: string
  accessibility: string
  budget: string
}

const emptyDraft: Draft = {
  title: '',
  description: '',
  audience: '',
  areaM2: '',
  volumeM3: '',
  equipment: [],
  categories: [],
  goal: '',
  sustainability: '',
  accessibility: '',
  budget: '',
}

export default function IdeaForm() {
  const me = useMe()
  if (me.status === 'loading') return <p className={muted}>Loading…</p>
  if (me.status === 'anonymous') return <Navigate to="/login" replace />
  return <NewIdea />
}

function NewIdea() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [images, setImages] = useState<File[]>([])
  const [imageError, setImageError] = useState('')
  const [inputKey, setInputKey] = useState(0) // remounts the file input after a rejected pick
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleCategory(key: Category) {
    set(
      'categories',
      draft.categories.includes(key) ? draft.categories.filter((c) => c !== key) : [...draft.categories, key],
    )
  }

  function handlePickImages(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    const problem = imageProblem(picked)
    setImageError(problem)
    if (problem) {
      // Rejected files are not kept, so the user sees what is left to fix.
      setImages([])
      setInputKey((k) => k + 1)
      return
    }
    setImages(picked)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    const problem = imageProblem(images)
    if (problem) {
      setImageError(problem)
      return
    }
    const form = new FormData()
    form.append(
      'data',
      JSON.stringify({
        title: draft.title,
        description: draft.description,
        audience: draft.audience,
        goal: draft.goal,
        sustainability: draft.sustainability,
        accessibility: draft.accessibility,
        space: { areaM2: draft.areaM2, volumeM3: draft.volumeM3 },
        equipment: draft.equipment,
        categories: draft.categories,
        budget: draft.budget,
      }),
    )
    for (const file of images) form.append('images', file)

    setBusy(true)
    try {
      const { id } = await api<{ id: string }>('/api/ideas', { method: 'POST', body: form })
      navigate(`/ideas/${id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The idea could not be saved.')
      setBusy(false) // the entered values stay in the form
    }
  }

  return (
    <>
      <h1 className={h1}>New idea</h1>
      <form onSubmit={handleSubmit} className="grid max-w-xl gap-4">
        <Field label="Title">
          <input className={input} value={draft.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea className={input} rows={4} value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label={`Images (up to ${MAX_IDEA_IMAGES}, JPG, PNG or WebP, 5 MB each)`}>
          <input
            key={inputKey}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className={input}
            onChange={handlePickImages}
          />
          {imageError && <span className={errorText}>{imageError}</span>}
        </Field>
        <Field label="Target audience">
          <input className={input} value={draft.audience} onChange={(e) => set('audience', e.target.value)} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="font-medium">Needed space</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Area (m²)">
              <input className={input} inputMode="decimal" value={draft.areaM2} onChange={(e) => set('areaM2', e.target.value)} />
            </Field>
            <Field label="Volume (m³)">
              <input className={input} inputMode="decimal" value={draft.volumeM3} onChange={(e) => set('volumeM3', e.target.value)} />
            </Field>
          </div>
        </fieldset>
        <Field label="Needed equipment">
          <EquipmentInput value={draft.equipment} onChange={(next) => set('equipment', next)} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="font-medium">
            Categories of critical art mediation
            <CategoriesInfo />
          </legend>
          {CATEGORIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={c.key}
                checked={draft.categories.includes(c.key)}
                onChange={() => toggleCategory(c.key)}
              />
              {c.label}
            </label>
          ))}
        </fieldset>
        <Field label="Goal">
          <textarea className={input} rows={3} value={draft.goal} onChange={(e) => set('goal', e.target.value)} />
        </Field>
        <Field label="Sustainability">
          <textarea className={input} rows={3} value={draft.sustainability} onChange={(e) => set('sustainability', e.target.value)} />
        </Field>
        <Field label="Accessibility">
          <textarea className={input} rows={3} value={draft.accessibility} onChange={(e) => set('accessibility', e.target.value)} />
        </Field>
        <Field label="Budget">
          <select className={input} value={draft.budget} onChange={(e) => set('budget', e.target.value)}>
            <option value="">—</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        {error && <p className={errorText}>{error}</p>}
        <div>
          <button type="submit" className={button} disabled={busy || !!imageError}>
            {busy ? 'Saving…' : 'Save idea'}
          </button>
        </div>
      </form>
    </>
  )
}

// A labelled form field; the label wraps the control so tests and screen readers find it.
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
