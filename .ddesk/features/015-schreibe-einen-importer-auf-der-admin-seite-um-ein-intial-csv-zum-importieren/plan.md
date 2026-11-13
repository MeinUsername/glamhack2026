# F-015 Schreibe einen Importer auf der Admin Seite um ein Intial CSV zum Importieren – Implementierungsplan

Grundlage: `spec.md` (Ziel, Umfang, D1–D9, Ausgangsdatei) und `acceptance.md` (AC-015-1 bis AC-015-7).
Bestand: Die Ideen liegen in Firestore-Collection `ideas` (`ideas.go`), die Admin-Prüfung in `admin.go` (`requireAdmin`), die Routen in `server.go`. Betroffen sind `ideas_import.go` (neu), `ideas_import_test.go` (neu), `server.go`, `frontend/src/admin/IdeaImport.tsx` (neu), `frontend/src/admin/IdeaImport.test.tsx` (neu), die Locale-Dateien unter `frontend/src/i18n/locales/` und `testdata/ideen-start.csv` (neu, Ausgangsdatei).

**Abhängigkeit F-014 (Pflicht vor T1):** F-015 setzt die Felder aus F-014 voraus. F-014 steht auf `implementing`, der Code hat aber noch `Audience`. Laut Plan F-014 (T1) gelten diese Namen, die F-015 hier übernimmt:
- Firestore: `target_group`, `description_of_interaction`, `staff_needed`, `exhibit_related` (`TargetGroup`, `DescriptionOfInteraction`, `StaffNeeded`, `ExhibitRelated` in `ideaDoc`)
- JSON in `ideaInput`: `targetGroup`, `descriptionOfInteraction`, `staffNeeded`, `exhibitRelated`

T1 beginnt erst, wenn F-014 T1 und T2 umgesetzt sind.

Hinweis: `ARCHITECTURE.md` und `docs/feature-workflow.md` sind im Repository nicht vorhanden. Dieser Plan folgt dem Muster der Pläne F-002, F-008 und F-014.

## Rückfragen und Annahmen dieses Plans

Die Rückfragen Q-015-10 bis Q-015-16 sind gestellt, aber noch nicht beantwortet (nicht blockierend, ohne abgesendete Antwort). Dieser Plan übernimmt die jeweilige Empfehlung. Der Nutzer bestätigt oder korrigiert sie; Abweichungen ändern nur die markierten Stellen.

- **Q-015-10 (Equipment):** «equipment needed» wird an Kommas getrennt, jeder Teil getrimmt, leere Teile fallen weg. Die Dublettenregel von `normalizeEquipment` (ohne Beachtung der Schreibung) gilt. Bei «e-ink device, wiring» entstehen die Chips «e-ink device» und «wiring» (AC-015-6).
- **Q-015-11 (Freitext):** «staff needed», «necessarily related to specific exhibits» und «description of interaction» werden als Text gespeichert, auch wenn die CSV «yes» oder «no» enthält.
- **Q-015-12 (Space):** «space needed» wird verworfen. Der Rohtext wird weder als Zahl noch als Notiz gespeichert (D4, AC-015-2).
- **Q-015-13 (Dublette):** Der Vergleich der Titel ist ohne Beachtung von Gross- und Kleinschreibung und ohne Randleerzeichen (D2, AC-015-3).
- **Q-015-14 (Doppelter Titel in derselben Datei):** Die erste Zeile wird angelegt, jede weitere Zeile mit gleichem Titel wird übersprungen und gemeldet. Das Verhalten entspricht D2.
- **Q-015-15 (Ablauf Vorschau):** Zweistufig. Der Upload sendet die Datei an die Vorschau-Route und zeigt das Ergebnis. Die Bestätigung sendet dieselbe Datei erneut an die Import-Route. Serverseitiges Zwischenspeichern entfällt, damit der Server zwischen Vorschau und Import keinen Zustand hält (AC-015-1: die Vorschau speichert nichts).
- **Q-015-16 (Abgrenzung F-010):** Der CSV-Import hat auf der Admin-Seite einen eigenen Bereich mit eigenem Button. Der JSON-Import aus F-010 bleibt ein separater Bereich (F-010 ist noch nicht umgesetzt; hier nur die Abgrenzung der Oberfläche).

