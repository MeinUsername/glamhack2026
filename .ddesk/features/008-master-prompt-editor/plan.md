# F-008 Master - Prompt Editor – Implementierungsplan

Grundlage: `spec.md` (Umfang, Entscheidungen D1–D9) und `acceptance.md` (AC-008-1 bis AC-008-7).
Bestand im Repo (Stand Plan): Go-Backend mit Firebase Auth und Firestore (`server.go`, `admin.go`, `ideas.go`), Rollen und `guardAdmin` (`admin.go`), React-Frontend unter `frontend/src` mit React Router (`App.tsx`), Vitest-Tests, Go-Tests mit Namen nach Kriterium (`users_test.go`, `ideas_test.go`). **Nicht vorhanden:** Korb (F-006), Mehrsprachigkeit (F-007), Master-Prompt-Editor und Versionen.

## Rückfragen und ihre Antworten

- **Q-008-08 = 1:** Der Master-Prompt wird serverseitig gelesen. Es gibt keinen Endpunkt, den Nicht-Admins aufrufen können (D9 bleibt). **Konflikt mit F-003:** Dort ist mit Q-003-10 = 1 ein öffentlicher Endpunkt `GET /api/master-prompt` für alle eingeloggten Rollen festgelegt. Dieser Plan setzt F-008 um; F-003 T2 muss angepasst werden (siehe «Offene Konflikte»).
- **Q-008-09 = 2:** Die Editor-Ansicht ist umschaltbar: Quelltext oder Vorschau, nicht nebeneinander.
- **Q-008-10 = 1 plus Freitext «Die Firebase Datenbank»:** Die Versionen liegen in Firestore, nicht in SQLite. Der Code nutzt bereits Firestore (`ideas.go`, `files.go`, `users.go`). Die Antwort «1» (SQLite) ist durch den Freitext überholt. Bitte bestätigen (siehe «Offene Konflikte»).
- **Q-008-11 (nicht blockierend, ohne Antwort):** Gleichzeitiges Bearbeiten: Der letzte Schreibvorgang gewinnt. Der Plan folgt der Empfehlung.
- **Q-008-12 (nicht blockierend, ohne Antwort):** Die Annahmen aus der Spec gelten als Empfehlung. Sie sind noch nicht bestätigt.

## Schnittstellen aus Vorgänger-Features

Diese Features existieren noch nicht. F-008 nutzt die folgenden Schnittstellen. Die Festlegungen stehen in den Plänen der Vorgänger.

- **nutzt F-001: Rollen und Guard.** `requireAdmin` und `guardAdmin` (`admin.go`), `sessionUser.Role`, `roleAdmin`. Bestehend.
- **nutzt F-003: Renderer.** `renderPrompt(template, ideas, locale)` in `frontend/src/prompt/render.ts` (F-003 T1). F-008 nutzt dieselbe Funktion für die Vorschau; es gibt keine zweite Implementierung. Ersetzt nur `{{ideas}}` und `{{language}}`.
- **nutzt F-006: Korb.** `useBasket(): string[]` liefert die Idee-IDs im Korb (F-006). Die Idee-Daten kommen aus `GET /api/ideas/{id}`.
- **nutzt F-007: Sprache.** `useLocale(): { code, name }` (F-007). Der Name ist auf Deutsch.
- **Stellt bereit für F-003: Lesen.** Go-Funktion `currentMasterPrompt(ctx) (promptVersion, bool, error)` mit dem Vertrag aus F-003. `bool` ist `false`, wenn es keine Version gibt. Diese Funktion gehört F-008.

## Festlegungen dieses Plans

