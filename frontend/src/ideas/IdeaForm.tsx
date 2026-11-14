import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../api'
import { button, errorText, h1, input, muted } from '../ui'
import EquipmentInput from './EquipmentInput'
import { BUDGETS, imageProblem, MAX_IDEA_IMAGES } from './rules'
import { CATEGORIES } from './categories'
import CategoriesInfo from './CategoriesInfo'
import MarkdownEditor from './MarkdownEditor'
import type { Category, Idea } from '../types'

// Text fields of the form; the names are the English field names of the spec.
interface Draft {
  title: string
  description: string
  mediationConcept: string
  targetGroup: string
  descriptionOfInteraction: string
  staffNeeded: string
  exhibitRelated: string
  areaM2: string
  volumeM3: string
  equipment: string[]
  categories: Category[]
  goal: string
  sustainability: string
  accessibility: string
  budget: string
}

// The form values of an existing idea, for editing (F-012 T8).
function draftFrom(idea: Idea): Draft {
  return {
    title: idea.title,
    description: idea.description,
    mediationConcept: idea.mediationConcept ?? '',
    targetGroup: idea.targetGroup,
    descriptionOfInteraction: idea.descriptionOfInteraction,
    staffNeeded: idea.staffNeeded,
    exhibitRelated: idea.exhibitRelated,
    areaM2: idea.space.areaM2 === null ? '' : String(idea.space.areaM2),
    volumeM3: idea.space.volumeM3 === null ? '' : String(idea.space.volumeM3),
    equipment: idea.equipment,
    categories: idea.categories,
    goal: idea.goal,
    sustainability: idea.sustainability,
    accessibility: idea.accessibility,
    budget: idea.budget ?? '',
  }
}

const emptyDraft: Draft = {
  title: '',
  description: '',
  mediationConcept: '',
  targetGroup: '',
  descriptionOfInteraction: '',
  staffNeeded: '',
  exhibitRelated: '',
  areaM2: '',
  volumeM3: '',
  equipment: [],
  categories: [],
  goal: '',
  sustainability: '',
  accessibility: '',
  budget: '',
}

// /ideas/new: no login needed (F-012 D1).
export default function IdeaForm() {
  return <IdeaEditor />
}

// /ideas/:id/edit (F-012 T6, T8): the same form, filled with the idea.
export function IdeaEdit() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    api<Idea>(`/api/ideas/${encodeURIComponent(id)}`)
      .then((loaded) => active && setIdea(loaded))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [id])

  if (failed) return <p className={errorText}>{t('ideas.loadError')}</p>
  if (!idea) return <p className={muted}>{t('common.loading')}</p>
  return <IdeaEditor edit={idea} />
}

