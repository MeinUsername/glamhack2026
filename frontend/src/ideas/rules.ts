import type { TFunction } from 'i18next'

// Client-side checks for idea images. They give early feedback; the Go server repeats them (ideas_images.go).

export const MAX_IDEA_IMAGES = 5
export const MAX_IDEA_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const BUDGETS = ['S', 'M', 'L', 'XL'] as const

// Returns the message for the first problem with the picked files, or '' if all are fine.
// The browser's type is only a hint here; the server looks at the bytes. Messages come in the current language.
// `existing` is the number of images of the idea that stay (editing, F-020).
export function imageProblem(files: File[], t: TFunction, existing = 0): string {
  if (existing > 0 && existing + files.length > MAX_IDEA_IMAGES) {
    return t('rules.tooManyWithExisting', { max: MAX_IDEA_IMAGES, kept: existing, free: Math.max(0, MAX_IDEA_IMAGES - existing) })
  }
  if (files.length > MAX_IDEA_IMAGES) return t('rules.tooMany', { max: MAX_IDEA_IMAGES })
  if (files.some((f) => f.size > MAX_IDEA_IMAGE_BYTES)) return t('rules.tooBig')
  if (files.some((f) => !IMAGE_TYPES.includes(f.type))) return t('rules.type')
  return ''
}
