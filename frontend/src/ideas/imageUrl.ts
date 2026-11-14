// F-029: the image URL carries the version, so a replaced image at the same index is not taken from the browser cache.
export function imageUrl(ideaId: string, n: number, version?: string): string {
  const base = `/api/ideas/${encodeURIComponent(ideaId)}/images/${n}`
  return version ? `${base}?v=${encodeURIComponent(version)}` : base
}
