import type { IdeaLink, LinkType } from '../types'

export interface LinkGroup {
  typeName: string
  links: IdeaLink[]
}

// F-031: groups by type, groups sorted alphabetically (ignoring case), links in input order within a group.
// A link whose type is unknown goes to a last group without a name.
export function groupLinks(links: IdeaLink[], types: LinkType[]): LinkGroup[] {
  const names = new Map(types.map((t) => [t.id, t.name]))
  const groups = new Map<string, IdeaLink[]>()
  for (const l of links) {
    const name = names.get(l.typeId) ?? ''
    groups.set(name, [...(groups.get(name) ?? []), l])
  }
  return [...groups.entries()]
    .map(([typeName, ls]) => ({ typeName, links: ls }))
    .sort((a, b) => {
      if (a.typeName === '' || b.typeName === '') return a.typeName === b.typeName ? 0 : a.typeName === '' ? 1 : -1
      return a.typeName.toLowerCase().localeCompare(b.typeName.toLowerCase())
    })
}
