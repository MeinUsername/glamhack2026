# F-005 Wechsle das Frontend zu React – Implementierungsplan

Grundlage: `spec.md` (Umfang, Entscheidungen, Akzeptanzkriterien AC-005-1 bis AC-005-9). Eine eigene `acceptance.md` fehlt im Feature-Ordner; die Kriterien stehen in `spec.md`.
Bestand: Go-Function (`server.go`, `app.go`, `auth.go`, `files.go`), htmx-Seiten in `templates/` (home, login, register, dashboard, admin, layout, partials), Vue-App in `web/` (`App.vue`, `auth.js`, `main.js`), Build-Ausgabe in `static/app/`, `cloudbuild.yaml`, `README.md`.

## Vorbedingung

- **F-001 wird vor F-005 committet** (Antwort Q-005-08). F-005 baut auf den Dateien von F-001 auf (`admin.go`, `users.go`, `invitations.go`, `setup.go`, `templates/admin.html`, geänderte `templates/`). Ohne diesen Commit ist die Basis für die Umsetzung nicht stabil.
- Die Schnittstellen von F-001 stehen noch nicht in einer `interfaces.md` (Ordner `001-ein-nutzerverwaltung/` enthält nur `spec.md`, `acceptance.md`, `plan.md`). Die Vermerke `nutzt F-001` unten verweisen auf die Aufgaben aus dem Plan von F-001 (T1–T8).

## Festlegungen dieses Plans

Vom Nutzer bestätigt (Antworten auf die Annahmen in `spec.md`):

- **Verzeichnis `frontend/`** ersetzt `web/` (Q-005-02). `web/` wird entfernt (Q-005-09).
- **Umfang 1:1**: alle Seiten aus `templates/` und die Vue-App werden auf React portiert, ohne neue Funktionen (Q-005-06).
- **Build-Ausgabe**: `static/app/` bleibt eingecheckt und wird unter `/app/` ausgeliefert (Q-005-04).
- **Tailwind v4** mit `@tailwindcss/vite` (Q-005-05).
- **Tests**: Vitest und React Testing Library, dazu `tsc --noEmit` (Q-005-07).
- Die Pfade `/`, `/login`, `/register`, `/dashboard`, `/admin/users` bleiben erhalten (Q-005-04, AC-005-8).

Eigene Entscheidungen (nicht in der Spec):

- **Client-Routing mit React Router** (`react-router`). Das Go-Backend liefert für die Seitenpfade dieselbe `index.html` aus `static/app/` aus; die Seiten rendert React.
- **Vite-Basis `/app/`** (`base: '/app/'`), Build-Ausgabe `build.outDir = '../static/app'` mit `emptyOutDir: true`. Alte Dateien `static/app/main.js` und `static/app/auth.js` verschwinden dabei.
- **htmx-Fragmente entfallen.** Routen, die HTML-Fragmente liefern (`POST /invitations`, `POST /files` als Formular, Admin-Routen für Rollen und Sperre), werden durch JSON-Antworten ersetzt. Die bestehenden JSON-Routen bleiben erhalten.
- **Firebase-Konfiguration** wird aus der bisherigen Quelle übernommen (`web/src/auth.js` bzw. `templates/layout.html`, vor T3 prüfen). Kein Firebase-Emulator im Projekt; Tests mocken das Firebase-SDK.

## Aufgaben

