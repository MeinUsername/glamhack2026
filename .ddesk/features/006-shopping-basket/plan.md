# F-006 Shopping Basket – Implementierungsplan

Grundlage: `spec.md` (Ziel, Umfang, Entscheidungen D1–D5, Akzeptanzkriterien 1–6). Die Akzeptanzkriterien haben noch keine ddesk-IDs; hier als AK1 bis AK6 in der Reihenfolge der Spec referenziert.

Bestand: React-Frontend in `frontend/` (Router in `frontend/src/App.tsx`, Header in `frontend/src/components/Layout.tsx`, Idee-Seite in `frontend/src/ideas/IdeaPage.tsx`). Go-Server in `server.go` mit expliziter Liste der SPA-Routen (`/dashboard`, `/ideas/new`, `/ideas/{id}`); `spa_test.go` prüft die Auslieferung. Kein Backend-Speicher für den Korb.

## Festlegungen dieses Plans

- **Rückfragen (bestätigt):**
  - **Q-006-06 = Korb öffentlich.** Der Korb ist für Besucher ohne Anmeldung sichtbar, wie in F-012 («Korb (F-006)» gehört zur öffentlichen Nutzung). Damit gelten D3 und AK6 aus der Spec nicht mehr: der Korb leitet nicht zur Anmeldung weiter.
  - **Q-006-07 = Entfernen nur auf der Korbseite.** Der Umfang gilt, D2 (Entfernen auch in der Ideenliste) entfällt.
- **Spec ist danach zu korrigieren** (nicht Teil dieses Plans): D2 und D3 sowie AK6 passen nicht mehr zu den Antworten. Der Plan folgt den Antworten.
- **Rein im Frontend.** Der Korb liegt im Localstorage des Browsers (D5). Keine neuen Go-Funktionen, keine neuen Firestore-Collections, keine neuen API-Routen. Eine Ausnahme ist die Route `/basket` in `server.go` (T4).
- **Speicherschlüssel:** `hackathon-basket`. Inhalt: JSON-Array von Idee-IDs, ohne Duplikate, in Einfügereihenfolge. Ungültiges JSON oder ein Nicht-Array wird als leerer Korb gelesen, ohne Fehler.
- **Idee-Daten auf der Korbseite:** Der Korb speichert nur IDs. Titel und Bilder holt die Korbseite je ID über `GET /api/ideas/{id}` (F-002, Schnittstelle in `.ddesk/features/002-eine-seite-template/interfaces.md`). Dadurch zeigt sie gelöschte Ideen als 404 (D4).
- **Ideenliste:** Die Liste aller Ideen ist F-011 (noch nicht umgesetzt). F-006 setzt die Schaltfläche «In den Korb» und die Markierung «gekauft» zunächst auf der Idee-Seite `/ideas/:id` um. Die Komponente `BasketButton` ist so gebaut, dass F-011 sie in der Übersicht wiederverwendet. Die Ideenliste in AK1 und AK2 wird bis dahin durch die Idee-Seite abgedeckt. *Annahme, bitte bestätigen.*
- **Abhängigkeit F-012:** `GET /api/ideas/{id}` verlangt heute Anmeldung (401). Damit die Korbseite für Besucher ohne Anmeldung funktioniert, muss F-012 diesen Endpoint öffentlich machen. Ohne F-012 zeigt die Korbseite für anonyme Besucher den Fehlerzustand «Idee nicht ladbar» statt der Idee. Dieser Plan ändert den Endpoint nicht.

## Aufgaben

### T1 – Korbspeicher (ohne React)
- `frontend/src/basket/basket.ts`: `readBasket(): string[]`, `addToBasket(id)`, `removeFromBasket(id)`, `isInBasket(id)`, Schlüssel `hackathon-basket`.
- `addToBasket` legt eine ID nur an, wenn sie fehlt; ein zweiter Aufruf ändert nichts.
- `removeFromBasket` entfernt die ID und lässt die übrigen Einträge in ihrer Reihenfolge.
- Ungültiges JSON, Nicht-Array oder Nicht-String-Einträge werden als leerer bzw. gefilterter Korb gelesen.
- Keine Abhängigkeit zum Login (D5).
- Verweist auf: AK2 (genau einmal), AK3 (Entfernen), AK4 (bleibt beim Neuladen, Localstorage).

