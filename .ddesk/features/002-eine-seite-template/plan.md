# F-002 Eine Seite-Template – Implementierungsplan

Grundlage: `spec.md` (Umfang, Entscheidungen, Felder) und `acceptance.md` (AC-002-1 bis AC-002-7).
Bestand: Go-Backend (`server.go`, `auth.go`, `files.go`), Firestore, GCS-Bucket aus `BUCKET_NAME` (bereits von F-001-Dateien genutzt), React-Frontend in `frontend/` (F-005, noch nicht umgesetzt; das Verzeichnis existiert bereits als Vorlage).

Bestätigte Rückfragen:
- **Q-002-08:** Die Oberfläche ist englisch beschriftet (Labels, Überschriften, Platzhalter, Fehlermeldungen), passend zu den englischen Feldnamen.

## Festlegungen dieses Plans

- **Endpoints** (JSON-API unter `/api/`, Anmeldung per Session-Cookie wie in F-001):
  - `POST /api/ideas`: multipart/form-data. Feld `data` enthält die Textfelder als JSON, `images` (0 bis 5 Dateien) enthält die Bilder. Ein Request speichert Seite und Bilder zusammen.
  - `GET /api/ideas/{id}`: liefert die Seite als JSON. Nur angemeldete Nutzer.
  - `GET /api/ideas/{id}/images/{n}`: streamt Bild `n` (0-basiert) aus dem Bucket. Der Bucket bleibt privat, es gibt keine öffentlichen URLs.
  - `GET /api/equipment?q=<text>`: Autocomplete-Vorschläge für Geräte, höchstens 10 Treffer.
- **Speicherort der Bilder:** bestehender GCS-Bucket (`BUCKET_NAME`), Objektname `ideas/<idea-id>/<zufall>.<ext>`. Lokale Ablage scheidet aus, weil Cloud Run kein dauerhaftes Dateisystem hat.
- **Firestore-Collection `ideas`**, Dokument-ID automatisch: `title`, `description`, `audience`, `goal`, `sustainability`, `accessibility` (Strings, leer erlaubt), `space` (`{area_m2, volume_m3}`, je Zahl oder `null`), `equipment` (Array von Strings, Anzeigeschreibweise), `budget` (`S` | `M` | `L` | `XL` | `null`), `images` (Array von `{object, content_type, size}`), `created_by` (UID), `created_at`.
- **Firestore-Collection `equipment`** als Katalog für die Autocomplete. Dokument-ID = Kleinschreibung und getrimmt (`name_key`), Felder `name` (Anzeigeschreibweise der ersten Erfassung), `name_key`. Wird in derselben Transaktion wie die Seite angelegt, sofern noch nicht vorhanden. Damit gilt: Vorschläge = alle bisher erfassten Geräte, Schreibweise egal.
- **Autocomplete-Suche** per Range-Query auf `name_key` (Präfix, `q` kleingeschrieben und getrimmt). Substring-Suche ist in Firestore nicht vorgesehen und wird nicht gebaut.
- **Validierung im Backend ist maßgeblich.** Das Frontend prüft Bildanzahl, Größe und Format vorab, damit der Nutzer früh Rückmeldung bekommt; die Prüfung wird aber im Backend wiederholt.
- **Bildformat:** Erkennung über die Dateibytes (`http.DetectContentType`), nicht über Dateiendung oder den vom Browser gesendeten Content-Type. Erlaubt: `image/jpeg`, `image/png`, `image/webp`.
- **Größenlimits:** 5 Bilder, je 5 MB (5 MiB = 5 << 20 Byte). Das bestehende Limit von 1 MB für F-001-Dateien bleibt unverändert und ist eine eigene Konstante. Body-Limit des Requests: 26 MiB (5 Bilder plus Text, unter dem Cloud-Run-Limit von 32 MiB).
- **Textlängen:** Maximal 5.000 Zeichen je Textfeld, maximal 50 Zeichen je Gerät, maximal 50 Geräte je Seite. Diese Obergrenzen sind eigene Entscheidungen, sie stehen nicht in der Spec.
- **Needed Space:** Fläche und Volumen optional. Eine Zahl muss `>= 0` sein, Komma und Punkt werden akzeptiert. Ungültige Eingaben ergeben 400.
- **Budget:** exakt `S`, `M`, `L`, `XL` oder leer. Alles andere ergibt 400.
- **Wer darf:** jeder angemeldete Nutzer mit Rolle `user` oder `admin`, gesperrte Konten nicht (Prüfung über `currentUser` aus F-001). Ohne Anmeldung 401.
- **Fehlschlag beim Speichern:** Schlägt die Firestore-Transaktion fehl, werden die bereits hochgeladenen Bilder wieder gelöscht (Muster aus `files.go`). Es bleiben keine verwaisten Objekte.
- **Frontend-Route:** `/ideas/new` (Erfassung), `/ideas/:id` (Darstellung). Die Pfade liegen innerhalb von `/app/` wie in F-005 beschrieben. Falls die SPA-Auslieferung die Pfade explizit auflistet (`spa_test.go`), werden die neuen Pfade ergänzt.