### T1 – Projektgerüst `frontend/` (AC-005-1, AC-005-2)
- `frontend/` mit `package.json`, `tsconfig.json`, `vite.config.ts` (Basis `/app/`, Ausgabe `../static/app`), `index.html`, `src/main.tsx`.
- React, TypeScript, Vite, Tailwind v4 (`@tailwindcss/vite`), React Router.
- Skripte: `build` (`tsc --noEmit && vite build`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`).
- Vitest, `@testing-library/react`, `jsdom`.
- `frontend/node_modules/` und `frontend/dist/` in `.gitignore` aufnehmen.
- Verweist auf: AC-005-1 (`npm install` und `npm run build` ohne Fehler), AC-005-2 (React, TypeScript, Tailwind).

### T2 – Go-Backend: SPA-Auslieferung und JSON-Admin-API (AC-005-8, AC-005-6)
- `server.go`: `//go:embed templates` und die Template-Map (`pages`, `template.ParseFS`) entfallen. `GET /app/` bleibt (`http.StripPrefix` auf `static/app`).
- Neuer Handler liefert `static/app/index.html` für `GET /{$}`, `/login`, `/register`, `/dashboard` und `/admin/users` aus. `/admin/users` bleibt hinter `requireAdmin`.
- Htmx-Routen ersetzen: `POST /invitations` (Fragment) entfällt zugunsten von `POST /api/invitations` (existiert). `POST /files` (Formular) entfällt zugunsten von `POST /api/files`.
- Admin-JSON hinter `requireAdmin`: `GET /api/admin/users`, `POST /api/admin/users/{uid}/role`, `POST /api/admin/users/{uid}/disabled`. Antworten als JSON, Fehler mit 403 JSON. Die Routen `POST /admin/users/{uid}/...` (htmx) werden entfernt.
- Upload-Grenze 1 MB bleibt serverseitig in `files.go` erhalten und wird getestet.
- Verweist auf: AC-005-8 (alte URLs antworten mit React-Oberfläche, keine 404), AC-005-6 (Server-Seite: Nicht-Admin erhält 403).
- nutzt F-001: Nutzerverwaltung (`requireAdmin`, `setUserRole`, `setUserDisabled`, `apiCreateInvitation`).

### T3 – Anmeldung mit Firebase und Session (AC-005-3)
- `frontend/src/auth/`: Firebase-SDK-Initialisierung, `signInWithEmailAndPassword`, ID-Token an `POST /session`, danach Weiterleitung auf `/dashboard`.
- Abmelden: `POST /logout`, danach `/login`.
- Fehlermeldung bei gesperrtem Konto («Dieses Konto ist gesperrt.», Antwort 403 von `POST /session`).
- Verweist auf: AC-005-3.
- nutzt F-001: Nutzerverwaltung (T5: Sperre in `createSession`).
- Abhängig von T1.

### T4 – Registrierung mit Einladungslink (AC-005-4)
- `frontend/src/pages/Register.tsx`: liest `?invite=`, prüft den Link vorab mit `GET /api/invitations/{token}`, legt das Konto über Firebase an und sendet `POST /register` mit `{idToken, invite}`.
- Ungültiger, abgelaufener oder verwendeter Link: Hinweis «Der Einladungslink ist ungültig oder abgelaufen.».
- Verweist auf: AC-005-4 (Rolle `user`, Ablehnung wie F-001).
- nutzt F-001: Nutzerverwaltung (T3: `POST /register`, `GET /api/invitations/{token}`).
- Abhängig von T1, T2.

### T5 – Dashboard: Dateien und Einladungslink (AC-005-5)
- `frontend/src/pages/Dashboard.tsx`: Dateiliste (`GET /api/files`), Upload (`POST /api/files`, multipart), Download-Link `GET /files/{id}` (nur Besitzer, serverseitig geprüft).
- Clientseitige Prüfung der Größe (1 MB) zeigt die Ablehnung früh an. Die serverseitige Prüfung bleibt maßgeblich.
- Schaltfläche «Einladungslink erzeugen» (`POST /api/invitations`), zeigt Link und Ablaufdatum.
- Verweist auf: AC-005-5.
- nutzt F-001: Nutzerverwaltung (T2: Einladungslink) und die Rolle aus `GET /api/me`.
- Abhängig von T1, T2.

### T6 – Admin-Oberfläche `/admin/users` (AC-005-6)
- `frontend/src/pages/AdminUsers.tsx`: Tabelle mit E-Mail, Rolle (Auswahl), Status (aktiv/gesperrt), Schaltfläche Sperren/Entsperren. Daten aus T2.
- Schutzregeln aus F-001 (eigene Rolle und Sperre nicht änderbar, letzter Admin geschützt) zeigt die Oberfläche als Fehlermeldung aus der Antwort des Servers an. Die Regel liegt im Server.
- Navigation zu `/admin/users` nur für Admins sichtbar.
- Verweist auf: AC-005-6 (Admin vergibt Rollen und sperrt; Nicht-Admin sieht die Seite nicht).
- nutzt F-001: Nutzerverwaltung (T4, T5).
- Abhängig von T1, T2.

### T7 – Startseite und Layout (AC-005-8, AC-005-2)
- `frontend/src/components/Layout.tsx`: Navigation und Abmelden-Schaltfläche, übernimmt die Inhalte aus `templates/layout.html` und `templates/partials.html`.
- `frontend/src/pages/Home.tsx` nach `templates/home.html`.
- Tailwind-Klassen ersetzen die bisherigen CSS-Regeln. Das Aussehen bleibt nahe am Bestand (1:1 Verhalten, Q-005-06).
- Verweist auf: AC-005-8 (Startseite `/` ist React), AC-005-2 (Tailwind aktiv).
- Abhängig von T1.

### T8 – Vue-Bestand und htmx-Templates entfernen (AC-005-2)
- `web/` löschen (Q-005-09). Erst nach T3–T7, damit keine Funktion verloren geht.
- `templates/` löschen, sobald T2–T7 die Seiten übernommen haben.
- `static/app/` durch `npm run build` neu erzeugen; die Vue-Dateien `main.js` und `auth.js` verschwinden.
- Prüfen: außerhalb von `frontend/` keine `.vue`-Dateien mehr.
- Verweist auf: AC-005-2 (keine Vue-Dateien außerhalb von `frontend/`).
- Abhängig von T2–T7.

### T9 – Build, Deploy und Dokumentation (AC-005-9, AC-005-1)
- `cloudbuild.yaml`: Schritt wechselt von `dir: web` auf `dir: frontend` (`npm ci --no-audit --no-fund && npm run build`). Die Kommentarzeilen zu `web/` werden angepasst.
- `.gcloudignore`: `frontend/node_modules/` ausschließen, damit der Deploy-Upload klein bleibt.
- `README.md`: neuer Pfad `frontend/`, Befehle für Build, Typprüfung und Tests.
- Verweist auf: AC-005-9 (Schritte bauen aus `frontend/`, Anleitung nennt den Pfad), AC-005-1.
- Abhängig von T1, T8.

### T10 – Tests und Abnahme (AC-005-7, AC-005-8)
- Go: `go vet ./...` und `go test ./...`. Neue Tests: SPA-Routen liefern 200 mit `index.html` (AC-005-8), Admin-JSON liefert 403 für Nicht-Admin (AC-005-6), Upload über 1 MB wird abgelehnt.
- Frontend (Vitest und RTL, Firebase gemockt): Login-Flow mit Weiterleitung (AC-005-3), Registrierung mit ungültigem Link (AC-005-4), Upload-Hinweis über 1 MB (AC-005-5), Admin-Navigation nur für Admin (AC-005-6).
- `npm run typecheck` und `npm test` in `frontend/` (AC-005-7).
- Jeder Testname trägt die AC-Nummer, z. B. `AC-005-3 leitet nach Login auf /dashboard`.
- Manuelle Abnahme gegen das Projekt: alte URLs (`/`, `/login`, `/register`, `/dashboard`, `/admin/users`, `/app/`) aufrufen und das Ergebnis dokumentieren (AC-005-8). Nicht automatisierbar ohne Firebase-Projekt.
- Verweist auf: AC-005-7, AC-005-8.
- Abhängig von T1–T9.

## Reihenfolge

T1 → T2 → (T3, T4, T5, T6, T7 parallel möglich) → T8 → T9 → T10.

- T3 und T4 hängen an T1 und T2 (Routen), T5 und T6 an T2 (JSON-API).
- T8 erst, wenn alle Seiten portiert sind.
- T10 zuletzt.

## Abhängigkeiten zu anderen Features

- **F-001 Nutzerverwaltung** (rangniedriger, Vorbedingung): `requireAdmin`, `POST /session` mit Sperre, `POST /register` mit Einladung, `GET /api/invitations/{token}`, `POST /api/invitations`, Admin-Rollen und Sperre. Ein `interfaces.md` von F-001 fehlt; sie sollte vor T2 entstehen.

## Offen

- Antworten auf Q-005-10 bis Q-005-13 (Ausgabe `static/app/`, Tailwind v4, 1:1, Vitest/RTL) stehen aus. Der Plan folgt den Empfehlungen, bis der Nutzer anders entscheidet. Q-005-10 bis -13 sind nicht blockierend.
- Die manuelle Abnahme in T10 braucht ein Firebase-Projekt (oder eine Freigabe, den Test ohne echten Login durchzuführen).
