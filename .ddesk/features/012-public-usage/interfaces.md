# Schnittstellen F-012

- Route `PUT /api/ideas/{id}`: ohne Anmeldung; multipart mit Feld `data` (wie beim Anlegen, zusätzlich `keepImages`) und `images`; 200 `{id}`, 404 unbekannte ID.
- Routen `GET /api/ideas`, `GET /api/ideas/{id}`, `GET /api/ideas/{id}/images/{n}`, `GET /api/equipment`, `POST /api/ideas`: ohne Anmeldung.
- Route `GET /ideas/{id}/edit`: React-Seite (`IdeaEdit`), ohne Anmeldung.
- Routen `GET /api/files`, `POST /api/files`, `GET /files/{id}`: nur Admins.
- Route `POST /api/invitations`: nur Admins; 201 `{link}` (kein `expiresAt`).
- Einlösung eines Einladungslinks (`POST /register` mit `invite`): Rolle `admin`.
- `POST /register` ohne `invite`: 403 `Registrierung nur mit Einladungslink.`
- Go-Funktion `ensureInitialAdmin(ctx)` (`initialadmin.go`), beim Start in `newServer` aufgerufen.
- Konfiguration: `INITIAL_ADMIN_EMAIL` (Standard `glamhack@x99.ch`), `INITIAL_ADMIN_PASSWORD` (nur beim Neuanlegen).
- React-Komponenten: `IdeaEdit` und `IdeaEditor` (`frontend/src/ideas/IdeaForm.tsx`); `Layout` ohne Anmelde-/Registrierlinks.
