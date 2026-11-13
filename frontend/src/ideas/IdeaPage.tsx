import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { api, ApiError } from '../api'
import type { Idea } from '../types'
import { errorText, h1, h2, muted } from '../ui'

type State =
  | { status: 'loading' }
  | { status: 'ready'; idea: Idea }
  | { status: 'missing' }
  | { status: 'signedOut' }
  | { status: 'failed' }

// The idea page at /ideas/:id. Images are fetched through the server; the bucket stays private.
export default function IdeaPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    api<Idea>(`/api/ideas/${encodeURIComponent(id)}`)
      .then((idea) => active && setState({ status: 'ready', idea }))
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) setState({ status: 'signedOut' })
        else if (err instanceof ApiError && err.status === 404) setState({ status: 'missing' })
        else setState({ status: 'failed' })
      })
    return () => {
      active = false
    }
  }, [id])

  if (state.status === 'loading') return <p className={muted}>Loading…</p>
  if (state.status === 'signedOut') return <Navigate to="/login" replace />
  if (state.status === 'missing') return <p className={errorText}>This idea does not exist.</p>
  if (state.status === 'failed') return <p className={errorText}>The idea could not be loaded.</p>
  return <Show idea={state.idea} />
}

function Show({ idea }: { idea: Idea }) {
  const { space } = idea
  return (
    <article className="grid max-w-2xl gap-4">
      <h1 className={h1}>{idea.title || 'Untitled idea'}</h1>
      {idea.images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {idea.images.map((_, n) => (
            <li key={n}>
              <img
                src={`/api/ideas/${idea.id}/images/${n}`}
                alt={`${idea.title || 'Idea'} image ${n + 1}`}
                className="w-full rounded-lg object-cover"
              />
            </li>
          ))}
        </ul>
      )}
      <Section title="Description" text={idea.description} />
      <Section title="Target audience" text={idea.audience} />
      <Section title="Goal" text={idea.goal} />
      <Section title="Sustainability" text={idea.sustainability} />
      <Section title="Accessibility" text={idea.accessibility} />
      <section>
        <h2 className={h2}>Needed space</h2>
        <p>
          {space.areaM2 == null ? '—' : `${space.areaM2} m²`} · {space.volumeM3 == null ? '—' : `${space.volumeM3} m³`}
        </p>
      </section>
      <section>
        <h2 className={h2}>Needed equipment</h2>
        {idea.equipment.length === 0 ? (
          <p className={muted}>None</p>
        ) : (
          <ul className="list-disc pl-5">
            {idea.equipment.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className={h2}>Budget</h2>
        <p>{idea.budget ?? 'Not set'}</p>
      </section>
    </article>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className={h2}>{title}</h2>
      {text ? <p className="whitespace-pre-line">{text}</p> : <p className={muted}>—</p>}
    </section>
  )
}
