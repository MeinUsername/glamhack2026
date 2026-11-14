# F-020 Idee-Seite editierbar machen – Implementierungsplan

Grundlage: `spec.md` (D1–D3) und `acceptance.md` (AC-020-1 bis AC-020-6). Es gibt kein `docs/feature-workflow.md` und kein `ARCHITECTURE.md` im Projekt; der Plan stützt sich auf den Code.

## Bestand (Stand Code)

- Bearbeiten existiert seit F-012: Route `/ideas/:id/edit` (`IdeaEdit` in `frontend/src/ideas/IdeaForm.tsx`), `PUT /api/ideas/{id}` (`apiUpdateIdea` in `ideas_update.go`) ohne Login. Das Formular ist mit allen Feldern vorbelegt (`draftFrom`), bestehende Bilder sind als Checkboxen «behalten» (`keep`), neue Bilder kommen über den Datei-Dialog.
- Die Idee-Seite hat nur einen Textlink «Bearbeiten» (`IdeaPage.tsx:51`). Die Übersicht (`IdeasList.tsx`) hat keinen Bearbeiten-Einstieg.
- **Lücke 1 (AC-020-5):** `imageProblem` im Frontend prüft nur die neu gewählten Dateien (max. 5). Hat eine Idee 5 Bilder und man wählt ein weiteres, lässt das Formular es durch. Erst der Server lehnt ab, mit der englischen Meldung «At most 5 images can be uploaded.» (`ideas_update.go:98`), unabhängig von der gewählten Sprache.
- **Lücke 2:** In `IdeaForm.test.tsx`, `IdeaPage.test.tsx` und `IdeasList.test.tsx` gibt es keine Tests für den Bearbeiten-Pfad. Auch Go-seitig gibt es keinen Test für `apiUpdateIdea` als Ganzes (nur `selectKeptImages`, `public_test.go:100`).

## Festlegungen

- **D1:** Bestehendes Formular, kein Inline-Bearbeiten. **D2:** Kein Login, keine Rechteprüfung, wie bisher. **D3:** Keine Änderungshistorie; es ist nichts zu bauen, die Änderung überschreibt die Idee (`writeIdea`), und der Code tut das schon.
- Die Bilder-Grenze wird im Frontend aus «behaltene + neue Bilder» gerechnet. Serverseitig bleibt die Prüfung massgeblich.
- Neue Texte kommen in alle vier Sprachdateien (`de`, `en`, `fr`, `it` unter `frontend/src/i18n/locales/`).

## Aufgaben

### T1 – Bearbeiten-Button auf der Idee-Seite
- `IdeaPage.tsx`: Den Textlink durch einen deutlich sichtbaren Button ersetzen, der als `Link` zu `/ideas/{id}/edit` führt (Klasse `button` aus `ui.ts`, neben dem Warenkorb-Button platziert). Sichtbarer Text bleibt `ideas.edit`.
- `IdeaPage.test.tsx`: Test, dass der Link «Bearbeiten» mit `href="/ideas/i1/edit"` vorhanden ist.
- Verweist auf: AC-020-1.
- Abhängig von keiner anderen Aufgabe.

### T2 – Bearbeiten-Einstieg in der Übersicht
- `IdeasList.tsx`: In jeder Karte neben `BasketButton` einen Link `ideas.edit` zu `/ideas/{row.id}/edit` ergänzen (kleiner, sekundärer Stil, z. B. `linkButton`). Keine API-Änderung nötig, die Zeile hat die `id`.
- `IdeasList.test.tsx`: Test, dass jede Karte einen Bearbeiten-Link auf die eigene Idee hat.
- Verweist auf: AC-020-2.
- Abhängig von keiner anderen Aufgabe.

