# F-025 Mutiplile Entry Doors – Implementierungsplan

Grundlage: `spec.md` (D1–D9) und `acceptance.md` (AC-025-1 bis AC-025-10). Es gibt kein `docs/feature-workflow.md` und kein `ARCHITECTURE.md` im Projekt; der Plan stützt sich auf den Code.

## Bestand (Stand Code)

- Prompt-Verwaltung (F-018): `promptlevels.go` (Collection `prompt_levels`, `promptLevelDoc` mit Titeln/Beschreibungen in vier Sprachen, Positionen, Versionen in `versions`), Validierung in `masterprompt.go` (`allowedVariables`, `checkMasterPromptText`, `unknownVariablesError`, `maxMasterPromptRunes`). Routen in `server.go` (`/api/prompt-levels` nur angemeldet, `/api/admin/prompt-levels…` nur Admin). Admin-UI: `pages/AdminMasterPrompt.tsx`, `prompt/LevelDialog.tsx`.
- Rendering der Variablen heute nur im Browser (`prompt/render.ts`: `formatIdea`, `renderPrompt`, `formatLanguage`); der Server kennt nur die Variablennamen. Download/Kopieren: `prompt/PromptGenerator.tsx` (Blob `text/markdown`, Dateiname `prompt-JJJJ-MM-TT.md`, `navigator.clipboard`).
- Ideen: `ideaDoc` in `ideas.go` (inkl. `MediationConcept`), `GET /api/ideas` und `GET /api/ideas/{id}` sind **ohne Login** erreichbar.
- Frontend-Routen: `App.tsx` (`/basket` öffentlich), serverseitig `serveApp` in `server.go`. Texte in `frontend/src/i18n/locales/{de,en,fr,it}.ts`.

## Festlegungen (offene Punkte der Spec)

- **Datenschutz:** Der Ideenbestand ist über `GET /api/ideas/{id}` und die Listen-API bereits ohne Login lesbar (F-012, vgl. `security.md`). Der öffentliche Endpunkt macht also keine neuen Daten zugänglich; nur Ideen-Felder, die schon die Detail-API liefert (keine E-Mails, keine `created_by`). Keine Rückfrage nötig.
- **Datenmodell (D8):** Neue Collection `feedback_prompts` (getrennt von `prompt_levels`, keine Versionen). Dokument: `title`, `description` (je ein String, einsprachig), `text`, `position`, `created_at`, `updated_at`. «Kategorie» in der Verwaltung ist die Wahl zwischen den zwei Listen/Typen; bestehende `prompt_levels` bleiben unverändert und gelten damit als Master-Prompt (AC-025-5, keine Migration, kein Feld nötig).
- **Verwaltung:** Die Seite `/admin/master-prompt` bekommt oben einen Umschalter «Master-Prompts | Feedback-Prompts» (Kategorie). Anlegen/Bearbeiten/Löschen/Sortieren von Feedback-Prompts über eigene Endpunkte `/api/admin/feedback-prompts…`. Ein Prompt wechselt die Kategorie nicht nachträglich (Kategorie wird beim Anlegen gewählt); das erfüllt AC-025-4 und vermeidet Versions-Konflikte.
- **Variablen:** `checkMasterPromptText` bleibt für Master-Prompts (`allowedVariables` = `ideas`, `language`; `allideas` ist unbekannt, also Fehler wie AC-008-5, AC-025-8). Neu `checkFeedbackPromptText` mit erlaubten `allideas` und `language`; `{{ideas}}` ergibt `unknownVariablesError` (AC-025-9). Gleiche Fehlermeldung/Antwortform wie bisher, damit das Admin-Frontend sie schon anzeigt.
- **`{{language}}`:** Query-Parameter `lang` (`de|en|fr|it`) beim Download-/Kopier-Aufruf; das Frontend sendet die UI-Sprache. Unbekannt oder fehlend: `en`. Format wie im Browser: `de (Deutsch)`, `fr (Französisch)` …
- **`{{allideas}}` serverseitig:** Neue Go-Funktion `formatIdea` (1:1-Port von `render.ts`: Titel `###`, Stichpunkte Beschreibung/Zielgruppe/Ziel/Nachhaltigkeit/Barrierefreiheit/Fläche/Ausstattung/Budget, `#### Mediation Concept`, deutsches Dezimalkomma, Ideen mit Leerzeile getrennt), sortiert wie die Liste (`created_at` absteigend). Format bleibt identisch zu `{{ideas}}` (AC-025-6). Ersetzung per Funktion statt `strings.Replace` mit Template-String-Gefahr; Text der Ideen wird nicht erneut nach Variablen durchsucht (einmalige Ersetzung in einem Durchgang).
- **Promptgrösse:** `maxFeedbackPromptRunes = 20000` nur für die Vorlage (wie `maxMasterPromptRunes`). Das gerenderte Ergebnis wird nicht begrenzt (Ideen-Bestand ist die Nutzlast); die Antwort wird gestreamt/als Ganzes geschrieben. Obergrenze als Schutz: höchstens 1000 Ideen pro Aufruf werden eingesetzt (`maxAllIdeas`), danach Abbruch mit Hinweis im Prompt-Ende (`…`). Bei Bedarf in der Umsetzung anpassen.
- **Download:** Dateiname `feedback-prompt-<slug-des-titels>-JJJJ-MM-TT.md`, Content-Type `text/markdown; charset=utf-8`, `Content-Disposition: attachment`. Kopieren: das Frontend ruft denselben Endpunkt (als Text) und schreibt in die Zwischenablage, wie beim Korb.
- **Leerzustand (AC-025-10):** Liste ist `[]`, Seite zeigt einen Text statt Fehler.
- **Glossar:** Begriff «Feedback-Prompt» / «Feedback prompt» mit `ddesk glossary` aufnehmen (T8).
- Neue Texte kommen in alle vier Sprachdateien.

