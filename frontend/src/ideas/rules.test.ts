import { describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { imageProblem } from './rules'

const png = (n: number) => Array.from({ length: n }, (_, i) => new File(['x'], `b${i}.png`, { type: 'image/png' }))

describe('imageProblem with existing images (F-020)', () => {
  const t = i18n.t.bind(i18n)
  it('zählt behaltene Bilder mit', () => {
    expect(imageProblem(png(1), t, 4)).toBe('')
    expect(imageProblem(png(2), t, 4)).toMatch(/4 stay, you can add 1 more/)
    expect(imageProblem(png(1), t, 5)).toMatch(/you can add 0 more/)
  })
  it('ohne Bestand gilt die alte Grenze', () => {
    expect(imageProblem(png(5), t)).toBe('')
    expect(imageProblem(png(6), t)).toBe('At most 5 images can be uploaded.')
  })
})
