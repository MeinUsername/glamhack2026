# glamhack2026

Kleine Hello-World-App: Login mit Firebase Auth (E-Mail/Passwort), Datei-Upload (max. 1 MB) in
einen Cloud-Storage-Bucket und eine Referenz in Firestore.

## Aufbau

- **Backend:** eine Go-Function (Cloud Run functions, Runtime `go127`). Einstieg ist `Handler` in
  `app.go`. Routing und Templates liegen in `server.go`.
  - `auth.go`: Firebase Admin SDK prüft das ID-Token und setzt ein Session-Cookie (HttpOnly, Secure).
  - `files.go`: Upload mit 1-MB-Grenze, Download nur für den Besitzer, JSON-API.
- **Seiten:** htmx-Seiten aus `templates/` (Layout, Login, Registrierung, Dashboard).
- **Login-Modul:** `web/src/auth.js` nutzt das Firebase JS SDK, schickt das ID-Token an `POST /session`
  und öffnet dann das Dashboard. Gebaut nach `static/app/auth.js`.
- **Vue-App:** Quellcode in `web/`, gebaut nach `static/app/main.js`, ausgeliefert unter `/app/`.
- **Build-Ausgabe** `static/app/` ist eingecheckt, weil der Deploy kein npm ausführt.
- **Daten:** Firestore-Collection `files` mit Referenz (`owner_id`, `name`, `size`, `object`, ...).
  Die Datei selbst liegt im Bucket. Benutzer verwaltet Firebase Auth, nicht die Datenbank.
- **Nutzerverwaltung (F-001):** Collection `users` (Dokument-ID = UID) mit Rolle (`admin` | `user`)
  und Sperre (`disabled`). Collection `invitations` (Dokument-ID = SHA-256 des Einladungstokens,
  einmalig, 7 Tage). Rollen liest jeder Request frisch aus Firestore.
  - Einladungslink: Dashboard «Einladungslink erzeugen» oder `POST /api/invitations`.
  - Admin-Seite `/admin/users`: Rollen vergeben, sperren und entsperren.

## Ersten Admin einrichten

Einmalig pro Projekt, nachdem das Konto registriert ist. Das Kommando legt `system/setup` an und
bricht bei einem zweiten Aufruf ab.

```sh
go run ./cmd/setup-admin -project glamhack-hack-2026 admin@example.ch
```

## Lokal bauen und testen

```sh
cd web && npm install && npm run build && cd ..   # erzeugt static/app
go vet ./... && go test ./...
```

## Deploy

Vor dem Deploy `npm run build` ausführen, damit `static/app` aktuell ist.

```sh
gcloud run deploy glamhack-app --source . --function Handler --base-image go127 \
  --region us-central1 --project glamhack-hack-2026 --allow-unauthenticated \
  --memory 256Mi --min-instances 0 --max-instances 2 --timeout 60 \
  --set-env-vars PROJECT_ID=glamhack-hack-2026,BUCKET_NAME=glamhack-hack-2026-files \
  --set-build-env-vars GOFLAGS=-buildvcs=false
```

Die App läuft unter `https://glamhack-app-966336370599.us-central1.run.app`, also ohne Präfix,
damit die Links `/login`, `/dashboard` und `/app/` stimmen.

Die Firebase-Web-Konfiguration in `web/.env.production` ist öffentlich. Sicherheit kommt aus
Firebase Auth und der Prüfung im Backend.
