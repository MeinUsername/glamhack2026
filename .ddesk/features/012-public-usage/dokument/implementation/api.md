# API – Umsetzung F-012

- [neu] `PUT /api/ideas/{id}` bearbeitet eine Idee ohne Anmeldung. Bestehende Bilder bleiben über `keepImages` (0-basierte Indizes); entfernte Bilder werden nach dem Speichern gelöscht.
  Warum: AC-012-2 und Q-012-13. Die Auswahl der Bilder ist eine reine Funktion (`selectKeptImages`) und ist getestet.
- [geändert] `GET /api/ideas`, `GET /api/ideas/{id}`, `GET /api/ideas/{id}/images/{n}`, `GET /api/equipment`, `POST /api/ideas`: die Anmeldepflicht entfällt.
  Warum: D1. `created_by` bleibt leer, wenn niemand angemeldet ist.
- [geändert] `GET /api/files`, `POST /api/files`, `GET /files/{id}` hängen an `requireAdmin`.
  Warum: T4, Dateien sind nur für Admins.
- [geändert] `POST /api/invitations` nur für Admins; die Antwort enthält nur noch `link`.
  Warum: D5 und D8. Der Ablauf entfällt.
- [geändert] `POST /register` ohne Einladungslink wird mit 403 abgelehnt, bevor ein Konto bleibt.
  Warum: Q-012-11.