Entscheidungen dieses Plans, die über die Rückfragen hinausgehen:
- **Dateiformat:** UTF-8, optional mit BOM (wird entfernt), Trennzeichen Komma, Kopfzeile in der ersten Zeile. Die Spalten werden über den Namen gefunden (ohne Beachtung der Schreibung und der Randleerzeichen). Unbekannte Spalten werden ignoriert. Fehlt die Spalte «Title», wird die Datei insgesamt abgelehnt (Fehlermeldung, nichts gespeichert).
- **Dateigrösse:** höchstens 5 MB pro Datei, begrenzt per `http.MaxBytesReader`, wie die Bildgrenzen aus F-002. Die Ausgangsdatei ist weit darunter.
- **Feldgrenzen:** Textfelder gelten mit 5.000 Zeichen wie in F-002 (`validateIdeaInput`). Eine Zeile, die daran scheitert, ist fehlerhaft und wird gemeldet.
- **Felder ohne CSV-Spalte** (Sustainability, Budget, Kategorien, Bilder) bleiben leer (D7). Bilder werden nie aus der CSV gelesen (D5).
- **Autor:** `created_by` ist die ID des importierenden Admins, `created_at` der Zeitpunkt des Imports.
- **Schreiben:** Gültige Zeilen werden in Firestore-Batches mit höchstens 500 Schreibvorgängen gespeichert. Die Gesamtzahl wird in der Antwort gemeldet. Scheitert ein Batch, bricht der Import mit Fehlermeldung ab; bereits geschriebene Batches bleiben (D3: kein Rollback, Wiederholung ist wegen D2 gefahrlos).

## Aufgaben

### T1 – CSV lesen und Zeilen abbilden (Backend)
- `ideas_import.go` (neu): `parseIdeaCSV(io.Reader) ([]importRow, error)` mit `encoding/csv`, Trennzeichen Komma, `FieldsPerRecord = -1` (zu kurze Zeilen werden als fehlerhaft gemeldet, nicht als Abbruch). BOM entfernen.
- Kopfzeile auf Spaltenindex abbilden: «Title», «description of idea», «description of interaction», «goal», «target group», «equipment needed», «space needed» (ignoriert), «staff needed», «necessarily related to specific exhibits», «accessibility», «picture» (ignoriert).
- Pro Zeile ein `ideaInput` bauen. «equipment needed» an Kommas trennen. Dann `validateIdeaInput` aufrufen. Ohne Titel ist die Zeile fehlerhaft («Titel fehlt»).
- `importRow` trägt Zeilennummer (Dateizeile, Kopfzeile = 1), Titel, `ideaInput`, Status-Feld (`ok`, `invalid`) und Meldung.
- Verweist auf: AC-015-2 (Felder laut Zuordnung), AC-015-4 (fehlender Titel wird nur für die Zeile abgelehnt), AC-015-6 (Equipment-Chips), AC-015-7 (Sustainability, Budget, Kategorien leer, keine Bilder).
- Abhängig von F-014 T1 (Felder `TargetGroup` und die drei neuen Textfelder).

