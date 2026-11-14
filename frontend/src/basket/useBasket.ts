import { useCallback, useEffect, useState } from 'react'
import { addToBasket, BASKET_EVENT, readBasket, removeFromBasket } from './basket'

// The basket as React state. It reads the storage on mount, so every page shows the same state.
// It also follows changes made elsewhere (header count, other tabs).
export function useBasket() {
  const [ids, setIds] = useState<string[]>(readBasket)

  useEffect(() => {
    const onChange = (e: Event) => setIds((e as CustomEvent<string[]>).detail ?? readBasket())
    const onStorage = () => setIds(readBasket())
    window.addEventListener(BASKET_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(BASKET_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const add = useCallback((id: string) => setIds(addToBasket(id)), [])
  const remove = useCallback((id: string) => setIds(removeFromBasket(id)), [])
  const has = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, has, add, remove }
}
