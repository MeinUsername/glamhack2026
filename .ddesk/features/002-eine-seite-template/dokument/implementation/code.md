# Code – Umsetzung F-002

- [neu] `ideas.go`: Typen `ideaDoc`, `ideaInput`, `ideaView`; `validateIdeaInput`, `normalizeEquipment`, `parseArea`, `nameKey`; Handler für Erfassen, Abruf, Bild und Autocomplete.
  Warum: Validierung ist ohne Firestore testbar, die Handler folgen dem Muster aus `files.go`.
- [neu] `ideas_images.go`: `checkImage` (Erkennung über die Bytes, WebP zusätzlich über den RIFF-Header), Upload und Aufräumen.
  Warum: Die Bildprüfung läuft vor jedem Schreibvorgang; bei Fehler wird wieder gelöscht.
- [neu] Die Seite-ID wird vor dem Bild-Upload vergeben (`NewDoc`).
  Warum: Der Objektpfad `ideas/<id>/…` braucht die ID, bevor die Transaktion läuft.
- [neu] Geräte-Katalog wird in derselben Transaktion gepflegt; nur fehlende Einträge werden angelegt.
  Warum: Die Transaktion liest zuerst alle Katalogeinträge, dann schreibt sie (Firestore-Regel).
- [neu] Bei Fehler in der Transaktion werden die Bilder gelöscht.
  Warum: Keine verwaisten Objekte, wie im Plan festgelegt.
- [geändert] `server.go`: Routen für `/ideas/new`, `/ideas/{id}` und die vier API-Endpoints ergänzt.
  Warum: Der Plan verlangt die Routen; es gab bis dahin keine.
- [neu] Frontend: `frontend/src/ideas/IdeaForm.tsx`, `IdeaPage.tsx`, `EquipmentInput.tsx`, `rules.ts`; Routen in `App.tsx`; Typen `Idea` in `types.ts`.
  Warum: Umsetzung der Tasks T5 bis T7 nach Plan.
- [neu] Die Vorabprüfung der Bilder im Frontend und die Prüfung im Backend haben dieselben Grenzen (5 Bilder, 5 MB, JPG/PNG/WebP).
  Warum: Früher Hinweis für den Nutzer, Backend bleibt maßgeblich.
