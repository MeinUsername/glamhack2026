---
id: F-029
---

# F-029 Plan

Ursache (aus dem Code bestätigt): `apiIdeaImage` liefert `/api/ideas/{id}/images/{n}` mit `Cache-Control: private, max-age=3600`. Nach dem Ersetzen steht das neue Bild wieder an einem Index (z. B. 0), die URL bleibt gleich, der Browser nimmt das alte Bild aus dem Cache. Das Löschen abgewählter Objekte geschieht bereits (`apiUpdateIdea`: `s.deleteObjects(ctx, removed)` nach dem Speichern). Dafür fehlt nur ein Test.

Lösung: Version = der zufällige Teil des Objektnamens (`ideas/<id>/<random>.<ext>`, erzeugt in `storeIdeaImages`). Er ändert sich bei jedem neuen Upload, bleibt für unveränderte Bilder stabil. Die URL lautet `/api/ideas/{id}/images/{n}?v=<version>`. Der Server ignoriert `v`, der Browser behandelt die URL aber als neu. Kein Datenmodell- und Migrationsaufwand, `max-age` bleibt (D2).

## Aufgaben

- **T1 Version im Backend ableiten** (AC-029-2)
  In `ideas_images.go` Hilfsfunktion `imageVersion(object string) string`, die den Dateinamen ohne Pfad und Endung liefert (`ideas/x/abc.png` → `abc`). `imageView` in `ideas.go` bekommt das Feld `Version string \`json:"version"\``, gefüllt in der Schleife über `d.Images`. `apiIdeaImage` bleibt unverändert (Index-Route, `Cache-Control` bleibt).

- **T2 Übersichtszeile mit Cover-Version** (AC-029-2)
  `ideaSummary` bekommt `CoverVersion string \`json:"coverVersion,omitempty"\`` (Version des ersten Bildes, leer ohne Bild). In `apiListIdeas` füllen. Die bestehende Prüfung AC-014-6 (Schlüssel der Übersichtszeile) um `coverVersion` ergänzen, wenn ein Bild vorhanden ist.

- **T3 Frontend: versionierte URLs** (AC-029-1, AC-029-2, AC-029-6)
  - `types.ts`: `IdeaImage.version: string`.
  - Gemeinsamer Helfer `imageUrl(ideaId, n, version)` (z. B. `frontend/src/ideas/imageUrl.ts`), liefert `/api/ideas/${id}/images/${n}?v=${version}`.
  - `IdeaPage.tsx`, `IdeaForm.tsx` (Liste bestehender Bilder) und `Basket.tsx` (erstes Bild) nutzen ihn mit `idea.images[n].version`.
  - `IdeasList.tsx`: `coverVersion` in das Row-Interface, URL für Bild 0 über den Helfer.

- **T4 Formular-Verhalten prüfen** (AC-029-1, AC-029-4, AC-029-5)
  In `IdeaForm.tsx` prüfen, dass Abwählen aller Bilder ohne Upload speicherbar ist (`keepImages: []`) und dass nach dem Speichern die Detailseite neu geladen wird (kein veralteter Zustand aus dem Cache der Seite). Nur bei Abweichung anpassen.

- **T5 Backend-Tests** (AC-029-2 bis AC-029-5)
  In `ideas_test.go`:
  - `imageVersion` liefert den Zufallsteil; zwei verschiedene Objektnamen ergeben verschiedene Versionen (AC-029-2).
  - Ansicht der Idee (Funktion, die `imageView` baut) enthält `version` je Bild und ändert sich, wenn das Objekt wechselt, bleibt gleich für unverändertes (AC-029-2, AC-029-4).
  - `selectKeptImages`: abgewähltes Bild landet in `removed` (Basis für das Löschen im Bucket, AC-029-3), behaltene bleiben in der Reihenfolge von `keep`, neue werden in `apiUpdateIdea` hinten angehängt (AC-029-4); leeres `keep` ergibt `kept` leer, alle in `removed` (AC-029-5).
  - Das Löschen im Bucket (AC-029-3) und die Cache-Header-Auslieferung brauchen Bucket/Firestore. Falls die Tests dafür keinen Fake haben, nur über `selectKeptImages` abdecken und im Plan-Abschluss vermerken. Sonst mit vorhandenem Test-Setup ergänzen.

- **T6 Frontend-Tests** (AC-029-1, AC-029-2, AC-029-5, AC-029-6)
  - `IdeaForm.test.tsx`: Bearbeiten mit einem Bild, abwählen, Datei hochladen, speichern: Payload `keepImages: []` plus eine Datei (AC-029-1). Alle abwählen ohne Upload speichert (AC-029-5). Bestehende Bilder im Formular haben `src` mit `?v=<version>`; bei geänderter Version im neu geladenen Idea-Objekt ändert sich `src` (AC-029-6).
  - `IdeaPage.test.tsx`: `img`-`src` enthält `?v=` mit der Version; neue Version ergibt neue URL (AC-029-1, AC-029-2).
  - `IdeasList.test.tsx`: bestehende Erwartung `/api/ideas/a/images/0` auf `?v=<coverVersion>` anpassen.
  - `Basket.test.tsx`: Bild-URL mit Version, falls dort geprüft.
  - Testdaten/Fixtures mit `images` um `version` ergänzen.

- **T7 Verifikation** (alle AC)
  `go test ./...` und `npm test` im Ordner `frontend` laufen grün, ebenso Typecheck/Build des Frontends (neues Pflichtfeld `version`). Manuell: Idee mit Bild öffnen (Bild wird gecacht), bearbeiten, Bild ersetzen, speichern: Detailseite zeigt sofort das neue Bild.

## Reihenfolge

T1 und T2 zuerst (Backend), dann T3 (Frontend, hängt von der API ab), T4 nach T3, T5 nach T1/T2, T6 nach T3/T4, T7 zuletzt.

## Nicht betroffen

Limits (5 Bilder, 5 MB, Formate), Reihenfolge-Änderung, Master-Prompt, `apiIdeaImage`-Route und -Cache-Header, Firestore-Datenmodell (`imageDoc`).
