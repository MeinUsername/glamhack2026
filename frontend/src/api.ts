// Small JSON client for the Go API. Errors carry the server's message (field "error").

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiInit = RequestInit & { json?: unknown }

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, ...rest } = init
  const headers = new Headers(rest.headers)
  let body = rest.body
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }
  const res = await fetch(path, { credentials: 'same-origin', ...rest, headers, body })
  if (res.status === 204) return undefined as T

  const isJSON = res.headers.get('content-type')?.includes('application/json') ?? false
  const data: unknown = isJSON ? await res.json() : null
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Fehler ${res.status}`
    throw new ApiError(res.status, message)
  }
  return data as T
}
