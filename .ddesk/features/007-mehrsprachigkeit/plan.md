# F-007 Mehrsprachigkeit – Implementierungsplan

Grundlage: `spec.md` (Sprachen, automatische Auswahl, Überschreiben im UI) und `acceptance.md` (AC-007-1 bis AC-007-5).
Bestand: React-Frontend in `frontend/` (F-005), Seiten und Komponenten laut `frontend/src/App.tsx`. Das Backend (Go) bleibt unverändert, es liefert nur die SPA aus.

Bestätigte Rückfragen (Antworten des Nutzers):
- **Q-007-07:** Status `plan-creation`, dieser Plan ist der nächste Schritt.
- **Q-007-08:** Die Akzeptanzkriterien schreibt der Agent, der Nutzer prüft sie.
- **Q-007-09:** «Mache die Seite Mehrsprachig» heisst: Sprachwahl im Header und Übersetzung aller bestehenden Seiten (Navigation, Texte, Fehlermeldungen).
- **Q-007-10:** Bibliothek `react-i18next` (mit `i18next` und dem Browser-Sprach-Detektor).
- **Q-007-11:** Die Wahl wird im `localStorage` gespeichert. Die Browsersprache gilt nur, solange keine Wahl gespeichert ist.
- **Q-007-12:** Der Agent schreibt die Entwürfe für Französisch und Italienisch, der Nutzer prüft sie.

## Festlegungen dieses Plans

- **Erkennung:** Reihenfolge `localStorage`, dann `navigator.languages`. Sprachcodes werden auf die Sprache reduziert (`de-CH` → `de`, `fr-CA` → `fr`). Nicht unterstützte Sprachen fallen auf Englisch zurück (AC-007-5). Englisch ist die Quellsprache, weil die bestehenden Labels englisch sind (Q-002-08 in F-002).
- **Accept-Language-Header wird nicht ausgewertet.** Die Oberfläche wird als SPA ausgeliefert, der Server rendert keine übersetzten Seiten. Die Browsersprache liefert `navigator.languages`, das ist dieselbe Information. Diese Abweichung von der Spec-Formulierung «über den Header» steht hier, damit sie beim Prüfen auffällt.
- **Sprachcodes:** `de`, `en`, `fr`, `it`. Anzeige der Namen in der jeweiligen Sprache (`Deutsch`, `English`, `Français`, `Italiano`).
- **Wörterbücher typisiert:** `en` ist die Quelle. Die anderen Wörterbücher müssen dieselben Schlüssel haben, fehlende Schlüssel sind ein Typfehler (`tsc`).
- **Keine Serverschnittstelle:** Die API ändert sich nicht, `api.md` dieses Features bleibt leer.
- **`<html lang>`** wird bei jedem Sprachwechsel gesetzt.

## Aufgaben

### T1 – Sprachkonfiguration
- Pakete `i18next`, `react-i18next`, `i18next-browser-languagedetector` in `frontend/package.json`.
- `frontend/src/i18n/index.ts`: Initialisierung mit `supportedLngs` (`de`, `en`, `fr`, `it`), `fallbackLng: 'en'`, `load: 'languageOnly'`, Detektor-Reihenfolge `localStorage` und `navigator`, Speicherung im `localStorage` unter dem Schlüssel `lang`, Setzen von `document.documentElement.lang`.
- `frontend/src/main.tsx` importiert die Initialisierung vor dem ersten Render.
- Verweist auf: AC-007-1 (Browsersprache), AC-007-3 (gespeicherte Wahl gewinnt), AC-007-5 (Fallback Englisch).

### T2 – Wörterbücher
- `frontend/src/i18n/locales/en.ts` (Quelle, alle Schlüssel), `de.ts`, `fr.ts`, `it.ts`; jede Datei mit `satisfies` gegen den Typ von `en`.
- Schlüssel für alle sichtbaren Texte aus: `components/Layout.tsx` (Titel, Navigation, Abmelden), `components/AuthForm.tsx`, `pages/Home.tsx`, `pages/Login.tsx`, `pages/Register.tsx`, `pages/Dashboard.tsx`, `pages/AdminUsers.tsx`, `ideas/IdeaForm.tsx`, `ideas/IdeaPage.tsx`, `ideas/EquipmentInput.tsx`, `ideas/rules.ts` (Meldungen zu Bildern).
- Entwürfe für `fr` und `it` (Q-007-12), Übersetzung von `de` ebenfalls als Entwurf.
- Verweist auf: AC-007-4 (vollständige Übersetzung in allen vier Sprachen).

### T3 – Sprachwahl im Header
- `frontend/src/components/LanguageSwitch.tsx`: Auswahlfeld mit den vier Sprachen, Beschriftung in der jeweiligen Sprache, Aufruf von `i18n.changeLanguage`. Die Auswahl steht im Header neben der Navigation.
- `frontend/src/components/Layout.tsx` bindet die Komponente ein.
- Verweist auf: AC-007-2 (sofortiger Wechsel, dieselbe Seite), AC-007-3 (Wahl wird gespeichert).
- nutzt F-001: Layout (`components/Layout.tsx`, Kopf und Navigation, geteilt von allen Seiten).

### T4 – Seiten auf Übersetzungsschlüssel umstellen
- In allen Seiten und Komponenten aus T2 werden feste Texte durch `useTranslation()`-Aufrufe ersetzt. Alle Texte stehen danach in den Wörterbüchern.
- `ideas/rules.ts`: `imageProblem(files)` bekommt die Übersetzungsfunktion `t` als zweiten Parameter. Das ändert die Signatur aus F-002. Die Änderung wird in der Umsetzung als Abweichung in `abweichungen.md` festgehalten.
- Verweist auf: AC-007-4 (keine englischen Reste).
- nutzt F-002: `imageProblem(files: File[]) => string` (`ideas/rules.ts`), `IdeaForm`, `IdeaPage`, `EquipmentInput` (Props `value`, `onChange`).
- nutzt F-001: `useMe` (`auth/useMe.ts`) für Anmeldestatus in der Navigation.

### T5 – Tests und Prüfung
- Test der Initialisierung: Browsersprache `fr-CH` → Französisch; `es` → Englisch; gespeicherte Wahl `de` gewinnt gegen Browsersprache `fr` (AC-007-1, AC-007-3, AC-007-5).
- Test der Sprachwahl: Umschalten auf Italienisch ändert sichtbare Texte und setzt `localStorage` (AC-007-2).
- Test der Vollständigkeit: Jeder Schlüssel aus `en` ist in `de`, `fr`, `it` vorhanden und nicht leer (AC-007-4), zusätzlich zum Typfehler.
- Bestehende Tests (`Layout`, `Login`, `Register`, `Dashboard`, `AdminUsers`, `IdeaForm`, `EquipmentInput`) laufen mit festem Sprachwert `en` in `src/test/setup.ts`, damit ihre englischen Suchtexte weiter passen.
- Prüfung: `npm run typecheck`, `npm test` und `npm run build` in `frontend/` grün.
- Verweist auf: AC-007-1 bis AC-007-5.
