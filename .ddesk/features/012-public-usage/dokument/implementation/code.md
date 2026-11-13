# Code – Umsetzung F-012

- [neu] `initialadmin.go`: Entscheidung `planInitialAdmin` (rein), `ensureInitialAdmin` und `makeAdmin`.
  Warum: Der Initialadmin entsteht beim Start; das Passwort wird nur beim Neuanlegen gelesen.
- [neu] `ideas_update.go`: Bearbeiten (`apiUpdateIdea`), Auswahl der Bilder (`selectKeptImages`), gemeinsame Schreibfunktion (`writeIdea`).
  Warum: Eigene Datei, damit `ideas.go` nur die Anmeldepflicht verliert.
- [geändert] `invitations.go`: Einladungen ohne Ablauf, `usable` prüft nur die Einlösung, Einlösung vergibt die Rolle `admin`.
- [geändert] `users.go`: `newAdminUser`.
- [geändert] `auth.go`: Registrierung nur mit Einladung; die Anmeldeseite leitet Admins zum Dashboard und alle anderen zu `/`.
- [geändert] `admin.go`: Adapter `anyUser` für Handler ohne Rollenbedarf.
- [geändert] `server.go`: Routen für Dateien, Einladungen, Bearbeiten und die Seite `/ideas/{id}/edit`; Aufruf von `ensureInitialAdmin`.
- [geändert] Frontend: `Layout` (keine Anmelde-/Registrierlinks, Dateien und Benutzer nur für Admins), `Home`, `Login` (Weiterleitung nach Rolle, kein Registrierlink), `Register` (Hinweis ohne Link), `Dashboard` (Nicht-Admins sehen «Nur für Admins.»), `IdeaForm` (Bearbeitungsmodus), `IdeaPage` (Bearbeiten-Link), `IdeasList` (öffentlich), `App` (Route).
- [geändert] Übersetzungen in de, en, fr, it. Die fr- und it-Texte sind Entwürfe.
- [geändert] `README.md`: Abschnitt Initialadmin, Konfiguration, Einladungen.
