import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownView from './MarkdownView'

describe('MarkdownView', () => {
  it('AC-023-4 rendert Überschrift, Liste, Tabelle und Code', () => {
    const md = '# Titel\n\n- eins\n- zwei\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```\nfoo()\n```\n\n`inline`'
    const { container } = render(<MarkdownView text={md} />)
    expect(screen.getByRole('heading', { name: 'Titel' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(container.querySelector('pre code')).toHaveTextContent('foo()')
    expect(container.querySelector('p code')).toHaveTextContent('inline')
  })

  it('AC-023-5 rendert rohes HTML nicht und führt kein Skript aus', () => {
    const { container } = render(<MarkdownView text={'<script>alert(1)</script>\n\n<b>fett</b> <img src=x onerror=alert(1)>'} />)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('<b>fett</b>')
  })

  it('AC-023-5 öffnet Links in neuem Tab und entfernt javascript:-Links', () => {
    render(<MarkdownView text={'[gut](https://example.ch) [böse](javascript:alert(1))'} />)
    const good = screen.getByRole('link', { name: 'gut' })
    expect(good).toHaveAttribute('target', '_blank')
    expect(good).toHaveAttribute('rel', 'noopener noreferrer')
    const bad = screen.getByText('böse')
    expect(bad.getAttribute('href') ?? '').not.toMatch(/javascript:/i)
  })
})