### T3 – Bildlimit im Bearbeiten-Formular mit verständlicher Meldung
- `rules.ts`: `imageProblem(files, t, existing = 0)` um die Zahl der behaltenen Bilder erweitern. Gilt `existing + files.length > MAX_IDEA_IMAGES`, kommt eine Meldung, die auch den Bestand nennt (neuer Schlüssel `rules.tooManyWithExisting`: «Es sind höchstens {{max}} Bilder möglich; {{kept}} bleiben, du kannst noch {{free}} hinzufügen.», bei `free` 0 sinngemäss «Entferne zuerst ein Bild»).
- `IdeaForm.tsx`: Beim Auswählen, beim Absenden und beim Umschalten der «behalten»-Checkboxen mit `keep.length` prüfen (Fehler neu berechnen, wenn `keep` oder `images` sich ändern). Der Speichern-Button ist bei Überschreitung deaktiviert (bestehendes `imageError`-Verhalten).
- Server: Die Meldung in `ideas_update.go:98` bleibt Absicherung; sie wird auf eine verständliche Form gebracht (Deutsch, wie die übrigen `userError`-Texte des Servers, z. B. `errBadImageRef`) und nennt die Grenze. Kontrolle, ob `ideas.go:342` gleich zu behandeln ist.
- Neue Texte in `de.ts`, `en.ts`, `fr.ts`, `it.ts`.
- Tests: `IdeaForm.test.tsx` (Idee mit 5 Bildern, 1 Datei gewählt → Meldung sichtbar, Speichern deaktiviert; Bild abwählen → Meldung weg). `rules`-Test für `existing`.
- Verweist auf: AC-020-5.
- Abhängig von keiner anderen Aufgabe.

### T4 – Test: Formular vorbelegt, Bilder ändern, speichern
- `IdeaForm.test.tsx` (mit `renderAt`/`routeFetch` aus `src/test/helpers`):
  - `/ideas/i1/edit` laden: alle Felder (auch F-014-Felder) und die vorhandenen Bilder sind vorbelegt (AC-020-3).
  - Ein Bild abwählen, eine Datei hinzufügen, speichern: `PUT /api/ideas/i1` mit `keepImages` der verbleibenden Indizes und der neuen Datei in `images`; danach Navigation auf `/ideas/i1` (AC-020-4, Frontend-Teil).
- Falls das Formular dafür angepasst werden muss (z. B. Beschriftung der Checkboxen), geschieht das hier minimal.
- Verweist auf: AC-020-3, AC-020-4.
- Abhängig von T3 (gleiche Testdatei, gleiche Formularlogik).

### T5 – Go-Test: Ändern über die API, ohne Login
- Neuer Test in `ideas_update_test.go` (bzw. `public_test.go`, je nach vorhandenem Test-Setup mit Firestore-Emulator/Fake; Vorgehen wie in `ideas_test.go`): `PUT /api/ideas/{id}` ohne Session-Cookie ändert Felder, entfernt ein Bild und hängt eines an; ein anschliessendes `GET /api/ideas/{id}` liefert genau die verbleibenden und neuen Bilder. Eine sechste Datei bei 5 behaltenen Bildern ergibt 400 mit der Meldung aus T3 und lässt die Idee unverändert.
- Lässt sich der Test mit dem vorhandenen Setup nicht ohne Emulator schreiben, wird er auf die reinen Funktionen beschränkt (`selectKeptImages` plus Grenzprüfung, herausgelöst als kleine Funktion `checkImageCount(kept, new)`), und die Abnahme von AC-020-4/6 erfolgt über T6.
- Verweist auf: AC-020-4, AC-020-5, AC-020-6.
- Abhängig von T3 (Wortlaut der Meldung).

### T6 – Abnahme im laufenden Stand
- Lokal starten (Skill `run`/README), ohne Login: Übersicht → «Bearbeiten», Idee-Seite → «Bearbeiten»; Feld ändern, ein Bild entfernen, ein neues hinzufügen, speichern; Idee-Seite zeigt die geänderten Daten. Idee mit 5 Bildern: sechstes hinzufügen wird abgelehnt.
- `go test ./...` und `npm test` (Frontend) sowie `npm run build`/Typecheck laufen grün.
- Verweist auf: AC-020-1 bis AC-020-6.
- Abhängig von T1–T5.

## Abdeckung der Kriterien

| AC | Aufgaben |
|---|---|
| AC-020-1 | T1, T6 |
| AC-020-2 | T2, T6 |
| AC-020-3 | T4, T6 |
| AC-020-4 | T4, T5, T6 |
| AC-020-5 | T3, T5, T6 |
| AC-020-6 | T5, T6 |

## Reihenfolge

T1, T2, T3 sind unabhängig und können parallel laufen. Danach T4 und T5 (beide nach T3), zuletzt T6.

## Nicht Teil dieses Plans

Inline-Bearbeiten, Reihenfolge der Bilder, Titelbild, Drag&Drop, höhere Bildlimits, Rechteprüfung, Änderungshistorie (siehe `spec.md`).
