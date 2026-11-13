import { useCallback, useState } from 'react'
import { addToBasket, readBasket, removeFromBasket } from './basket'

// The basket as React state. It reads the storage on mount, so every page shows the same state.
export function useBasket() {
  const [ids, setIds] = useState<string[]>(readBasket)

  const add = useCallback((id: string) => setIds(addToBasket(id)), [])
  const remove = useCallback((id: string) => setIds(removeFromBasket(id)), [])
  const has = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, has, add, remove }
}