## Aufgaben

### T1 – Backend: Feedback-Prompt-Speicher und Validierung
- Neue Datei `feedbackprompts.go`: `feedbackPromptDoc`, `feedbackPromptInput` (`title`, `description`, `text`), Collection-Konstante, CRUD (`list`, `create`, `save`, `delete`, `reorder` analog `promptlevels.go`: `planOrder`, Positionen).
- `checkFeedbackPromptInput`: Titel Pflicht (≤ `maxLevelTitleRunes`), Beschreibung ≤ `maxLevelDescRunes`, Text nicht leer, ≤ `maxFeedbackPromptRunes`, Variablen nur `allideas`/`language` (`{{ideas}}` und alles Unbekannte → `unknownVariablesError`).
- `masterprompt.go`: Master-Prüfung bleibt; Test belegt, dass `{{allideas}}` dort abgelehnt wird.
- Tests (`feedbackprompts_test.go`, `masterprompt_test.go`): erlaubte/verbotene Variablen, Leerwerte, Längen, Reihenfolge.
- Verweist auf: AC-025-4, AC-025-5, AC-025-8, AC-025-9.
- Abhängig von keiner anderen Aufgabe.

### T2 – Backend: Rendering `{{allideas}}` und `{{language}}`
- Neue Datei `feedbackrender.go`: `formatIdeaText(ideaDoc) string` (Port von `formatIdea`), `renderFeedbackPrompt(template string, ideas []ideaDoc, lang string) string`, `languageLabel(lang)`.
- Ideen laden (`created_at` absteigend, Fehlerbehandlung wie `apiListIdeas`), Alt-Feld `audience` als Zielgruppe berücksichtigen wie `toIdeaView`.
- Tests: Format identisch zu den Erwartungswerten aus `render.test.ts` (gleiche Fixtures, inkl. leere Felder, Dezimalkomma, Mediation Concept); Prompt ohne `{{allideas}}` enthält keine Ideen und nur `{{language}}` ist ersetzt (AC-025-7); Idee mit Text `{{language}}` wird nicht nachträglich ersetzt; leerer Bestand ergibt leeren Text für `{{allideas}}`.
- Verweist auf: AC-025-6, AC-025-7.
- Abhängig von T1 (Typen).

### T3 – Backend: API und Routen
- `server.go`:
  - öffentlich: `GET /api/feedback-prompts` (Liste: `id`, `title`, `description`; kein Text, kein Ideenbestand), `GET /api/feedback-prompts/{id}/render?lang=xx` (Text, `text/markdown`, `?download=1` setzt `Content-Disposition`), `GET /feedback-prompts` → `serveApp`.
  - Admin: `GET/POST /api/admin/feedback-prompts`, `PUT/DELETE /api/admin/feedback-prompts/{id}`, `PUT /api/admin/feedback-prompts/order` (über `requireAdmin`).
