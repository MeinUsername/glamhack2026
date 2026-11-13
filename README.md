# glamhack2026

Kleine Hello-World-App: Login mit Firebase Auth (E-Mail/Passwort), Datei-Upload (max. 1 MB) in
einen Cloud-Storage-Bucket und eine Referenz in Firestore. Einladungslinks und eine Admin-Seite
für Rollen und Sperren (F-001).

## Aufbau

- **Backend:** eine Go-Function (Cloud Run functions, Runtime `go127`). Einstieg ist `Handler` in
  `app.go`. Routing in `server.go`.
  - `auth.go`: Firebase Admin SDK prüft das ID-Token und setzt ein Session-Cookie (HttpOnly, Secure).
  - `files.go`: Upload mit 1-MB-Grenze, Download nur für den Besitzer, JSON-API.
  - `users.go`, `invitations.go`, `admin.go`: Rollen, Einladungslinks, Admin-API.
- **Frontend:** React-App mit TypeScript und Tailwind CSS in `frontend/`. Vite baut nach
  `static/app/`, die Go-Function liefert die Seiten `/`, `/login`, `/register`, `/dashboard` und
  `/admin/users` mit derselben `index.html` aus. Der Client-Router zeigt die Seite.
  - `frontend/src/auth/`: Firebase JS SDK, Session über `POST /session`, Registrierung über `POST /register`.
  - `frontend/src/pages/`: Login, Registrierung, Dashboard (Dateien, Einladung), Admin-Seite.
- **Build-Ausgabe** `static/app/` ist eingecheckt, weil der Deploy kein npm ausführt.
- **Daten:** Firestore-Collection `files` mit Referenz (`owner_id`, `name`, `size`, `object`, ...).
  Die Datei selbst liegt im Bucket. Benutzer verwaltet Firebase Auth, nicht die Datenbank.
- **Nutzerverwaltung:** Collection `users` (Dokument-ID = UID) mit Rolle (`admin` | `user`)
  und Sperre (`disabled`). Collection `invitations` (Dokument-ID = SHA-256 des Einladungstokens,
  einmalig, 7 Tage). Rollen liest jeder Request frisch aus Firestore.
  - Einladungslink: Dashboard «Einladungslink erzeugen» oder `POST /api/invitations`.
  - Admin-API: `GET /api/admin/users`, `POST /api/admin/users/{uid}/role`,
    `POST /api/admin/users/{uid}/disabled`. Die Seite `/admin/users` nur für Admins.

## Ersten Admin einrichten

Einmalig pro Projekt, nachdem das Konto registriert ist. Das Kommando legt `system/setup` an und
bricht bei einem zweiten Aufruf ab.

```sh
go run ./cmd/setup-admin -project glamhack-hack-2026 admin@example.ch
```

## Lokal bauen und testen

```sh
cd frontend && npm install && npm run build && cd ..  # Typprüfung, dann erzeugt static/app
cd frontend && npm run typecheck && npm test && cd ..  # tsc --noEmit, Vitest
go vet ./... && go test ./...
```

`npm run dev` startet den Vite-Entwicklungsserver (unter `/app/`).

## Deploy

Der Build läuft in Cloud Build (`cloudbuild.yaml`): `npm ci` und `npm run build` in `frontend/`,
dann `gcloud run deploy`. Lokal vor dem Deploy `npm run build` ausführen, damit `static/app`
aktuell ist.

```sh
gcloud run deploy glamhack-app --source . --function Handler --base-image go127 \
  --region us-central1 --project glamhack-hack-2026 --allow-unauthenticated \
  --memory 256Mi --min-instances 0 --max-instances 2 --timeout 60 \
  --set-env-vars PROJECT_ID=glamhack-hack-2026,BUCKET_NAME=glamhack-hack-2026-files \
  --set-build-env-vars GOFLAGS=-buildvcs=false
```

Die App läuft unter `https://glamhack-app-966336370599.us-central1.run.app`, also ohne Präfix,
damit die Links `/login`, `/dashboard` und `/admin/users` stimmen. `/app/` leitet auf `/` weiter.

Die Firebase-Web-Konfiguration in `frontend/.env.production` ist öffentlich. Sicherheit kommt aus
Firebase Auth und der Prüfung im Backend.
