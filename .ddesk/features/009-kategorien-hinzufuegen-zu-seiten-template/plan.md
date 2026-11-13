# F-009 Kategorien hinzufügen zu Seiten Template – Implementierungsplan

Grundlage: `spec.md` (Umfang, Entscheidungen, Annahmen) und `acceptance.md` (AC-009-1 bis AC-009-6).
Baut auf F-002 (Seiten-Template, Endpoints, `IdeaForm`, `IdeaPage`, `ideas.go`) und F-005 (React-Frontend, Router) auf. Beide sind im Arbeitsstand noch nicht fertig umgesetzt; F-009 ist erst nach F-002 und F-005 umsetzbar.

Bestätigte Rückfragen:
- **Q-009-06:** Tooltip auf Touch-Geräten: «Nur bei Tastaturfokus, auf Touch entfällt er».

## Festlegungen dieses Plans

- **Übermittlung:** Im JSON-Feld `data` von `POST /api/ideas` (F-002) als Array `categories` mit Schlüsseln, z. B. `["affirmative","transformation"]`. Fehlt das Feld oder ist es `null`, gilt es als leer.
- **Gültige Werte:** exakt `affirmative`, `reproductive`, `deconstructive`, `transformation` (Groß-/Kleinschreibung zählt). Jeder andere Wert ergibt 400.
- **Duplikate:** werden beim Validieren entfernt, die Reihenfolge der ersten Vorkommen bleibt erhalten.
- **Firestore:** Feld `categories` (Array von Strings) im Dokument der Collection `ideas` (F-002). Alte Seiten ohne Feld gelten als leer.
- **API-Antwort:** `GET /api/ideas/{id}` liefert `categories` immer als Array (`[]` statt `null`).
- **Formularelement:** Gruppe von vier Checkboxen (`<fieldset>` mit `<legend>` «Categories of critical art mediation»). Checkboxen statt Auswahlliste, weil Mehrfachauswahl ohne Modifikatortasten bedienbar sein soll. Labels englisch wie in der Vorlage (`Affirmative`, `Reproductive`, `Deconstructive`, `Transformation`).
- **Tooltip-Inhalt:** Texte und Quelle aus der Tabelle der Spec, unverändert, deutsch (Übersetzung ist laut Spec nicht Teil dieses Features). Ein Tooltip am Feldtitel, nicht je Option.
- **Tooltip-Bedienung (Q-009-06):** Der Tooltip öffnet sich bei Maushover und bei Tastaturfokus (`:focus-visible`). Auf Touch-Geräten (`(hover: none)`) wird der Auslöser nicht gerendert. Ein Tipp auf dem Touch-Gerät darf den Tooltip nicht öffnen. Die Erklärungen sind dort also nicht erreichbar, siehe «Offen».
- **Chips:** `IdeaPage` zeigt die Chips direkt unter dem Titel, nur wenn mindestens eine Kategorie gewählt ist. Chips sind nicht anklickbar.
- **Kein Umfang:** kein Filtern, keine Mindest- oder Höchstanzahl, keine Übersetzung.

## Aufgaben

### T1 – Datenmodell und Validierung
- `ideas.go` (F-002): Konstante mit den vier gültigen Schlüsseln und deren Reihenfolge. Feld `Categories []string` in `ideaInput` und `ideaDoc`.
- In `validateIdeaInput` (F-002, T1): Kategorien prüfen, Duplikate entfernen, unbekannte Werte mit Fehler ablehnen. Leere Liste und `null` sind gültig.
- Nutzt F-002: `validateIdeaInput`, `ideaInput`, `ideaDoc`.
- Verweist auf: AC-009-1 (keine, eine oder mehrere Kategorien sind gültig), AC-009-2 (fremder Wert wird abgelehnt), AC-009-3 (Doppelte nur einmal).

### T2 – Speichern und Abrufen
- `POST /api/ideas` (F-002, T3): `categories` aus `data` übernehmen und in die Seite schreiben. Ändert nichts an Bildern oder Geräten.
- `GET /api/ideas/{id}` (F-002, T3): View-Typ `ideaView` um `categories` erweitern, für alte Seiten ohne Feld `[]` liefern.
- Nutzt F-002: `POST /api/ideas`, `GET /api/ideas/{id}`, `ideaView`.
- Verweist auf: AC-009-1 (Speichern), AC-009-5 (abrufbar), AC-009-6 (Seite ohne Kategorie).

### T3 – Go-Tests
- In `ideas_test.go` (F-002), Stil wie dort, Testnamen mit AC-Nummer, z. B. `TestAC009_2_UnknownCategoryRejected`.
- Fälle: keine, eine, alle vier Kategorien gültig (AC-009-1); Wert außerhalb der vier und Groß-/Kleinschreibung abweichend ergeben Fehler (AC-009-2); `["affirmative","affirmative"]` ergibt `["affirmative"]` (AC-009-3); View einer Seite ohne Feld liefert `[]` (AC-009-6).
- Vorab: `go vet ./...`, `go test ./...`.