- **Speicher.** Firestore-Collection `master_prompt_versions`. Ein Dokument je Version, Dokument-ID ist die Versionsnummer mit führenden Nullen (`000001`), damit die Reihenfolge stimmt. Felder: `number`, `text`, `author_id`, `created_at`. Aktuell ist die Version mit der höchsten Nummer.
- **Nummerierung.** Die nächste Nummer wird in einer Firestore-Transaktion vergeben (max + 1), damit zwei gleichzeitige Speicherungen keine Nummer doppeln.
- **Speichern ohne Änderung (AC-008-4).** Ist der Text identisch mit der aktuellen Version, passiert nichts. Die API antwortet mit `created: false`.
- **Wiederherstellen (D7).** Kopiert den Text von Version N als neue Version. Ist der Text identisch mit der aktuellen Version, wird keine Version angelegt (gleiche Regel wie AC-008-4). **Eigene Entscheidung.**
- **Variablen-Prüfung (D1, AC-008-5).** Erlaubt sind genau `ideas` und `language`. Gefunden werden alle `{{…}}` im Text. Unbekannte Namen stehen in der Antwort als Liste. Die Prüfung läuft im Backend (Quelle der Wahrheit) und zusätzlich im Frontend, damit die Meldung sofort erscheint.
- **Lesen nur für Admins (D9).** Alle Endpunkte von F-008 hängen an `requireAdmin`. Die Seite `/admin/master-prompt` wird wie `/admin/users` über `requireAdmin` ausgeliefert.
- **Keine Übernahme von Versionen beim Vergleich.** Kein Diff, keine Kommentare (Umfang).
- **Vorschau (D4).** Die Vorschau nutzt den Korb und die Sprache des Browsers, in dem der Admin den Editor öffnet. Der Korb des Admins ist der Korb im Localstorage dieses Browsers.
- **Gleichzeitiges Bearbeiten (Q-008-11, Empfehlung).** Der letzte Schreibvorgang gewinnt. Es gibt keine Versionsprüfung beim Speichern.

## Aufgaben

### T1 – Variablen prüfen (Backend, pure Funktion)
- `masterprompt.go`: `findVariables(text string) []string` liefert alle Namen aus `{{…}}` in Textreihenfolge, ohne Duplikate. `unknownVariables(text string) []string` filtert gegen `ideas` und `language`.
- Keine Abhängigkeit zu Firestore oder HTTP. Dadurch testbar ohne Datenbank.
- Verweist auf: AC-008-1 (Platzhalter bleiben stehen), AC-008-5 (Name `foo` wird genannt).

### T2 – Versionsspeicher (Backend)
- `masterprompt.go`: `currentMasterPrompt(ctx)`, `listMasterPromptVersions(ctx)`, `saveMasterPrompt(ctx, actor, text) (version, created bool, err)`, `restoreMasterPrompt(ctx, actor, number) (version, created bool, err)`.
- Speichern ruft zuerst `unknownVariables`. Bei unbekannten Namen wird nicht geschrieben, Fehler `errUnknownVariables` mit den Namen.
- Beide Schreibvorgänge laufen in einer Firestore-Transaktion (Nummer und Vergleich mit der aktuellen Version).
- Verweist auf: AC-008-1 (neue Version), AC-008-3 (Wiederherstellen, Versionen 1 bis 4 bleiben), AC-008-4 (keine Version bei gleichem Text), AC-008-5 (Ablehnung).

### T3 – API und Guard (Backend)
- Routen in `server.go`, alle mit `s.requireAdmin`:
  - `GET /api/admin/master-prompt`: aktuelle Version und Liste (`{ current, versions: [...] }`). 404 wenn keine Version existiert, Liste bleibt dann leer.
  - `POST /api/admin/master-prompt` mit `{ text }`: 200 mit `{ version, created }`. 400 mit `{ error, unknown: ["foo"] }` bei unbekannten Variablen.
  - `POST /api/admin/master-prompt/versions/{n}/restore`: 200 mit `{ version, created }`. 404 wenn Version N fehlt.
  - `GET /admin/master-prompt`: Seite, wie `adminPage` (`writeAppIndex`), ebenfalls mit `requireAdmin`.
- Nicht-Admins erhalten 401 (ohne Login) oder 403 (ohne Admin-Rolle) aus `guardAdmin`.
- Verweist auf: AC-008-2 (Ablehnung für Nicht-Admins), AC-008-1, AC-008-3, AC-008-5 (API-Seite).

