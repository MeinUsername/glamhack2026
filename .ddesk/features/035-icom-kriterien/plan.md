---
id: F-035
---

# F-035 Plan

Die JSON-Datei `frontend/src/data/icom-filter-kategorien.json` bleibt die einzige Quelle. Das Go-Paket liegt im Repo-Root, `//go:embed frontend/src/data/icom-filter-kategorien.json` ist dort ohne Umwege möglich (kein `..`). Beim Start wird die Datei einmal geparst (Paketinitialisierung); aus ihr entstehen die Kategorie-IDs (Reihenfolge: Gruppen, dann Kategorien) und die Orts-IDs (`secondaryFilters` mit `id == "location"`). Ist die Datei kaputt oder enthält keine Kategorie, bricht der Start mit `panic` ab, statt jede ID stillschweigend abzulehnen. `normalizeIDs` und alle Aufrufer (`validateIdeaInput`, `parseICOMAssignments`, CSV-Import) bleiben unverändert, sie lesen nur `icomCategoryIDs`/`locationIDs`, die jetzt aus der Datei gefüllt werden.

Das Datenformat der Ideen ändert sich nicht (Annahme der Spec), es gibt keine Migration.

Die Orte und das Filterformat der URL (`categories`, `locations`) bleiben unverändert; nur die Verknüpfung innerhalb der Kategorien wechselt von ODER auf UND (löst AC-024-4 ab).

Festlegungen des Plans (Vorschläge, nicht aus der Spec):
- Die Orts-IDs kommen ebenfalls aus der JSON-Datei (gleiche Datei, gleiche Duplikationslücke); `locationIDs` wird mit den Kategorie-IDs abgeleitet.
- Die Kategorie-Beschreibung steht als sichtbarer Text unter dem Chip in der Filterleiste (bisher nur `title`-Tooltip, der auf Touch-Geräten nicht sichtbar ist). Die Sprache folgt `pick()` (de, sonst en).
- Die ICOM-Referenzen erscheinen auf der Detailseite als kleine Zeile neben dem Kategorie-Link (z. B. «S.2 · S.3 · G.6»); die bestehenden Links auf die gefilterte Übersicht bleiben.
- Der alte Gleichlauf-Test `TestF024_IDsMatchFrontendJSON` entfällt, weil es keine zweite Liste mehr gibt; an seine Stelle tritt ein Test, der die geladene Liste gegen die Datei prüft und die bekannten 13 Kategorien sowie 3 Orte als Regression absichert.

## Aufgaben

- **T1 Kriterien aus der JSON-Datei laden** (AC-035-1, AC-035-2)
  nutzt F-024: `ideas_icom.go`, `normalizeIDs`
  - `ideas_icom.go`: `//go:embed frontend/src/data/icom-filter-kategorien.json`, Struktur zum Parsen (`filterGroups[].categories[].id`, `secondaryFilters[]` mit Orts-Optionen), `icomCategoryIDs` und `locationIDs` werden aus der Datei abgeleitet (Variablen bleiben, die handgeschriebene Liste und der Kommentar «IDs repeated here» entfallen). Start-Prüfung: mindestens eine Kategorie und ein Ort, keine doppelten IDs, sonst `panic`.
  - `ideas_icom_test.go`: `TestF024_IDsMatchFrontendJSON` ersetzen durch einen Test, der die Datei unabhängig einliest und mit `icomCategoryIDs`/`locationIDs` vergleicht (AC-035-1), plus feste Erwartung der heutigen 13 Kategorien und 3 Orte. Bestehende Tests zu `validateIdeaInput` (bekannte ID akzeptiert, `nope`, `Accessibility`, `affirmative` abgelehnt mit Meldung) bleiben und belegen AC-035-2; ergänzen: ein Test, der für jede ID der Datei eine Idee speichern lässt (`validateIdeaInput`) und eine ID ausserhalb ablehnt.
  - Prüfen, dass `icom_assign.go`, `ideas_import.go` und `cmd/assign-icom` ohne Änderung bauen (`go build ./... && go test ./...`).

- **T2 Datei im Deploy-Paket** (AC-035-3)
  braucht T1
  - `.gcloudignore`: `frontend/` durch Muster ersetzen, die nur diese eine Datei durchlassen (gitignore-Semantik: ein ausgeschlossenes Verzeichnis kann nicht per `!` wieder geöffnet werden, deshalb stufenweise): `frontend/*`, `!frontend/src/`, `frontend/src/*`, `!frontend/src/data/`, `frontend/src/data/*`, `!frontend/src/data/icom-filter-kategorien.json`. Kommentar in der Datei anpassen.
  - Prüfen mit `gcloud meta list-files-for-upload` (alternativ `gcloud meta list-files-for-upload` mit Ausgabe nach `frontend`), dass genau diese Datei aus `frontend/` enthalten ist und kein weiterer Frontend-Quelltext oder `node_modules`.
  - Prüfen, dass der Build in der Cloud weiter funktioniert: `cloudbuild.yaml` baut das Frontend im Schritt davor und lädt danach `--source=.`; die Datei muss beim `go build` im Paket liegen. Ein lokaler Test ohne `frontend/`-Verzeichnis ist nicht nötig, `go:embed` scheitert beim Build laut, wenn die Datei fehlt (das ist der gewünschte Fehlerfall und zeigt sich vor dem Deploy, nicht erst zur Laufzeit).
  - `README.md`: Abschnitt zum Deploy/zur Struktur um den Hinweis ergänzen, dass die JSON-Datei die einzige Quelle ist und vom Backend eingebettet wird (und warum sie von `.gcloudignore` ausgenommen ist).

