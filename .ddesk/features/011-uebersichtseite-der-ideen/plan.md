# F-011 Übersichtseite der Ideen – Implementierungsplan

Grundlage: `spec.md` (Ziel, Umfang, D1 bis D5, Akzeptanzkriterien 1 bis 5). Die Akzeptanzkriterien haben keine ddesk-IDs; hier als AK1 bis AK5 in der Reihenfolge der Spec.

Bestand: F-002 (`GET /api/ideas/{id}`, Bilder), F-006 (`BasketButton`, `useBasket`, `basket.ts`), F-007 (Übersetzungen), F-001 (`useMe`, Anmeldung).

## Festlegungen dieses Plans

- **Antworten:** Q-011-01 (Kaufstatus = Korb), Q-011-02 (Einkaufen auf der Übersicht) sind eingereicht. Q-011-03 (eigene Seite), Q-011-05 (alle eingeloggten Rollen) sind als Entwurf gespeichert und passen zur Spec (D4, D3). Q-011-04 hat einen Entwurf «Titel, Beschreibung, Bild-Vorschau als Gallery, Kaufstatus». Er ist nicht eingereicht und weicht von D5 ab. Dieser Plan folgt D5 (Titel, Bild-Vorschau, Kaufstatus). Die Abweichung steht in `abweichungen.md` und ist offen.
- **Listen-Endpoint fehlt:** F-002 bietet nur `GET /api/ideas/{id}`. Die Übersicht braucht `GET /api/ideas`. Dieser Endpoint kommt in F-011 dazu, minimal: ID, Titel, Anzahl der Bilder. Die Reihenfolge ist neueste zuerst (`created_at`).
- **Route:** `/ideas` (eigene Seite, D4), Go-Route `GET /ideas` liefert die React-Seite.
- **Anmeldung:** Nicht eingeloggte Besucher werden zu `/login` geleitet (AK5, D3).
- **Kaufstatus:** `BasketButton` aus F-006 wiederverwenden; er zeigt «In den Korb» oder «gekauft» (D1, D2).

## Aufgaben

### T1 – Listen-Endpoint
- `ideas.go`: `apiListIdeas` für `GET /api/ideas`, Anmeldung wie bei den anderen Endpoints (401 ohne Anmeldung).
- Antwort: Array von `{id, title, imageCount}`.
- Verweist auf: AK1 (alle Ideen).

### T2 – Übersichtsseite
- `frontend/src/ideas/IdeasList.tsx`, Route `/ideas`: je Idee Titel als Link auf `/ideas/:id`, Bild-Vorschau (erstes Bild, falls vorhanden), `BasketButton`.
- Leere Liste: Hinweis. Ladefehler: Hinweis.
- Anonymer Besucher: Weiterleitung auf `/login`.
- Verweist auf: AK1, AK2, AK3, AK5.
- Abhängig von T1 und F-006.

### T3 – Navigation
- Link «Ideen» im Header für angemeldete Nutzer.

### T4 – Tests
- Go: 401 für `GET /api/ideas`; Route in `spa_test.go`.
- Vitest: `IdeasList.test.tsx` mit AK1 (Liste mit Titel und Vorschau), AK2 (Klick legt in den Korb, gekauft), AK3 (bereits im Korb: kein erneuter Kauf), AK4 (nach Entfernen aus dem Korb wieder «In den Korb»), AK5 (ohne Anmeldung zu `/login`).

## Reihenfolge

T1 → T2 → T3 → T4.
