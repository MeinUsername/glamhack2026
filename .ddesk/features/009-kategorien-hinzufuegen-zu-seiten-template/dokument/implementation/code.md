# Code – Umsetzung F-009

- [neu] `ideas.go`: Konstante `ideaCategories` mit den vier Schlüsseln in der Reihenfolge der Spec; `normalizeCategories` prüft (case-sensitiv), entfernt Duplikate und behält die Reihenfolge der ersten Vorkommen; `nil` und `[]` sind gültig.
  Warum: Die Regeln AC-009-1 bis 3 gehören zur Validierung, die schon die Seite prüft.
- [neu] `ideas.go`: `ideaView.Categories` wird bei fehlendem Wert zu `[]`.
  Warum: AC-009-6, Seiten vor F-009 haben kein Feld.
- [neu] `frontend/src/ideas/categories.ts`: Schlüssel, englische Labels, Tooltip-Texte aus der Spec-Tabelle, Tooltip-Kopf und Quelle.
  Warum: Eine Quelle für Formular, Tooltip und Chips.
- [neu] `frontend/src/ideas/CategoriesInfo.tsx`: Auslöser mit `aria-describedby` auf den Tooltip; öffnet bei Hover und bei sichtbarem Tastaturfokus, schließt bei Verlassen, Blur und Escape; wird auf `(hover: none)` nicht gerendert.
  Warum: Q-009-06 (Touch-Geräte ohne Tooltip) und Plan T5.
- [geändert] `IdeaForm.tsx`: Fieldset mit vier Checkboxen und Tooltip in der Legend; Auswahl wird im Feld `categories` mitgesendet.
  Warum: Plan T4; Checkboxen, weil Mehrfachauswahl ohne Modifikatortasten bedienbar sein soll.
- [geändert] `IdeaPage.tsx`: Chips unter dem Titel, nur bei mindestens einer Kategorie, nicht anklickbar.
  Warum: Plan T6, AC-009-5 und AC-009-6.