### T4 – Editor-Seite (Frontend)
- `frontend/src/pages/AdminMasterPrompt.tsx` mit Route `/admin/master-prompt` in `App.tsx`.
- Textbereich für den Quelltext. Umschalter «Quelltext | Vorschau» (Q-008-09 = 2). Die Vorschau ist nur lesbar.
- Schaltfläche «Speichern» ist deaktiviert, solange der Text dem geladenen Stand entspricht (AC-008-4 im UI).
- Unbekannte Variablen werden vor dem Absenden angezeigt. Die Meldung nennt die Namen (AC-008-5). Die API-Antwort 400 zeigt dieselbe Meldung.
- Nach Erfolg: Text und Versionsliste neu laden, Hinweis «Version N angelegt» oder «Keine Änderung».
- Verweist auf: AC-008-1, AC-008-4, AC-008-5.

### T5 – Vorschau mit Korb und Sprache (Frontend)
- Vorschau-Modus ruft `renderPrompt(text, ideas, locale)` (F-003 T1) auf. `ideas` kommt aus `useBasket()` (F-006) und `GET /api/ideas/{id}`, `locale` aus `useLocale()` (F-007).
- Leerer Korb: `{{ideas}}` wird zu leerem Text (AC-008-7). Das ist das Verhalten von `renderPrompt` bei leerer Liste.
- Verweist auf: AC-008-6 (zwei Ideen, `de (Deutsch)`), AC-008-7 (leerer Korb). Nutzt F-003, F-006, F-007.

### T6 – Versionsliste und Wiederherstellen (Frontend)
- Liste unter dem Editor: Nummer, Zeitstempel, Autor (E-Mail aus dem Admin-Konto). Aktuelle Version ist markiert.
- Je Version die Schaltfläche «Wiederherstellen». Ein Klick ruft T3 auf und lädt den Editor mit dem neuen aktuellen Text.
- Die Versionen 1 bis N-1 bleiben sichtbar. Keine Löschaktion (D7).
- Verweist auf: AC-008-3.

### T7 – Tests
- Go, nach Muster `users_test.go`: `masterprompt_test.go` mit Namen `TestAC008_<n>_...`:
  - AC-008-1: Speichern mit `{{ideas}}` und `{{language}}` legt Version an, Platzhalter bleiben im Text (T1, T2).
  - AC-008-2: `guardAdmin` lehnt Nutzer und Besucher ab (über die `resolve`-Funktion, wie `guardAdmin` in `admin.go`).
  - AC-008-3: Wiederherstellen von Version 2 bei aktuell 4 ergibt Version 5 mit Text 2, Versionen 1 bis 4 unverändert.
  - AC-008-4: gleicher Text ergibt keine neue Version.
  - AC-008-5: `{{foo}}` wird abgelehnt, Fehler nennt `foo`.
- Frontend, Vitest: `AdminMasterPrompt.test.tsx`:
  - AC-008-4: Speichern deaktiviert bei unverändertem Text.
  - AC-008-5: Meldung nennt `foo` vor dem Absenden.
  - AC-008-6 und AC-008-7: Vorschau nutzt `renderPrompt`. Die Tests zur Renderfunktion selbst liegen bei F-003 (T1). F-008 testet nur den Anschluss an Korb und Sprache mit Stubs für `useBasket` und `useLocale`.
- Verweist auf: alle AC-008-1 bis AC-008-7.

## Offene Konflikte und Abweichungen

- **Lesen des Master-Prompts (Konflikt mit F-003).** Q-008-08 = 1 sagt: kein Endpunkt für Nicht-Admins. F-003 T2 plant `GET /api/master-prompt` für alle Rollen. F-003 T2 muss vor der Umsetzung von F-003 angepasst werden. Das ist eine Entscheidung des Nutzers, nicht dieses Plans.
- **Speicher (Firestore statt SQLite).** Die Antwort auf Q-008-10 ist widersprüchlich («1» plus Freitext «Die Firebase Datenbank»). Der Plan folgt dem Freitext (Firestore). Bitte bestätigen.
- **Annahmen aus der Spec** (leerer Korb, unbekannte Variable, Sprachnamen): Der Plan folgt der Spec. Sie sind noch nicht bestätigt (Q-008-12 offen).

## Reihenfolge

T1 → T2 → T3 → T4 und T5 (parallel möglich, sobald F-003 T1, F-006 und F-007 stehen) → T6 → T7 (Tests begleiten T1 bis T6).
