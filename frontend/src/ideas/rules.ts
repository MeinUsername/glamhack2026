// Client-side checks for idea images. They give early feedback; the Go server repeats them (ideas_images.go).

export const MAX_IDEA_IMAGES = 5
export const MAX_IDEA_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const BUDGETS = ['S', 'M', 'L', 'XL'] as const

// Returns the message for the first problem with the picked files, or '' if all are fine.
// The browser's type is only a hint here; the server looks at the bytes.
export function imageProblem(files: File[]): string {
  if (files.length > MAX_IDEA_IMAGES) return `At most ${MAX_IDEA_IMAGES} images can be uploaded.`
  if (files.some((f) => f.size > MAX_IDEA_IMAGE_BYTES)) return 'Each image must be at most 5 MB.'
  if (files.some((f) => !IMAGE_TYPES.includes(f.type))) return 'Images must be JPG, PNG or WebP.'
  return ''
}
