import data from '../data/icom-filter-kategorien.json'

// ICOM filter categories and the location filter (F-024). The JSON file is the source of the
// labels; the server embeds this file (ideas_icom.go).

export interface Localized {
  de: string
  en: string
}

export interface IcomCategory {
  id: string
  label: Localized
  description: Localized
  icomRefs: string[]
}

export interface IcomGroup {
  id: string
  label: Localized
  categories: IcomCategory[]
}

export interface FilterOption {
  id: string
  label: Localized
}

export const ICOM_SOURCE: string = data.source
export const ICOM_GROUPS: IcomGroup[] = data.filterGroups

const locationFilter = data.secondaryFilters.find((f) => f.id === 'location')
export const LOCATION_LABEL: Localized = locationFilter?.label ?? { de: 'Ort', en: 'Location' }
export const LOCATIONS: FilterOption[] = locationFilter?.options ?? []

const categoryById = new Map(ICOM_GROUPS.flatMap((g) => g.categories.map((c) => [c.id, c] as const)))
const locationById = new Map(LOCATIONS.map((o) => [o.id, o] as const))

export const ICOM_CATEGORY_IDS: string[] = [...categoryById.keys()]
export const LOCATION_IDS: string[] = [...locationById.keys()]

export const icomCategory = (id: string) => categoryById.get(id)
export const location = (id: string) => locationById.get(id)

// The JSON has German and English only; French and Italian show the English label.
export function pick(label: Localized, language: string | undefined): string {
  return language?.startsWith('de') ? label.de : label.en
}

export interface Filterable {
  icomCategories?: string[]
  locations?: string[]
}

// AND within the categories (an idea needs all chosen ones, F-035), OR within the locations, AND between
// the two. An empty selection does not filter.
export function matchesFilter(item: Filterable, categories: string[], locations: string[]): boolean {
  const cats = item.icomCategories ?? []
  const locs = item.locations ?? []
  const catOk = categories.length === 0 || categories.every((c) => cats.includes(c))
  const locOk = locations.length === 0 || locations.some((l) => locs.includes(l))
  return catOk && locOk
}

// Reads a comma-separated URL parameter; unknown IDs and duplicates are dropped.
export function parseIdList(raw: string | null, valid: string[]): string[] {
  if (!raw) return []
  const wanted = new Set(raw.split(',').map((s) => s.trim()))
  return valid.filter((id) => wanted.has(id))
}