## Aufgaben

### T1 – Datenmodell und Validierung
- `ideas.go`: Typ `ideaDoc`, Typ `ideaInput` (JSON-Eingabe), Konstanten für Budget-Größen, Textlimits und Geräte-Limits.
- Funktionen `validateIdeaInput(in) (ideaDoc, error)` mit reinen Funktionen ohne Firestore: Budget, Space (Zahlen, `>= 0`), Textlängen, Geräteliste trimmen, Duplikate per `name_key` entfernen, `nameKey(name)`.
- Leere Eingabe ist gültig.
- Verweist auf: AC-002-2 (leeres Formular wird akzeptiert), AC-002-4 (Budget), AC-002-5 (Space als Zahlen).

### T2 – Bilder prüfen und ablegen
- `ideas_images.go`: `checkImage(data []byte) (contentType, ext string, err)` über `http.DetectContentType`; Anzahl- und Größenprüfung für die Liste der Uploads.
- Upload in den Bucket unter `ideas/<id>/...`, Rückgabe der `images`-Einträge. Löschfunktion für den Aufräumfall.
- Die Bildbytes werden vor dem Schreiben in Firestore vollständig geprüft. Bei jedem Fehler wird vorher nichts geschrieben.
- Verweist auf: AC-002-3 (mehr als 5, über 5 MB, anderes Format wird abgelehnt).

### T3 – Speichern und Abrufen (Endpoints `POST /api/ideas`, `GET /api/ideas/{id}`, Bildendpoint)
- Handler hinter der Anmeldeprüfung aus F-001 (`currentUser`), ohne Anmeldung 401, gesperrt 403.
- `POST /api/ideas`: Body-Limit setzen, `data` parsen, T1 validieren, T2 für die Bilder, dann Transaktion: Seite in `ideas` anlegen und Geräte in `equipment` upserten. Bei Fehler Bilder löschen.
- `GET /api/ideas/{id}`: Seite als JSON, 404 bei unbekannter ID.
- `GET /api/ideas/{id}/images/{n}`: Bild aus dem Bucket streamen mit dem gespeicherten Content-Type, 404 bei unbekanntem Index.
- Verweist auf: AC-002-1 (gespeichert und über Endpoint abrufbar), AC-002-7 (Besucher ohne Anmeldung wird abgewiesen).

### T4 – Geräte-Autocomplete (`GET /api/equipment`)
- Anmeldepflicht wie T3. `q` getrimmt und kleingeschrieben, Range-Query auf `name_key`, Limit 10, Antwort: Liste der Anzeigenamen.
- Leeres `q` liefert eine leere Liste (keine Vollauflistung).
- Verweist auf: AC-002-6 (Vorschläge aus bisher erfassten Geräten).

