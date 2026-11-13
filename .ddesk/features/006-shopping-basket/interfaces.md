# Schnittstellen F-006

- `frontend/src/basket/basket.ts`: `readBasket(): string[]`, `addToBasket(id): string[]` (genau einmal), `removeFromBasket(id): string[]` (Reihenfolge bleibt), `isInBasket(id)`, Schlüssel `hackathon-basket` im localStorage (JSON-Array von Idee-IDs)
- `frontend/src/basket/useBasket.ts`: Hook `useBasket()` mit `ids`, `has(id)`, `add(id)`, `remove(id)`; liest den Korb beim Mounten
- `frontend/src/basket/BasketButton.tsx`: Prop `ideaId`; «In den Korb» oder die Markierung «gekauft»; wird von F-011 wiederverwendet
- Route `GET /basket` (React-Seite, Go-Funktion `serveApp`), öffentlich, kein Redirect
- Keine neuen API-Endpunkte; die Korbseite nutzt `GET /api/ideas/{id}` und `GET /api/ideas/{id}/images/0` (F-002)
