# Tests – Umsetzung F-006

- [neu] `basket/basket.test.ts`: AK2 (genau einmal), AK3 (Entfernen, Reihenfolge), AK4 (localStorage), kaputtes JSON und Nicht-Arrays.
- [neu] `basket/BasketButton.test.tsx`: AK1 (Klick legt ab und markiert), AK2 (keine erneute Auswahl).
- [neu] `pages/Basket.test.tsx`: AK3 (Entfernen auf der Korbseite), AK4 (neues Rendern zeigt den Korb), AK5 (404 entfernt, 500 bleibt mit Fehler), AK6 (Korbseite ohne Anmeldung, kein Redirect).
- [neu] `spa_test.go`: `/basket` liefert die React-Seite ohne Sitzung.
- Nicht getestet: die manuelle Prüfung im Browser (Plan T6, Löschen einer Idee per Firestore-Konsole).
