import type { MessageKey } from '../i18n/messages'
import type { Category } from '../types'

// The categories of critical art mediation (F-009). Keys go to the server. The labels stay English,
// as in the template (F-009); the explanations are translated (F-007).
export const CATEGORIES: { key: Category; label: string; explanation: MessageKey }[] = [
  { key: 'affirmative', label: 'Affirmative', explanation: 'categories.affirmative' },
  { key: 'reproductive', label: 'Reproductive', explanation: 'categories.reproductive' },
  { key: 'deconstructive', label: 'Deconstructive', explanation: 'categories.deconstructive' },
  { key: 'transformation', label: 'Transformation', explanation: 'categories.transformation' },
]

export const CATEGORY_LABEL: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
) as Record<Category, string>
