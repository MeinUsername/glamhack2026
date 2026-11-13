// The basket lives in the browser's localStorage (F-006 D5). It stores idea IDs only, without login.
export const BASKET_KEY = 'hackathon-basket'

// Reads the basket. Broken JSON, a non-array or non-string entries give an empty or filtered basket.
export function readBasket(): string[] {
  try {
    const raw = localStorage.getItem(BASKET_KEY)
    if (!raw) return []
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    const ids = value.filter((v): v is string => typeof v === 'string')
    return [...new Set(ids)]
  } catch {
    return []
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(BASKET_KEY, JSON.stringify(ids))
  } catch {
    // storage blocked: the basket lasts for this page only
  }
}

// Adds an ID once; a second call changes nothing (AK2).
export function addToBasket(id: string): string[] {
  const ids = readBasket()
  if (ids.includes(id)) return ids
  const next = [...ids, id]
  write(next)
  return next
}

// Removes an ID and keeps the order of the others (AK3).
export function removeFromBasket(id: string): string[] {
  const next = readBasket().filter((x) => x !== id)
  write(next)
  return next
}

export function isInBasket(id: string): boolean {
  return readBasket().includes(id)
}
