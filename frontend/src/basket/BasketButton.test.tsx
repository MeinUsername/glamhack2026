import { beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import BasketButton from './BasketButton'
import { readBasket } from './basket'

describe('BasketButton', () => {
  beforeEach(() => localStorage.clear())

  // AK1: choosing «Add to basket» puts the idea in the basket and marks it as bought.
  it('AK1 legt die Idee in den Korb und markiert sie als gekauft', async () => {
    render(<BasketButton ideaId="i1" />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add to basket' }))

    expect(readBasket()).toEqual(['i1'])
    expect(screen.getByText('Bought')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to basket' })).toBeNull()
  })

  // AK2: an idea that is already in the basket cannot be chosen again.
  it('AK2 zeigt für eine Idee im Korb keine erneute Auswahl', () => {
    localStorage.setItem('hackathon-basket', JSON.stringify(['i1']))
    render(<BasketButton ideaId="i1" />)

    expect(screen.queryByRole('button', { name: 'Add to basket' })).toBeNull()
    expect(screen.getByText('Bought')).toBeInTheDocument()
    expect(readBasket()).toEqual(['i1'])
  })
})