- Unbekannte ID: 404 mit `writeJSONError`; Fehler vom Speicher: 500 ohne Details.
- Tests (Stil von `public_test.go`/`spa_test.go`): ohne Login erreichbar (AC-025-1), Download-Header und Dateiname (AC-025-2), Rendering-Antwort (AC-025-3, -6, -7), Admin-Routen ohne Admin → 401/403, Leerliste `[]` (AC-025-10).
- Verweist auf: AC-025-1, AC-025-2, AC-025-3, AC-025-10.
- Abhängig von T1, T2.

### T4 – Frontend: Typen, API-Client, i18n
- `types.ts`: `FeedbackPromptSummary`, `FeedbackPromptInput`; `api.ts`: Funktionen für Liste, Render (Text) und Admin-CRUD.
- Neue Schlüssel (`feedback.*`, Admin-Kategorie, Leerzustand, Fehlermeldungen, Variablenhinweis) in `de/en/fr/it`.
- `prompt/render.ts`: `KNOWN_VARIABLES` unverändert (Master); keine Browser-Ersetzung von `allideas`.
- Verweist auf: AC-025-1, AC-025-4.
- Abhängig von T3 (API-Form).

### T5 – Frontend: öffentliche Seite «Feedback-Prompts»
- Neue Seite `pages/FeedbackPrompts.tsx`, Route `/feedback-prompts` in `App.tsx`, Link im Layout (`components/Layout.tsx`) für alle Besucher.
- Liste mit Titel, Beschreibung, Buttons «Herunterladen» und «Kopieren». Download über Fetch mit `lang` = UI-Sprache und Blob-Download wie in `PromptGenerator.tsx` (gemeinsamen Hilfscode für Blob/Zwischenablage dort herauslösen, falls es ohne Umbau möglich ist; Korb-Checkout bleibt funktional unverändert). Statusmeldungen «Kopiert»/Fehler wie im Korb.
- Leerzustand und Ladezustand (AC-025-10).
- Tests (`FeedbackPrompts.test.tsx`): Liste ohne Login, Download ruft Endpunkt mit `lang`, Kopieren schreibt in die Zwischenablage, Leerzustand.
- Verweist auf: AC-025-1, AC-025-2, AC-025-3, AC-025-10.
- Abhängig von T4.

### T6 – Frontend: Admin-Verwaltung mit Kategorie
- `pages/AdminMasterPrompt.tsx`: Umschalter «Master-Prompt / Feedback-Prompt»; Feedback-Ansicht mit Liste, Neu/Bearbeiten/Löschen/Sortieren, Dialog mit Titel, Beschreibung, Text (neuer Dialog `prompt/FeedbackPromptDialog.tsx`, ohne Versionen und ohne Mehrsprachigkeit). Variablenliste (F-021) zeigt je Kategorie die erlaubten Variablen (`allideas`, `language` bzw. `ideas`, `language`). Serverfehler zu Variablen werden angezeigt.
- Master-Ansicht bleibt unverändert (AC-025-5).
- Tests (`AdminMasterPrompt.test.tsx` erweitern): Kategorie wählbar, Anlegen eines Feedback-Prompts, Fehler bei `{{ideas}}`, Master-Liste unverändert.
- Verweist auf: AC-025-4, AC-025-5, AC-025-8, AC-025-9.
- Abhängig von T4.

### T7 – Gesamtprüfung
- `go vet ./...`, `go test ./...`, im Frontend `npm run build` und `vitest`.
- Manuell: Prompt mit `{{allideas}}` und `{{language}}` anlegen, abgemeldet Seite öffnen, Download und Kopieren prüfen, Ergebnis mit `{{ideas}}`-Ausgabe aus dem Korb vergleichen; Master-Prompt mit `{{allideas}}` speichern → Fehler.
- Verweist auf: AC-025-1 bis AC-025-10.
- Abhängig von T1–T6.

### T8 – Glossar
- `ddesk glossary`: «Feedback-Prompt» / «Feedback prompt» (Prompt der Kategorie Feedback, öffentlich abrufbar, mit `{{allideas}}`).
- Verweist auf: keine AC (Dokumentation).
- Abhängig von T7.
