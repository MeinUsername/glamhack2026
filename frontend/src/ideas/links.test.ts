import { describe, expect, it } from 'vitest'
import { groupLinks } from './links'

const types = [
  { id: 't', name: 'tools' },
  { id: 'r', name: 'Reference' },
  { id: 'i', name: 'Institutes' },
]

describe('groupLinks (F-031)', () => {
  it('AC-031-6 sortiert Gruppen alphabetisch ohne Gross-/Kleinschreibung, Links bleiben in Eingabereihenfolge', () => {
    const g = groupLinks(
      [
        { url: 'https://1', title: '', typeId: 't' },
        { url: 'https://2', title: '', typeId: 'r' },
        { url: 'https://3', title: '', typeId: 't' },
        { url: 'https://4', title: '', typeId: 'i' },
      ],
      types,
    )
    expect(g.map((x) => x.typeName)).toEqual(['Institutes', 'Reference', 'tools'])
    expect(g[2].links.map((l) => l.url)).toEqual(['https://1', 'https://3'])
  })
  it('lässt Typen ohne Links weg', () => {
    expect(groupLinks([], types)).toEqual([])
  })
})
