import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App'

export type Handler = (req: { body: BodyInit | null | undefined }) => { status?: number; json?: unknown }

export interface Call {
  method: string
  url: string
  body: BodyInit | null | undefined
}

// Answers fetch from a table keyed by "METHOD /path". Unknown requests get a 404 and are recorded.
export function routeFetch(routes: Record<string, Handler>) {
  const calls: Call[] = []
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = init?.body
    calls.push({ method, url, body })
    const handler = routes[`${method} ${url}`]
    if (!handler) {
      return new Response(JSON.stringify({ error: `nicht gemockt: ${method} ${url}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const res = handler({ body })
    if (res.status === 204) return new Response(null, { status: 204 })
    return new Response(JSON.stringify(res.json ?? null), {
      status: res.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fn)
  return { calls, fn }
}

// Renders the whole app (routes and layout) at the given path.
export function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

export const unauthorized = { status: 401, json: { error: 'nicht angemeldet' } }
