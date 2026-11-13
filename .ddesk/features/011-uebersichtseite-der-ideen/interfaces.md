# Schnittstellen F-011

- Route `GET /api/ideas`: Anmeldung nötig (401 sonst); Antwort Array von `{id, title, imageCount}`, neueste zuerst
- Route `GET /ideas`: React-Seite (`IdeasList`), ohne Anmeldung Weiterleitung auf `/login`
- React-Komponente `IdeasList` (`frontend/src/ideas/IdeasList.tsx`); nutzt `BasketButton` aus F-006 für «In den Korb» und «gekauft»
- Go-Funktion `apiListIdeas` (`ideas.go`)
