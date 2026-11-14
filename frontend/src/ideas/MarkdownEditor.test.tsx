import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import MarkdownEditor from './MarkdownEditor'

function Harness({ initial = '' }: { initial?: string }) {
  const [v, setV] = useState(initial)
  return (
    <>
      <MarkdownEditor label="Concept" value={v} onChange={setV} />
      <output data-testid="value">{v}</output>
    </>
  )
}

describe('MarkdownEditor', () => {
  it('AC-023-2 schaltet zur Vorschau und zurück, ohne den Text zu ändern', async () => {
    const u = userEvent.setup()
    render(<Harness initial={'# Titel\n\n- a'} />)
    expect(screen.getByRole('tab', { name: 'Write' })).toHaveAttribute('aria-selected', 'true')

    await u.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(screen.getByRole('heading', { name: 'Titel' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true')

    await u.click(screen.getByRole('tab', { name: 'Write' }))
    expect(screen.queryByRole('heading', { name: 'Titel' })).toBeNull()
    expect(screen.getByTestId('value').textContent).toBe('# Titel\n\n- a')
    expect(document.querySelector('.cm-content')).toHaveTextContent('# Titel')
  })

  it('zeigt bei leerem Text einen Hinweis in der Vorschau', async () => {
    render(<Harness />)
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Preview' }))
    expect(screen.getByText('Nothing to preview.')).toBeInTheDocument()
  })

  it('AC-023-1 meldet getippten Text über onChange', async () => {
    const u = userEvent.setup()
    render(<Harness />)
    const editor = document.querySelector('.cm-content') as HTMLElement
    await u.click(editor)
    await u.keyboard('hallo')
    expect(screen.getByTestId('value').textContent).toBe('hallo')
  })
})
