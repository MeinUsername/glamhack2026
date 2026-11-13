# API – Plan F-003

- [entworfen] `GET /api/master-prompt` für alle eingeloggten Rollen. Antwort `{ version, text, createdAt }`, 404 ohne Version, 401 ohne Login.
  Warum: Der Generator läuft im Browser und braucht den Text zur Laufzeit (Q-003-10, Antwort 1).
- [entworfen] Keine neue Schreib-Schnittstelle. Der Generator speichert nichts auf dem Server.
  Warum: Fertige Prompts werden nicht gespeichert (Spec, Nicht enthalten).
