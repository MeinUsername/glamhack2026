# Code – Plan F-003

- [entworfen] `frontend/src/prompt/render.ts`: `renderPrompt(template, ideas, locale)`, reine Funktion ohne React und Storage.
  Warum: Testbar ohne F-006, F-007 und F-008, die noch nicht umgesetzt sind.
- [entworfen] `frontend/src/prompt/PromptGenerator.tsx`: Vorschau, Download und Kopieren, eingebettet in die Korbseite aus F-006.
  Warum: Q-003-13 legt den Generator auf die Korbseite, nicht auf eine eigene Seite.
- [entworfen] `server.go`: Registrierung von `GET /api/master-prompt` hinter `guardUser`.
  Warum: Der Lesezugriff gilt für alle eingeloggten Rollen (Q-003-10), `guardAdmin` wäre zu eng.
- [entworfen] `admin.go` oder neue Datei: `guardUser`, analog zu `guardAdmin`, prüft nur den Login.
  Warum: Muster der bestehenden Guards wiederverwenden, statt eine zweite Auth-Logik zu bauen.
- [entworfen] Abhängigkeit zu F-006, F-007 und F-008 über die Schnittstellen im Plan (`useBasket`, `useLocale`, `currentMasterPrompt`).
  Warum: Q-003-09 = 2, die Umsetzung wartet auf die drei Features.
