import type { Category } from '../types'

// The categories of critical art mediation (F-009). Keys are sent to the server; the labels are English.
// The explanations are the short versions from the spec table, in German, not translated.
export const CATEGORIES: { key: Category; label: string; explanation: string }[] = [
  {
    key: 'affirmative',
    label: 'Affirmative',
    explanation:
      'Die Vermittlung kommuniziert die Aufgaben des Museums nach außen. Kunst gilt als Fachdomäne; Angebote wie Vorträge, Kataloge und Expertenführungen richten sich an das Fachpublikum.',
  },
  {
    key: 'reproductive',
    label: 'Reproductive',
    explanation:
      'Die Vermittlung bildet das Publikum von morgen heran und baut Schwellenängste ab. Angebote richten sich an Schulklassen, Familien und Menschen mit besonderen Bedürfnissen.',
  },
  {
    key: 'deconstructive',
    label: 'Deconstructive',
    explanation:
      'Die Vermittlung hinterfragt Museum, Kunst und Kanonisierung gemeinsam mit dem Publikum. Interventionen und kritische Führungen stehen im Vordergrund.',
  },
  {
    key: 'transformation',
    label: 'Transformation',
    explanation:
      'Die Vermittlung erweitert die Funktionen der Institution und verändert sie in Zusammenarbeit mit dem Publikum. Projekte mit Interessengruppen gehören dazu.',
  },
]

export const CATEGORY_INTRO =
  'Am Kreuzungspunkt von vier Diskursen: Die documenta 12 Vermittlung zwischen Affirmation, Reproduktion, Dekonstruktion und Transformation'

export const CATEGORY_SOURCE = 'Quelle: Carmen Mörsch, 2009, documenta-12-Vermittlung'

export const CATEGORY_LABEL: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
) as Record<Category, string>
