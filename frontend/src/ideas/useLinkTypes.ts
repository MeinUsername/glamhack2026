import { useEffect, useState } from 'react'
import { api } from '../api'
import type { LinkType } from '../types'

// F-031: the link types, alphabetical from the server. null while loading; a failure counts as no types,
// so the form and the pages simply leave the links section out.
export function useLinkTypes(): LinkType[] | null {
  const [types, setTypes] = useState<LinkType[] | null>(null)
  useEffect(() => {
    let alive = true
    api<LinkType[]>('/api/link-types')
      .then((list) => alive && setTypes(Array.isArray(list) ? list : []))
      .catch(() => alive && setTypes([]))
    return () => {
      alive = false
    }
  }, [])
  return types
}
