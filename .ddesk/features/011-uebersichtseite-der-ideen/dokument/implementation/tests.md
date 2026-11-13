# Tests – Umsetzung F-011

- [neu] `frontend/src/ideas/IdeasList.test.tsx`: AK1 (Titel, Vorschau nur bei Bildern, Kaufstatus), AK2 (Klick auf der Übersicht legt in den Korb), AK3 (Idee im Korb ohne erneute Auswahl), AK4 (entfernte Idee wieder ohne Kaufstatus), AK5 (Weiterleitung ohne Anmeldung).
- [neu] `ideas_test.go`: `GET /api/ideas` ohne Anmeldung ist 401.
- [neu] `spa_test.go`: `/ideas` liefert die React-Seite.
- Nicht getestet: das Sortieren im Firestore (neueste zuerst) gegen echte Daten.
