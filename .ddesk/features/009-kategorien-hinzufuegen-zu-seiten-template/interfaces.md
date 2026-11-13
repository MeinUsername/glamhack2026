# Schnittstellen F-009

- Feld `categories` (Array von Schlüsseln) im JSON-Teil `data` von `POST /api/ideas`; fehlt es oder ist `null`, gilt es als leer
- Feld `categories` in der Antwort von `GET /api/ideas/{id}` (immer Array, `[]` für Seiten ohne Feld)
- Schlüssel `affirmative`, `reproductive`, `deconstructive`, `transformation` (Groß-/Kleinschreibung zählt)
- Go: `ideaCategories` (Reihenfolge der Spec), `normalizeCategories([]string) ([]string, error)`; Feld `Categories` in `ideaInput`, `ideaDoc`, `ideaView`
- Firestore: Feld `categories` (Array von Strings) im Dokument `ideas`
- React: `CATEGORIES`, `CATEGORY_LABEL` in `frontend/src/ideas/categories.ts`; Komponente `CategoriesInfo` (Tooltip am Feldtitel); Typ `Category` in `types.ts`
