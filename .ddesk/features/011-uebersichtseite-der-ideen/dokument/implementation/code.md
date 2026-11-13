# Code – Umsetzung F-011

- [neu] `ideas.go`: `apiListIdeas` mit `OrderBy("created_at", Desc)`; Dokumente, die nicht lesbar sind, werden übersprungen und geloggt.
- [neu] `frontend/src/ideas/IdeasList.tsx`: Liste mit Titel-Link, Vorschau (nur bei Bildern), `BasketButton`; Weiterleitung für Besucher ohne Anmeldung.
- [geändert] `App.tsx`: Route `/ideas`. `server.go`: Go-Route `GET /ideas` und `GET /api/ideas`.
- [geändert] `Layout.tsx`: Link «Ideen» für angemeldete Nutzer.
- [neu] Übersetzungsschlüssel `nav.ideas`, `ideas.list.*` in allen Wörterbüchern.