### T4 – Mehrfachauswahl im Erfassungsformular
- `frontend/src/ideas/IdeaForm.tsx` (F-002, T5): Fieldset mit den vier Checkboxen, Legend «Categories of critical art mediation», Werte als Schlüssel. Auswahl wird im Feld `categories` von `data` mitgesendet. Keine Auswahl ist gültig und nicht als Pflichtfeld markiert.
- Nutzt F-002: `IdeaForm`, Absendelogik aus F-002 T5. Nutzt F-005: Router (`/ideas/new`).
- Verweist auf: AC-009-1 (Formular speichert mit keiner, einer oder mehreren Kategorien).

### T5 – Tooltip am Feldtitel
- Neue Komponente `frontend/src/ideas/CategoriesInfo.tsx`: Auslöser (Info-Symbol mit `aria-describedby`) neben der Legend. Inhalt: Tooltip-Kopf, je Kategorie Name und Erklärung aus der Spec-Tabelle, Quellenangabe «Carmen Mörsch, 2009, documenta-12-Vermittlung».
- Öffnen bei Hover und `:focus-visible`, Schließen bei Verlassen bzw. Escape. Auf `(hover: none)` nicht gerendert (Q-009-06).
- Eingebunden in `IdeaForm` (T4).
- Verweist auf: AC-009-4 (Tooltip zeigt Kopf, vier Erklärungen, Quelle).

### T6 – Chips auf der Seite
- `frontend/src/ideas/IdeaPage.tsx` (F-002, T7): Chip-Block unter dem Titel, nur bei mindestens einer Kategorie. Chip-Text ist das englische Label aus T4.
- Nutzt F-002: `IdeaPage`, Typ `Idea` in `types.ts` (um `categories: string[]` erweitern).
- Verweist auf: AC-009-5 (gewählte Kategorien als Chips), AC-009-6 (kein Chip-Block ohne Kategorie).
- Abhängig von T2 (View-Feld).

### T7 – Frontend-Tests
- Vitest und React Testing Library, in `IdeaForm.test.tsx` und neuer Datei `CategoriesInfo.test.tsx`:
  - Auswahl mit keiner, einer und mehreren Kategorien, gesendete Werte sind Schlüssel (AC-009-1).
  - Tooltip zeigt Kopf, vier Erklärungen und Quelle bei Fokus (AC-009-4).
  - Auslöser ist bei `matchMedia('(hover: none)')` nicht gerendert (Q-009-06).
  - Chips bei gesetzten Kategorien, kein Block bei leerer Liste (AC-009-5, AC-009-6), in `IdeaPage.test.tsx`.
- Vorab im Verzeichnis `frontend/`: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.

## Reihenfolge

T1 → T2 → T3 (Backend). T4 und T5 nach F-002 T5 und F-005 (Router). T6 nach T2 und F-002 T7. T7 nach T4 bis T6.

## Abhängigkeiten zu anderen Features

- **F-002 Eine Seite-Template:** `ideas.go`, `POST /api/ideas`, `GET /api/ideas/{id}`, `IdeaForm`, `IdeaPage`, `ideaView`. Die F-002-Plan-Funktion `validateIdeaInput` hat im Plan einen Rückgabewert `(ideaDoc, error)`, in `interfaces.md` steht `(ideaDoc, []equipmentDoc, error)`. Vor der Umsetzung angleichen; dieser Plan nutzt die Funktion unverändert.
- **F-005 React-Frontend:** Router, Build und Test-Setup in `frontend/`.
- **F-001 Nutzerverwaltung:** Anmeldung und Rolle für die Endpoints, unverändert zu F-002.

## Offen

- **Touch-Konflikt (Q-009-06):** Mit der Antwort sind die Erklärungen auf Touch-Geräten nicht erreichbar. AC-009-4 gilt dort faktisch nicht, und die Spec nennt die Einordnung als Ziel für Erfassende. Vorschlag: Entscheidung vor der Umsetzung bestätigen oder Spec-Ziel bzw. AC-009-4 anpassen.
- **Tooltip bei Hover:** Die Antwort nennt nur den Tastaturfokus. Dieser Plan lässt zusätzlich Mauszeiger-Hover zu. Falls das nicht gewollt ist, entfällt in T5 der Hover-Zweig.
- **Tippen auf Touch-Geräten:** Ein Tipp auf den Feldtitel kann den Fokus setzen. Der Auslöser wird auf Touch nicht gerendert, daher sollte der Fokus dort keinen Tooltip öffnen. Das prüft T7.