### T5 – Erfassungsformular (React)
- `frontend/src/ideas/IdeaForm.tsx`, Route `/ideas/new`. Alle Felder aus der Spec-Tabelle, englische Labels (Q-002-08).
- Budget als Auswahl S/M/L/XL mit einer Leerstellung. Needed Space als zwei Zahlenfelder (m², m³).
- Bilder: Mehrfachauswahl, vorab Prüfung auf Anzahl, Größe und Format. Fehler als Hinweis am Feld.
- Absenden per `fetch` als multipart an `POST /api/ideas` mit Cookie. Nach Erfolg Weiterleitung nach `/ideas/<id>`. Serverfehler werden angezeigt, Eingaben bleiben erhalten.
- Ohne Anmeldung Weiterleitung auf `/login` (Oberflächenseite von AC-002-7; die Abweisung selbst macht das Backend in T3).
- Verweist auf: AC-002-1 (Ablauf), AC-002-2 (leeres Formular wird gespeichert), AC-002-3 (Vorabprüfung), AC-002-4, AC-002-5.

### T6 – Geräte-Eingabe als Chips mit Autocomplete
- `frontend/src/ideas/EquipmentInput.tsx`: Chips, Eingabe mit Vorschlägen aus `GET /api/equipment` (verzögert, etwa 250 ms). Enter oder Komma übernimmt die Eingabe als Chip, auch wenn kein Vorschlag gewählt ist. Chips lassen sich entfernen.
- Duplikate (Groß-/Kleinschreibung egal) werden nicht als zweiter Chip übernommen.
- Verweist auf: AC-002-6 (Vorschlag für bekannte Geräte, neuer Chip für unbekannte).
- Abhängig von T4.

### T7 – Darstellung der Seite (React)
- `frontend/src/ideas/IdeaPage.tsx`, Route `/ideas/:id`. Lädt `GET /api/ideas/{id}`, zeigt alle Felder, Budget als Text, Space mit Einheiten m² und m³, Geräte als Liste, Bilder über den Bildendpoint.
- Fehlerzustände: 404 als eigene Meldung, 401 leitet auf `/login`.
- Verweist auf: AC-002-1 (Abruf der Inhalte).
- Abhängig von T3.

### T8 – Tests und Abnahme
- Go (Stil wie `files_test.go`, ohne Firestore und Bucket, Testnamen mit AC-Nummer nach F-001-Muster, z. B. `TestAC002_4_BudgetOnlyAcceptsSMLXL`): Validierung in T1, Bildprüfung in T2, Größenlimits, Anfragen ohne Anmeldung (401) über den Handler vor jedem Firestore-Zugriff.
- Transaktions- und Bucket-Pfade (T3, T4) mit Emulator, falls verfügbar; sonst manuell gegen das Projekt dokumentieren, inklusive Aufräumen bei Fehler.
- Frontend mit Vitest und React Testing Library: Formular (AC-002-2, -4, -5), Vorabprüfung der Bilder (AC-002-3), Chip-Eingabe (AC-002-6).
- Vorab: `go vet ./...`, `go test ./...`, im Verzeichnis `frontend/`: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.

## Reihenfolge

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T5 kann gegen den Vertrag aus T3 parallel entwickelt werden. T6 hängt an T4, T7 an T3.

## Abhängigkeiten zu anderen Features

- **F-001 Nutzerverwaltung:** `currentUser` (Rolle, Sperre) wird für alle Endpoints genutzt. F-001 ist committet (`def22d8`), der Arbeitsstand ist aber noch nicht sauber.
- **F-005 React-Frontend:** T5 bis T7 bauen auf `frontend/` und dessen Router auf. F-005 ist `plan-ready`, aber noch nicht umgesetzt. Die Umsetzung von T5 bis T7 setzt voraus, dass F-005 zuerst umgesetzt wird oder Routing und Build dort bereits stehen.
- **F-004 Prompt-Verwaltung / Seiten-Verwaltung:** Bearbeiten und Auflisten sind nicht Teil dieses Plans. Ein Endpoint zum Ändern der Bilder entsteht erst mit F-004.

## Offen (keine Rückfrage, nur zur Kenntnis)

- Die Grenzen für Textlänge und Geräteanzahl (T1) sind eigene Vorschläge. Sie können im Review geändert werden.
- Die Spec nennt das Limit von 5 MB je Bild. Ob F-004 ein eigenes Limit für nachträgliche Bilder braucht, ist offen.
