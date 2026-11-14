// The text for the UI language; falls back to English, then to ''. (F-018, assumption of the spec)
export function pickLocalized(map: Record<string, string> | undefined, lang: string | undefined): string {
  if (!map) return ''
  const base = (lang ?? 'en').slice(0, 2)
  return map[base] || map.en || ''
}
