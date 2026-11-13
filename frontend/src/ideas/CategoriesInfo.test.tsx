import { afterEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import CategoriesInfo from './CategoriesInfo'
import { CATEGORIES } from './categories'

const EXPLANATION: Record<string, string> = {
  affirmative: 'Mediation communicates the museum’s tasks to the outside.',
  reproductive: 'Mediation trains the audience of tomorrow',
  deconstructive: 'Mediation questions the museum, art and canonisation',
  transformation: 'Mediation extends the institution’s functions',
}

const SOURCE = 'Source: Carmen Mörsch, 2009, documenta 12 mediation' // English, the test runs in English

function stubHover(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, media: '', addEventListener() {}, removeEventListener() {} })),
  )
}

describe('CategoriesInfo', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('AC-009-4 zeigt bei Hover Kopf, die vier Erklärungen und die Quelle', async () => {
    stubHover(false)
    render(<CategoriesInfo />)
    await userEvent.setup().hover(screen.getByRole('button', { name: 'About the categories' }))

    const tip = await screen.findByRole('tooltip')
    expect(tip).toHaveTextContent('At the intersection of four discourses')
    for (const c of CATEGORIES) {
      expect(tip).toHaveTextContent(c.label)
      expect(tip).toHaveTextContent(EXPLANATION[c.key])
    }
    expect(tip).toHaveTextContent(SOURCE)
  })

  it('verknüpft den Auslöser mit dem Tooltip', () => {
    stubHover(false)
    render(<CategoriesInfo />)
    const trigger = screen.getByRole('button', { name: 'About the categories' })
    expect(trigger).toHaveAttribute('aria-describedby', screen.getByRole('tooltip', { hidden: true }).id)
  })

  it('schließt mit Escape', async () => {
    stubHover(false)
    render(<CategoriesInfo />)
    const u = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'About the categories' })
    await u.hover(trigger)
    expect(await screen.findByRole('tooltip')).toBeVisible()
    await u.tab() // focus the trigger, so that Escape reaches it
    expect(trigger).toHaveFocus()
    await u.keyboard('{Escape}')
    expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible()
  })

  it('rendert auf Touch-Geräten (hover: none) keinen Auslöser', () => {
    stubHover(true)
    const { container } = render(<CategoriesInfo />)
    expect(container).toBeEmptyDOMElement()
  })
})
