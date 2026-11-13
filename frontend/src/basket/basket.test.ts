import { beforeEach, describe, expect, it } from 'vitest'
import { addToBasket, BASKET_KEY, isInBasket, readBasket, removeFromBasket } from './basket'

describe('basket storage', () => {
  beforeEach(() => localStorage.clear())

  // AK2: an idea is in the basket only once.
  it('AK2 legt eine Idee nur einmal ab', () => {
    addToBasket('a')
    addToBasket('a')
    expect(readBasket()).toEqual(['a'])
  })

  // AK3: removing keeps the order of the others.
  it('AK3 entfernt eine Idee und behält die Reihenfolge der übrigen', () => {
    addToBasket('a')
    addToBasket('b')
    addToBasket('c')
    removeFromBasket('b')
    expect(readBasket()).toEqual(['a', 'c'])
    expect(isInBasket('b')).toBe(false)
  })

  // AK4: the basket is kept in localStorage, so it survives a reload.
  it('AK4 speichert den Korb im localStorage', () => {
    addToBasket('a')
    expect(JSON.parse(localStorage.getItem(BASKET_KEY) ?? 'null')).toEqual(['a'])
    expect(readBasket()).toEqual(['a'])
  })

  it('liest kaputtes JSON als leeren Korb', () => {
    localStorage.setItem(BASKET_KEY, '{nicht json')
    expect(readBasket()).toEqual([])
  })

  it('liest ein Nicht-Array als leeren Korb und filtert Nicht-Strings', () => {
    localStorage.setItem(BASKET_KEY, '{"a":1}')
    expect(readBasket()).toEqual([])
    localStorage.setItem(BASKET_KEY, JSON.stringify(['a', 3, null, 'a', 'b']))
    expect(readBasket()).toEqual(['a', 'b'])
  })
})
