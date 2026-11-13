import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import EquipmentInput from './EquipmentInput'
import { routeFetch } from '../test/helpers'

// Wraps the control with state, as the form does.
function Harness({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial)
  return <EquipmentInput value={value} onChange={setValue} />
}

function chips(): string[] {
  const list = screen.getByRole('list', { name: 'Needed equipment' })
  return Array.from(list.querySelectorAll('li')).map((li) => li.firstChild?.textContent ?? '')
}

describe('EquipmentInput', () => {
  it('AC-002-6 schlägt bekannte Geräte vor und übernimmt ein Gerät, das noch nicht existiert', async () => {
    routeFetch({ 'GET /api/equipment?q=bea': () => ({ json: ['Beamer'] }) })
    render(<Harness />)
    const u = userEvent.setup()
    const input = screen.getByLabelText('Add equipment')

    await u.type(input, 'bea')
    await u.click(await screen.findByRole('button', { name: 'Beamer' }))
    expect(chips()).toEqual(['Beamer'])

    await u.type(input, 'Lichtpult{Enter}')
    expect(chips()).toEqual(['Beamer', 'Lichtpult'])
  })

  it('AC-002-6 übernimmt kein Duplikat, unabhängig von Groß- und Kleinschreibung', async () => {
    routeFetch({ 'GET /api/equipment?q=beamer': () => ({ json: [] }) })
    render(<Harness initial={['Beamer']} />)
    const u = userEvent.setup()

    await u.type(screen.getByLabelText('Add equipment'), 'beamer{Enter}')
    expect(chips()).toEqual(['Beamer'])
  })

  it('entfernt einen Chip', async () => {
    routeFetch({})
    render(<Harness initial={['Beamer', 'Mikrofon']} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove Beamer' }))
    expect(chips()).toEqual(['Mikrofon'])
  })
})
