# F-003 Ein Prompt-Generator – Implementierungsplan

Grundlage: `spec.md` (Umfang, Entscheidungen D1–D5) und `acceptance.md` (AC-003-1 bis AC-003-6).
Bestand im Repo (Stand Plan): Go-Backend mit Firebase Auth, Rollen (`users.go`, `admin.go`), Ideen (`ideas.go`, `GET /api/ideas/{id}`, `ideaView`). React-Frontend unter `frontend/src` mit React Router (`App.tsx`), Vitest-Tests. **Nicht vorhanden:** Korb (F-006), Mehrsprachigkeit (F-007), Master-Prompt und Versionen (F-008).

## Rückfragen und ihre Antworten

- **Q-003-09 = 2:** Der Plan ist gegen definierte Schnittstellen geschrieben. Die Umsetzung wartet auf F-006, F-007 und F-008. Die Schnittstellen unten sind der Vertrag, gegen den diese drei Features bauen.
- **Q-003-10 = 1:** Der Master-Text kommt per API `GET /api/master-prompt` zum Browser. Das gilt für alle eingeloggten Rollen (Folge von D3 der Spec).
- **Q-003-13 = 2:** Der Generator liegt **auf der Korbseite** (F-006), nicht auf einer eigenen Seite. Das weicht vom Umfang der Spec ab (siehe «Abweichungen von der Spec»).
- **Q-003-11 (Entwurf, noch nicht abgesendet):** Ohne Master-Prompt-Version zeigt der Generator einen Hinweis. Download und Kopieren sind deaktiviert. Der Plan folgt der Empfehlung.
- **Q-003-12 (Entwurf, noch nicht abgesendet):** Die Annahmen aus der Spec (leerer Korb, Datei `.md`, Schaltfläche Kopieren) gelten. Der Plan folgt der Empfehlung. Sie sind noch nicht bestätigt.

## Schnittstellen aus Vorgänger-Features (Vertrag)

Diese Features existieren noch nicht. F-003 nutzt die folgenden Schnittstellen. Sie sind hier fest, damit F-006, F-007 und F-008 gegen sie bauen können.

- **nutzt F-006: Korb.** `useBasket(): string[]` liefert die Idee-IDs im Korb in Korbreihenfolge. Der Korb liegt im Localstorage (Key und Format legt F-006 fest). Gelöschte Ideen filtert F-006 selbst (D4 dort).
- **nutzt F-002/F-006: Idee-Daten.** Die Felder je Idee kommen aus `GET /api/ideas/{id}` (`ideaView` in `ideas.go`). Bestehend, keine Änderung nötig.
- **nutzt F-007: Sprache.** `useLocale(): { code: 'de' | 'en' | 'fr' | 'it', name: string }`. `name` ist auf Deutsch («Deutsch», «Englisch», «Französisch», «Italienisch»). Die Sprache aus der Oberfläche gilt, Browsersprache ist der Startwert (D4 der Spec).
- **nutzt F-008: Master-Prompt.** Go-Funktion `currentMasterPrompt(ctx) (promptVersion, bool, error)` liefert die aktuelle Version. `bool` ist `false`, wenn es keine Version gibt. Der Versionsspeicher gehört F-008.

Die Schnittstellen stehen noch nicht in `interfaces.md` der drei Features. Das holt der Nutzer oder die Umsetzung von F-006, F-007 und F-008 nach.

## Festlegungen dieses Plans

- **Rendern im Browser.** `renderPrompt(template, ideas, locale)` ist eine reine Funktion in `frontend/src/prompt/render.ts`. Sie ersetzt nur `{{ideas}}` und `{{language}}`. Unbekannte `{{…}}` bleiben stehen. F-008 lehnt sie beim Speichern ab.
- **Lesen des Master-Prompts** für alle eingeloggten Rollen (Q-003-10, D3). Der Lesezugriff nur für Admins bleibt in F-008 (D9) bis zu deren Änderung. Diese Änderung ist nicht Teil von F-003 (D3 der Spec).
- **Eigene Entscheidung: Format von `{{ideas}}`.** Jede Idee wird zu einem Block in Korbreihenfolge, getrennt durch eine Leerzeile:
  ```
  ### <Titel>
  - Beschreibung: …
  - Zielgruppe: …
  - Ziel: …
  - Nachhaltigkeit: …
  - Barrierefreiheit: …
  - Fläche: …
  - Ausstattung: <Liste, mit Komma getrennt>
  - Budget: …
  ```
  Leere Felder fehlen ganz. Bilder sind keine Textfelder und werden nicht eingefügt. Leerer Korb ergibt leeren Text (AC-008-7).
- **Eigene Entscheidung: Format von `{{language}}`.** `code (name)`, z. B. `de (Deutsch)`, `fr (Französisch)`. Englisch und Italienisch analog.
- **Eigene Entscheidung: Dateiname.** `prompt-JJJJ-MM-TT.md` (Datum des Downloads). Kein Zeitstempel.
- **Eigene Entscheidung: Schutz.** Die Korbseite ist im Frontend nur für eingeloggte Rollen gerendert. Besucher werden zur Anmeldung geleitet (wie im Dashboard). Das Backend lehnt `GET /api/master-prompt` für Besucher mit 401 ab (kein Redirect im API-Teil).
- **Eigene Entscheidung: Fehlerfälle.** Ohne Version: Hinweis, Download und Kopieren deaktiviert (Q-003-11, Entwurf). Ein Fehler beim Kopieren zeigt eine Meldung statt eines stillen Fehlers.

## Aufgaben

