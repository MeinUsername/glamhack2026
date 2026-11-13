- [entworfen] `POST /api/invitations` nur für Admins (requireAdmin); Antwort `{"link"}`, ohne `expiresAt`
  Warum: Nur Admins erzeugen Einladungen (D8, AC-012-10), und ohne Ablauf (D5) entfällt das Feld.
- [entworfen] `POST /register` ohne `invite` antwortet 403 `"Registrierung nur mit Einladungslink."`
  Warum: Admins kommen nur über Einladungslinks in die App (Ziel, Q-012-11).
- [entworfen] `GET /api/files`, `POST /api/files`, `GET /files/{id}` nur für Admins (requireAdmin)
  Warum: Datei-Upload bleibt auf `/dashboard` und ist Admin-Bereich (Q-012-12).
- [entworfen] `GET /api/ideas`, `POST /api/ideas`, `GET /api/ideas/{id}`, `GET /api/ideas/{id}/images/{n}`, `GET /api/equipment` ohne Anmeldung
  Warum: Die gesamte Nutzung ist öffentlich (D1, AC-012-1, AC-012-2).
- [entworfen] `PUT /api/ideas/{id}` (multipart: `data` mit `keepImages`, `images` neu, höchstens 5 Bilder insgesamt), 404 bei unbekannter ID
  Warum: Bearbeiten von Ideen ist Teil des Umfangs (Q-012-13, AC-012-2).
- [entworfen] `GET /ideas/{id}/edit` liefert die React-Seite (`serveApp`)
  Warum: Die Route der Bearbeitungsseite muss der Server kennen, sonst gibt es 404 beim direkten Aufruf.
- [entworfen] `POST /session` bleibt unverändert, auch für Nicht-Admins
  Warum: Bestehende Nicht-Admin-Konten melden sich weiter an (D2, AC-012-12).