- **T3 Kommentare und Hinweise bereinigen** (AC-035-1)
  braucht T1
  - `frontend/src/ideas/icom.ts`: Kommentar «the server checks the same IDs (ideas_icom.go, kept in step by a Go test)» ersetzen durch «the server embeds this file (ideas_icom.go)». Keine Logikänderung.

- **T4 Mehrfachfilter mit UND** (AC-035-4, AC-035-5)
  nutzt F-024: `matchesFilter`, `IdeasList`
  - `frontend/src/ideas/icom.ts`: `matchesFilter` prüft Kategorien mit `every` statt `some`; Orte bleiben `some`; Kategorien und Orte bleiben UND-verknüpft; leere Auswahl filtert nicht. Kommentar anpassen.
  - `frontend/src/ideas/IcomFilter.test.tsx`: Test «verknüpft Kategorien mit ODER und Kategorie und Ort mit UND» umschreiben: mit den Beispieldaten `a` (accessibility + dialogue-exchange, onsite), `b` (digital-mediation, online), `c` (leer): `accessibility` allein ⇒ a; `accessibility` + `dialogue-exchange` ⇒ a; `accessibility` + `digital-mediation` ⇒ keine Idee (vorher a und b); mit zusätzlich `onsite` bleibt nur a. Weiteren Test: zwei Orte (`onsite`, `online`) mit einer Kategorie ⇒ ODER bei Orten. Unit-Test für `matchesFilter` aktualisieren.
  - Der URL-Zustand (`categories`, `locations`, Reihenfolge nach JSON, unbekannte IDs ignoriert, «X von Y Ideen», «Filter zurücksetzen») ändert sich nicht; die vorhandenen URL-Tests laufen weiter und belegen den zweiten Teil von AC-035-5. Der Test «liest den Filter aus der URL …» prüft mit `dialogue-exchange` + `online` weiterhin 0 Treffer und bleibt gültig.
  - Prüfen, ob Texte der Oberfläche (`i18n`, Hilfetext oder `aria`-Beschriftung der Filterleiste) das ODER erwähnen; falls ja, auf «alle gewählten» ändern (de, en, fr, it).

- **T5 Beschreibung in der Filterleiste** (AC-035-6)
  braucht T4 (gleiche Datei `IdeasList.tsx`)
  - `frontend/src/ideas/IdeasList.tsx` (`FilterBar`, um Zeile 255): zu jeder Kategorie die Beschreibung (`pick(c.description, lang)`) als sichtbaren, kleinen Text unter dem Chip rendern, nicht nur als `title`. Den Text mit dem Chip verknüpfen (`aria-describedby`), damit Screenreader ihn vorlesen. Layout bleibt eine Spalte im Seitenpanel; kein Einfluss auf den Schalter «Show all subcategories».
  - `IcomFilter.test.tsx`: Test, dass bei eingeblendeten Unterkategorien die Beschreibung von `accessibility` sichtbar ist (en), und nach `i18n.changeLanguage('de')` die deutsche Beschreibung erscheint (Texte aus der JSON-Datei importieren statt kopieren).

- **T6 ICOM-Referenzen auf der Detailseite** (AC-035-7)
  nutzt F-023: `IdeaPage`
  - `frontend/src/ideas/IdeaPage.tsx` (`IcomTags`): hinter jedem Kategorie-Link die `icomRefs` der Kategorie anzeigen (z. B. «S.2 · S.3 · G.6»), mit einer kurzen Beschriftung (neuer i18n-Schlüssel, z. B. `ideas.icomRefs`, in allen vorhandenen Sprachen) und zugänglichem Namen. Hat eine Kategorie keine Referenzen, entfällt die Zeile. Kategorie-IDs, die nicht in der JSON-Datei stehen, werden wie bisher übersprungen.
  - `frontend/src/ideas/IdeaPage.test.tsx` (bzw. dem vorhandenen Test der Detailseite): Idee mit `participation-cocreation` und `visitor-feedback` ⇒ «S.2», «S.3», «G.6» und «E.4» sichtbar; Idee ohne Kategorien zeigt keinen Referenzblock.

- **T7 Gesamtprüfung und Dokumentation** (AC-035-1 bis AC-035-7)
  braucht T1 bis T6
  - `go vet ./... && go test ./...`, im Ordner `frontend/` `npm run lint`, `npm test` und `npm run build` (der Build erzeugt `static/app`).
  - Manuelle Stichprobe im laufenden Dienst: Idee mit unbekannter Kategorie-ID per API ⇒ 400 mit Meldung; Übersicht mit zwei Kategorien ⇒ nur Ideen mit beiden; URL einer Auswahl neu laden ⇒ gleiche Auswahl; Detailseite zeigt Referenzen.
  - Spec `F-024`/`acceptance.md` nicht ändern (AC-024-4 bleibt Historie); in `README.md` die Filterlogik (UND) und die einzige Quelle festhalten.
