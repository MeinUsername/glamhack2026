# API – Umsetzung F-009

- [entworfen] Übermittlung als Array `categories` im JSON-Teil `data` von `POST /api/ideas`.
  Warum: Die Auswahl gehört zur Seite und wird mit ihr gespeichert, ohne eigenen Endpoint.
- [neu] Ungültiger Schlüssel ergibt 400 mit der Meldung `Unknown category "<wert>".`
  Warum: Validierung im Backend ist maßgeblich; die Meldung nennt den abgelehnten Wert.
- [neu] `GET /api/ideas/{id}` liefert `categories` immer als Array, auch für Seiten ohne Feld.
  Warum: Die Oberfläche muss nicht zwischen `null` und `[]` unterscheiden.