### T1 – Rendern der Variablen (pure Funktion)
- `frontend/src/prompt/render.ts`: `renderPrompt(template, ideas, locale)`. Ersetzt alle Vorkommen von `{{ideas}}` und `{{language}}`. Formatiert Ideen und Sprache nach den Festlegungen oben.
- Keine Abhängigkeit zu React, Storage oder Netz. Dadurch testbar ohne F-006/F-007.
- Verweist auf: AC-003-1 (Ersetzung), AC-003-4 (`fr (Französisch)`), AC-003-6 (leerer Korb).

### T2 – Lesen des Master-Prompts (Backend)
- `GET /api/master-prompt` in `server.go` registrieren. Liefert `{ version, text, createdAt }` mit 200, 404 wenn keine Version existiert, 401 ohne Login.
- Neue Guard-Funktion `guardUser`, analog zu `guardAdmin` in `admin.go`: prüft nur Login, nicht die Rolle.
- Handler nutzt `currentMasterPrompt` (nutzt F-008).
- Verweist auf: AC-003-1 (aktueller Master-Prompt), AC-003-5 (Besucher ohne Login).

### T3 – Generator auf der Korbseite (Frontend)
- Komponente `frontend/src/prompt/PromptGenerator.tsx`, eingebettet in die Korbseite aus F-006 (nutzt F-006). Es gibt keine eigene Route und keinen Eintrag in `App.tsx` für den Generator.
- Lädt Master-Prompt (T2), Korb (`useBasket`), Idee-Daten (`GET /api/ideas/{id}`) und Sprache (`useLocale`). Rendert mit T1 die Vorschau.
- Vorschau als Textbereich oder `<pre>`, nur lesbar.
- Verweist auf: AC-003-1 (Vorschau), AC-003-5 (Besucher sieht den Generator nicht).

### T4 – Leerer Korb und fehlender Master-Prompt
- Ist der Korb leer, sind «Herunterladen» und «In die Zwischenablage» deaktiviert. Ein Hinweis erklärt, dass der Korb leer ist (AC-003-6).
- Gibt es keine Master-Prompt-Version (T2 liefert 404), zeigt der Generator einen Hinweis statt der Vorschau. Beide Schaltflächen sind deaktiviert (Q-003-11, Entwurf).
- Verweist auf: AC-003-6.

### T5 – Sprache (Mehrsprachigkeit)
- `useLocale()` liefert die Sprache, `renderPrompt` ersetzt `{{language}}`. Keine eigene Sprachlogik in F-003.
- Test: Französisch gewählt, Vorschau enthält `fr (Französisch)`.
- Verweist auf: AC-003-4. Nutzt F-007.

### T6 – Download als Markdown
- Schaltfläche «Herunterladen»: erzeugt `Blob` mit dem Text der Vorschau (`text/markdown;charset=utf-8`), löst Download als `prompt-JJJJ-MM-TT.md` aus.
- Der Inhalt ist exakt die Vorschau, ohne zusätzliche Zeilen.
- Verweist auf: AC-003-2.

### T7 – In die Zwischenablage
- Schaltfläche «In die Zwischenablage»: `navigator.clipboard.writeText` mit dem Text der Vorschau. Bei Fehler Meldung im Generator.
- Verweist auf: AC-003-3.

### T8 – Tests und Abnahme
- Vitest für T1 (Ersetzung, Format, leerer Korb, unbekannte Variable bleibt). Testnamen tragen die AC-Nummer, z. B. `AC-003-4 …`.
- Vitest für T3 bis T7 mit gemockten Hooks (`useBasket`, `useLocale`, Fetch): Deaktivierung bei leerem Korb, Download-Inhalt, Clipboard-Aufruf.
- Go-Test für T2 ohne Firestore (Stil wie `users_test.go`): Guard lehnt Besucher mit 401 ab. Testname trägt AC-003-5.
- Vorab: `go vet ./...`, `go test ./...`, `cd frontend && npm run typecheck && npm test`.

## Reihenfolge

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T3 hängt an T1 und T2. T5 hängt an F-007, T3 an F-006, T2 an F-008.

Die Umsetzung startet erst, wenn F-006, F-007 und F-008 die Schnittstellen liefern (Q-003-09 = 2). T1 darf vorab entstehen, weil er ohne Vorgänger läuft.

## Abhängigkeiten zu anderen Features

- **F-006 Shopping Basket:** `useBasket`, Korbseite als Container des Generators.
- **F-007 Mehrsprachigkeit:** `useLocale`.
- **F-008 Master-Prompt-Editor:** `currentMasterPrompt`, Version, Regel für Variablen beim Speichern.
- **F-001 Nutzerverwaltung:** Login-Prüfung (`currentUser`), Guard-Muster (`guardAdmin`).

## Abweichungen von der Spec

- **Umfang «Seite Prompt-Generator».** Die Spec sieht eine eigene Seite vor und schließt den Generator auf der Korbseite aus. Q-003-13 = 2 legt den Generator auf die Korbseite. Die Spec (Umfang, Annahmen, Ausgangslage) ist noch nicht angepasst und sollte nachgezogen werden.
- **Lesezugriff auf den Master-Prompt.** Die Spec (D3) ändert F-008, D9. Diese Änderung gehört in F-008 und ist hier vorausgesetzt.

## Offen (keine Rückfrage, nur zur Kenntnis)

- Q-003-11 und Q-003-12 sind noch nicht abgesendet. Der Plan folgt den Empfehlungen. Ändern sich die Antworten, passen T4 und die Annahmen der Spec an.
- Die Route der Korbseite legt F-006 fest (vermutlich `/basket`). T3 hängt daran.
- Die Format-Festlegungen für `{{ideas}}` und den Dateinamen sind eigene Entscheidungen, die der Nutzer bestätigen kann.
