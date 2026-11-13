import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Me } from '../types'

export type MeState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'ready'; me: Me }

// Loads the signed-in user from GET /api/me. The role is read fresh on each load.
export function useMe(): MeState {
  const [state, setState] = useState<MeState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    api<Me>('/api/me')
      .then((me) => active && setState({ status: 'ready', me }))
      .catch(() => active && setState({ status: 'anonymous' }))
    return () => {
      active = false
    }
  }, [])

  return state
}