### T2 – Dubletten und Vorschau-Ergebnis (Backend)
- `loadExistingTitles(ctx) (map[string]bool, error)`: liest nur das Feld `title` aller Dokumente aus `ideas` (`Select("title")`), Schlüssel `strings.ToLower(strings.TrimSpace(title))`.
- `classifyImport(rows, existing) importPreview`: reine Funktion ohne Firestore. Zählt `new`, `skipped`, `invalid`, und liefert je Zeile Status und Meldung («Zeile 7: «E-ink» existiert bereits, übersprungen»). Eine Zeile mit leerem Titel ist `invalid`. Eine Zeile, deren Titel schon in `existing` oder vorher in derselben Datei vorkommt, ist `skipped` (Q-015-14).
- Verweist auf: AC-015-1 (Anzahlen), AC-015-3 (Dublette wird übersprungen und gemeldet, Bestand bleibt).
- Abhängig von T1.

### T3 – Routen und Speichern (Backend)
- `ideas_import.go`: `func (s *server) apiImportIdeasPreview(w, r, _ sessionUser)` und `func (s *server) apiImportIdeas(w, r, actor sessionUser)`, nach dem Muster von `admin.go`.
- Routen in `server.go`, je über `s.requireAdmin(...)`: `POST /api/admin/import/ideas/preview` und `POST /api/admin/import/ideas`. Multipart-Feld `file`.
- Vorschau: Datei lesen, `loadExistingTitles`, `classifyImport`, JSON-Antwort mit `new`, `skipped`, `invalid` und den Zeilenmeldungen. Es wird nichts geschrieben.
- Import: dieselbe Verarbeitung, danach Schreiben der gültigen Zeilen (`new`) als `ideaDoc` mit `CreatedBy = actor.ID`, `CreatedAt = time.Now().UTC()`. Equipment-Katalog wie in `apiCreateIdea`: je Name Dokument in `equipment` (ID `nameKey`), idempotent über `Set`. Antwort mit denselben Zählern (`created`, `skipped`, `invalid`) und den Zeilenmeldungen.
- Fehler: Fehlt die Spalte «Title» oder ist die Datei kein gültiges CSV, `400` mit `writeJSONError`. Datei zu gross: `413`. Interner Fehler: `500`, Details nur ins Log.
- Verweist auf: AC-015-1 (Vorschau speichert nichts), AC-015-2 (Import speichert je Zeile), AC-015-5 (Nicht-Admin wird abgelehnt, nichts geändert).
- Abhängig von T1 und T2.

### T4 – Tests Backend (`ideas_import_test.go`, Namen nach dem Muster `TestAC015_x_...`)
- `testdata/ideen-start.csv` anlegen: Inhalt der Ausgangsdatei aus `spec.md` (Kopfzeile plus 18 Datenzeilen). Die Tests lesen diese Datei.
- `TestAC015_1_PreviewCountsAndWritesNothing`: `classifyImport` auf der Ausgangsdatei mit leerem Bestand ergibt 18 neu, 0 übersprungen, 0 fehlerhaft. Der Vorschau-Pfad ruft keinen Schreibweg auf (Prüfung über den Aufbau: `classifyImport` erhält keinen Client).
- `TestAC015_2_MapsColumnsAndLeavesSpaceEmpty`: Eine Zeile der Ausgangsdatei liefert Titel, Ziel, Zielgruppe, Freitext-Felder; das Feld `space` ist leer (kein `SpaceDoc`-Wert).
- `TestAC015_3_DuplicateIgnoresCaseAndKeepsExisting`: Bestand «e-ink» (kleingeschrieben) vs. Zeile «E-ink» ergibt `skipped`; zweite Zeile mit gleichem Titel in derselben Datei ebenfalls `skipped`. Nichts im Bestand wird verändert (`classifyImport` liefert keine Schreibaufträge für übersprungene Zeilen).
- `TestAC015_4_MissingTitleRejectsOnlyThatRow`: Zeile ohne Titel wird `invalid` mit Meldung, die übrigen 17 bleiben `new`.
- `TestAC015_5_NonAdminIsRejected`: `guardAdmin` mit einem Nutzer ohne Admin-Rolle gibt 403 zurück, der Handler wird nicht aufgerufen (Muster aus `invitations_test.go`).
- `TestAC015_6_EquipmentChips`: «e-ink device, wiring» ergibt die zwei Chips «e-ink device» und «wiring».
- `TestAC015_7_NoSustainabilityBudgetCategoriesOrImages`: Ergebnis-Dokument hat `Sustainability`, `Budget` (nil), `Categories` (leer), `Images` (leer).
- Verweist auf: AC-015-1 bis AC-015-7.
- Abhängig von T1, T2, T3.