### T2 – Hook `useBasket`
- `frontend/src/basket/useBasket.ts`: liefert `ids`, `has(id)`, `add(id)`, `remove(id)` als React-State, der mit dem Localstorage synchron bleibt.
- Der Hook liest den Korb beim Mounten neu, damit die Idee-Seite und die Korbseite denselben Stand zeigen.
- Abhängig von T1.
- Verweist auf: AK1 (Idee liegt nach Wahl im Korb), AK3 (Entfernen wirkt auf die Markierung).

### T3 – Schaltfläche und Markierung auf der Idee-Seite
- `frontend/src/basket/BasketButton.tsx` mit Prop `ideaId`. Nicht im Korb: Schaltfläche «In den Korb». Im Korb: Markierung «gekauft» und keine erneute Wahl (D1, Eindeutigkeit).
- In `frontend/src/ideas/IdeaPage.tsx` nach dem Titel einbinden.
- Die Schaltfläche ist für alle Besucher sichtbar (Q-006-06); sie erscheint auch ohne Anmeldung.
- Verweist auf: AK1 (Schaltfläche legt in den Korb, Markierung), AK2 (zweite Wahl ändert nichts).
- Abhängig von T2.

### T4 – Korbseite und Navigation
- `frontend/src/pages/Basket.tsx`, Route `/basket` in `frontend/src/App.tsx`.
- Go: `m.HandleFunc("GET /basket", serveApp)` in `server.go`, dazu der Pfad in `spa_test.go` neben `/dashboard` und `/admin/users`.
- Die Korbseite lädt je ID `GET /api/ideas/{id}` und zeigt Titel und Bild-Vorschau (erstes Bild über `/api/ideas/{id}/images/0`), je Eintrag einen Link auf `/ideas/:id` und die Aktion «Entfernen» (AK3).
- Leerer Korb: Hinweis «Der Korb ist leer.»
- Kein Redirect auf `/login` (Q-006-06).
- Link «Korb» im Header in `frontend/src/components/Layout.tsx`, für alle Besucher sichtbar.
- Nutzt F-002: `GET /api/ideas/{id}`, `GET /api/ideas/{id}/images/{n}`, Route `/ideas/:id`.
- Abhängig von T2; Anmeldefreiheit hängt an F-012 (siehe oben).

### T5 – Gelöschte Ideen (D4)
- Beim Öffnen der Korbseite: Antwort 404 für eine ID entfernt sie stillschweigend aus dem Korb (`removeFromBasket`) und zeigt sie nicht an.
- Andere Fehler (5xx, Netzwerk) lassen den Eintrag im Korb stehen und zeigen «Die Idee konnte nicht geladen werden.» an dem Eintrag.
- Nutzt F-002: 404 bei unbekannter ID.
- Verweist auf: AK5 (gelöschte Idee verschwindet aus Anzeige und Korb).
- Abhängig von T4.

### T6 – Tests und Abnahme
- Vitest + React Testing Library, Muster wie bestehende `*.test.tsx` in `frontend/src`:
  - `basket.test.ts` (T1): Eindeutigkeit, Entfernen mit erhaltener Reihenfolge, kaputtes JSON → leerer Korb.
  - `BasketButton.test.tsx` (T3): AK1 (Klick → «gekauft»), AK2 (zweiter Klick ändert nichts).
  - `Basket.test.tsx` (T4, T5): AK3 (Entfernen auf der Korbseite und Markierung entfällt), AK4 (Korb bleibt nach erneutem Rendern, Localstorage), AK5 (404 → Eintrag weg; 500 → Eintrag bleibt), AK6 (Korbseite ohne Anmeldung, kein Redirect).
  - Mit `fetch`-Mock, nicht mit echtem Backend.
- Go: `spa_test.go` um `/basket` erweitern; `go vet ./...` und `go test ./...`.
- Frontend im Verzeichnis `frontend/`: `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
- Manuell im Browser: Korb legen, neu laden, Korbseite öffnen, Idee löschen (in F-002 nicht vorhanden; Löschen per Firestore-Konsole oder Test-Eintrag entfernen).
- Abhängig von T1–T5.

## Reihenfolge

T1 → T2 → T3 → T4 → T5 → T6. T3 und T4 können nach T2 parallel laufen.

## Offene Punkte

- Die Ideenliste (F-011) ist nicht Teil dieses Plans; `BasketButton` wird dort wiederverwendet.
- F-012 muss `GET /api/ideas/{id}` für Besucher ohne Anmeldung öffnen, sonst zeigt die Korbseite für anonyme Besucher keine Idee.
- Spec D2, D3 und AK6 sind nach den Antworten zu aktualisieren.
