# Schnittstellen F-007

- `frontend/src/i18n/index.ts`: Default-Export `i18n` (i18next-Instanz), `LANGUAGES` (`de`, `en`, `fr`, `it`), `LANGUAGE_NAMES`, `STORAGE_KEY` (`lang`), `chooseLanguage(lng)` (speichert eine explizite Wahl und wechselt sofort)
- `frontend/src/i18n/messages.ts`: Typ `MessageKey` (alle Schlüssel, Quelle ist `en`)
- `frontend/src/i18n/locales/{en,de,fr,it}.ts`: Wörterbücher, je `Record<MessageKey, string>`; fehlende oder überzählige Schlüssel sind ein Typfehler
- `frontend/src/components/LanguageSwitch.tsx`: Auswahl im Header
- `ideas/rules.ts`: `imageProblem(files, t)` bekommt die Übersetzungsfunktion als zweiten Parameter (geändert gegenüber F-002)
- `ideas/categories.ts`: `CATEGORIES[].explanation` ist jetzt ein Schlüssel statt eines Textes (geändert gegenüber F-009)
- Keine Änderung an der Go-API
