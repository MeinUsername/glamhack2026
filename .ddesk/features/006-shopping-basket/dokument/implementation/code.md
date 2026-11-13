# Code – Umsetzung F-006

- [neu] `frontend/src/basket/basket.ts`: Speicher im localStorage; kaputtes JSON, Nicht-Arrays und Nicht-Strings ergeben einen leeren oder gefilterten Korb.
  Warum: Plan T1 und Q-006-06 (Korb ohne Login).
- [neu] `frontend/src/basket/useBasket.ts`: React-State, der beim Mounten aus dem Speicher liest.
  Warum: Idee- und Korbseite zeigen denselben Stand.
- [neu] `frontend/src/basket/BasketButton.tsx`: Schaltfläche oder Markierung «gekauft».
  Warum: Wiederverwendung in F-011.
- [neu] `frontend/src/pages/Basket.tsx`: je ID ein Eintrag mit eigenem Laden; 404 entfernt den Eintrag stillschweigend (D4), andere Fehler lassen ihn stehen.
  Warum: Plan T4 und T5.
- [geändert] `IdeaPage.tsx`: `BasketButton` nach dem Titel.
- [geändert] `Layout.tsx`: Link «Korb» für alle Besucher.
- [geändert] `App.tsx`: Route `/basket`.
- [geändert] `server.go`: `GET /basket` liefert die React-Seite ohne Redirect.
- [neu] Übersetzungsschlüssel `nav.basket`, `basket.*` in allen vier Wörterbüchern.