function IdeaEditor({ edit }: { edit?: Idea }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Draft>(() => (edit ? draftFrom(edit) : emptyDraft))
  // Indices of the existing images that stay (keepImages). New ones are added with the file picker.
  const [keep, setKeep] = useState<number[]>(() => (edit ? edit.images.map((_, n) => n) : []))
  const [images, setImages] = useState<File[]>([])
  const [imageError, setImageError] = useState('')
  const [inputKey, setInputKey] = useState(0) // remounts the file input after a rejected pick
  // Kept plus new images may not exceed the limit; recomputed when the checkboxes change (F-020).
  const countProblem = images.length > 0 ? imageProblem(images, t, keep.length) : ''
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleKeep(n: number) {
    setKeep((k) => (k.includes(n) ? k.filter((i) => i !== n) : [...k, n]))
  }

  function toggleCategory(key: Category) {
    set(
      'categories',
      draft.categories.includes(key) ? draft.categories.filter((c) => c !== key) : [...draft.categories, key],
    )
  }

  function handlePickImages(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    const problem = imageProblem(picked, t)
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
    if (countProblem) return
    const problem = imageProblem(images, t)
    if (problem) {
      setImageError(problem)
      return
    }
    const form = new FormData()
    const data: Record<string, unknown> = {
      title: draft.title,
      description: draft.description,
      mediationConcept: draft.mediationConcept,
      targetGroup: draft.targetGroup,
      descriptionOfInteraction: draft.descriptionOfInteraction,
      staffNeeded: draft.staffNeeded,
      exhibitRelated: draft.exhibitRelated,
      goal: draft.goal,
      sustainability: draft.sustainability,
      accessibility: draft.accessibility,
      space: { areaM2: draft.areaM2, volumeM3: draft.volumeM3 },
      equipment: draft.equipment,
      categories: draft.categories,
      budget: draft.budget,
    }
    if (edit) data.keepImages = keep
    form.append('data', JSON.stringify(data))
    for (const file of images) form.append('images', file)

    setBusy(true)
    try {
      const { id } = edit
        ? await api<{ id: string }>(`/api/ideas/${edit.id}`, { method: 'PUT', body: form })
        : await api<{ id: string }>('/api/ideas', { method: 'POST', body: form })
      navigate(`/ideas/${id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('ideas.saveError'))
      setBusy(false) // the entered values stay in the form
    }
  }

  return (
    <>
      <h1 className={h1}>{edit ? t('ideas.editTitle') : t('ideas.new.title')}</h1>
      <form onSubmit={handleSubmit} className="grid max-w-xl gap-4">
        {edit && edit.images.length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="font-medium">{t('ideas.existingImages')}</legend>
            {edit.images.map((_, n) => (
              <label key={n} className="flex items-center gap-3">
                <input type="checkbox" checked={keep.includes(n)} onChange={() => toggleKeep(n)} />
                <img src={`/api/ideas/${edit.id}/images/${n}`} alt="" className="h-12 w-12 rounded object-cover" />
                <span>{t('ideas.keepImage', { n: n + 1 })}</span>
              </label>
            ))}
          </fieldset>
        )}
        <Field label={t('ideas.field.title')}>
          <input className={input} value={draft.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label={t('ideas.field.description')}>
          <textarea className={input} rows={4} value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label={t('ideas.field.descriptionOfInteraction')}>
          <textarea className={input} rows={3} value={draft.descriptionOfInteraction} onChange={(e) => set('descriptionOfInteraction', e.target.value)} />
        </Field>
        <Field label={t('ideas.field.images', { max: MAX_IDEA_IMAGES })}>
          <input
            key={inputKey}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className={input}
            onChange={handlePickImages}
          />
          {(imageError || countProblem) && <span className={errorText}>{imageError || countProblem}</span>}
        </Field>
        <Field label={t('ideas.field.targetGroup')}>
          <input className={input} value={draft.targetGroup} onChange={(e) => set('targetGroup', e.target.value)} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="font-medium">{t('ideas.space.legend')}</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('ideas.space.area')}>
              <input className={input} inputMode="decimal" value={draft.areaM2} onChange={(e) => set('areaM2', e.target.value)} />
            </Field>
            <Field label={t('ideas.space.volume')}>
              <input className={input} inputMode="decimal" value={draft.volumeM3} onChange={(e) => set('volumeM3', e.target.value)} />
            </Field>
          </div>
        </fieldset>
        <Field label={t('ideas.field.staffNeeded')}>
          <textarea className={input} rows={2} value={draft.staffNeeded} onChange={(e) => set('staffNeeded', e.target.value)} />
        </Field>
        <Field label={t('ideas.field.exhibitRelated')}>
          <textarea className={input} rows={2} value={draft.exhibitRelated} onChange={(e) => set('exhibitRelated', e.target.value)} />
        </Field>
        <Field label={t('ideas.equipment.label')}>
          <EquipmentInput value={draft.equipment} onChange={(next) => set('equipment', next)} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="font-medium">
            {t('ideas.categories.legend')}
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
        <Field label={t('ideas.goal')}>
          <textarea className={input} rows={3} value={draft.goal} onChange={(e) => set('goal', e.target.value)} />
        </Field>
        <Field label={t('ideas.sustainability')}>
          <textarea className={input} rows={3} value={draft.sustainability} onChange={(e) => set('sustainability', e.target.value)} />
        </Field>
        <Field label={t('ideas.accessibility')}>
          <textarea className={input} rows={3} value={draft.accessibility} onChange={(e) => set('accessibility', e.target.value)} />
        </Field>
        <Field label={t('ideas.budget')}>
          <select className={input} value={draft.budget} onChange={(e) => set('budget', e.target.value)}>
            <option value="">—</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <MarkdownEditor
          label={t('ideas.field.mediationConcept')}
          value={draft.mediationConcept}
          onChange={(v) => set('mediationConcept', v)}
        />
        <p className={muted}>{t('ideas.markdown.help')}</p>
        {error && <p className={errorText}>{error}</p>}
        <div>
          <button type="submit" className={button} disabled={busy || !!imageError || !!countProblem}>
            {busy ? t('ideas.saving') : t('ideas.save')}
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