### T5 – Oberfläche des Imports (Frontend)
- `frontend/src/admin/IdeaImport.tsx` (neu): Dateiauswahl (`accept=".csv"`), Button «Vorschau», Anzeige der Zähler, Tabelle der Zeilen mit Status `invalid` oder `skipped` (Zeilennummer, Titel, Meldung), Button «Importieren», nur aktiv bei `new > 0` und nach einer Vorschau. Nach dem Import Ergebnis mit Zählern und den Zeilenmeldungen.
- Die Datei wird beim Bestätigen erneut gesendet (Q-015-15). Die Oberfläche merkt sich dafür die ausgewählte Datei.
- Bereich auf der Admin-Seite, getrennt vom JSON-Import (Q-015-16). Die Route der Admin-Seite wird beim Umsetzen am Bestand geprüft (heute gibt es `/admin/users`).
- API-Aufrufe über den bestehenden Client; Fehler als Meldung unter dem Formular.
- Verweist auf: AC-015-1 (Vorschau mit Anzahlen, noch nichts gespeichert), AC-015-2 (Bestätigung speichert), AC-015-3 und AC-015-4 (Meldung je Zeile).
- Abhängig von T3 (Routen und JSON-Antwort).

### T6 – Übersetzungen (i18n)
- Neue Schlüssel `admin.import.*` (Titel des Bereichs, Button-Texte, Zählerlabels «neu», «übersprungen», «fehlerhaft», Meldungen je Zeile, Fehlermeldungen) in `de.ts`, `en.ts`, `fr.ts`, `it.ts`.
- Prüfen, ob `i18n.test.tsx` die Schlüsselgleichheit prüft.
- Verweist auf: AC-015-1 (Anzeige der Zähler).
- Abhängig von T5 (Schlüssel werden dort verwendet).

### T7 – Tests Frontend (`IdeaImport.test.tsx`)
- `TestAC015_1`-Entsprechung als Vitest-Test: Nach der Auswahl und «Vorschau» erscheinen die Zähler aus der Antwort; es wird kein Importaufruf gesendet, bevor «Importieren» gedrückt wird.
- Test: «Importieren» ist ohne Vorschau und bei `new = 0` deaktiviert.
- Test: Nach dem Import zeigt die Oberfläche das Ergebnis mit den Meldungen der übersprungenen Zeilen (AC-015-3).
- Verweist auf: AC-015-1, AC-015-2, AC-015-3.
- Abhängig von T5 und T6.

### T8 – Abnahme mit der Ausgangsdatei (Handlauf)
- In einer leeren Instanz die Datei `testdata/ideen-start.csv` vorab prüfen (Vorschau: 18 neu, 0 fehlerhaft, 0 übersprungen), dann importieren (18 Ideen, «space needed» leer, Equipment-Chips vorhanden).
- Zweiter Lauf derselben Datei: 18 übersprungen, 0 neu (AC-015-3, D8: mehrfach ausführbar).
- Als Nicht-Admin Vorschau und Import versuchen: abgelehnt, nichts geändert (AC-015-5).
- `make check` (falls vorhanden) und die Go-Tests grün. Die Ergebnisse im Abschlussbericht nennen.
- Verweist auf: AC-015-2, AC-015-3, AC-015-5, AC-015-7.
- Abhängig von T1 bis T7.

## Reihenfolge

T1 → T2 → T3 → T4 (Backend, nach F-014 T1/T2), danach T6 → T5 → T7 (Frontend), zuletzt T8.
