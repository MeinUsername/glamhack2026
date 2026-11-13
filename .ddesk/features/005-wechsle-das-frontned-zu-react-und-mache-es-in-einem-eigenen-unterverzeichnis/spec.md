---
id: F-005
title: Wechsle das Frontned zu React und mache es in einem eigenen Unterverzeichnis
status: done
---

# F-005 Wechsle das Frontned zu React und mache es in einem eigenen Unterverzeichnis

## Beschreibung

Das Frontend wird von Vue bzw. htmx auf React umgestellt. Der neue Frontend-Code liegt in einem
eigenen Unterverzeichnis `frontend/` und nutzt React, TypeScript und Tailwind CSS.

Ausgangsbeschreibung des Nutzers:

- React
- Typescript
- Tailwind als CSS Tooling

## Ziel

Alle Oberflächen der App laufen als React-App mit TypeScript und Tailwind. Der Quellcode liegt in
`frontend/`, getrennt vom Go-Backend. Das Verhalten für Nutzer bleibt gleich.

## Umfang

Enthalten:

- Neues Verzeichnis `frontend/` mit React, TypeScript und Tailwind CSS (Build mit Vite).
- Umstellung aller bisher serverseitig gerenderten Seiten aus `templates/` (Layout, Login,
  Registrierung, Dashboard, Admin-Bereich `/admin/users`, Partials) auf React.
- Umstellung der bisherigen Vue-App (`web/`) auf die neue React-App.
- Firebase-Login im Frontend (Firebase JS SDK), Session über `POST /session` wie bisher.
- Go-Backend liefert JSON-API und die React-Auslieferung; die Templates-Auslieferung entfällt.
- Anpassung von `cloudbuild.yaml`, `README.md` und Build-Schritten, sodass der Build im neuen
  Verzeichnis läuft.

Nicht enthalten:

- Neue fachliche Funktionen. Login, Registrierung per Invitation, Datei-Upload (max. 1 MB),
  Download nur für Besitzer und Admin-Rollen (F-001) werden 1:1 übernommen.
- Änderungen am Datenmodell in Firestore oder am Cloud Storage.
- Server-Side Rendering.

## Entscheidungen

Vom Nutzer beantwortet:

- **Q-005-01 — Umfang der Oberflächen:** Alle Seiten, auch die htmx-Templates in `templates/`,
  werden auf React umgestellt. Nicht nur die Vue-App.
- **Q-005-02 — Name des Unterverzeichnisses:** `frontend/`. Das bestehende `web/` wird dadurch
  ersetzt.

Nicht beantwortet, Empfehlung als Annahme übernommen (vom Nutzer bitte bestätigen):

- **Q-005-03 — Altes Vue-Verzeichnis:** `web/` wird nach der Migration entfernt.
- **Q-005-04 — Build-Ausgabe:** `static/app/` bleibt eingecheckt und wird unter `/app/`
  ausgeliefert, wie bisher. Die Pfade `/login`, `/register`, `/dashboard` und `/admin/users`
  bleiben unverändert, damit die bestehenden Links stimmen.
- **Q-005-05 — Tailwind-Version:** Tailwind v4 mit Vite-Plugin.
- **Q-005-06 — Funktionsumfang:** 1:1 portieren, keine neuen Funktionen.
- **Q-005-07 — Tests:** Vitest und React Testing Library im Frontend, zusätzlich Typprüfung
  (`tsc --noEmit`).

Abhängigkeit:

- Der Arbeitsstand von F-001 (Nutzerverwaltung) ist noch nicht committet. Die Dateien `admin.go`,
  `users.go`, `invitations.go`, `setup.go`, `templates/admin.html` und die Änderungen an
  `templates/` gehören dazu. F-005 baut darauf auf. Vor der Umsetzung muss klar sein, ob F-001
  zuerst committet wird.

## Akzeptanzkriterien

- **AC-005-1** Gegeben das Repository / Wenn `frontend/` mit `npm install` und `npm run build`
  gebaut wird / Dann entsteht die Ausgabe in `static/app/` ohne Fehler.
- **AC-005-2** Gegeben das Repository nach der Umstellung / Wenn man `frontend/` prüft / Dann ist
  der Code in React und TypeScript geschrieben, Tailwind ist aktiv, und es gibt keine
  Vue-Dateien mehr außerhalb von `frontend/`, da `web/` entfernt ist.
- **AC-005-3** Gegeben ein Besucher ohne Konto / Wenn er sich auf `/login` mit E-Mail und
  Passwort anmeldet / Dann setzt das Backend das Session-Cookie über `POST /session`, und er landet
  auf `/dashboard`.
- **AC-005-4** Gegeben ein Besucher mit Invitationslink / Wenn er sich auf `/register`
  registriert / Dann wird das Konto mit Rolle User angelegt, und ein abgelaufener oder benutzter
  Link wird abgelehnt (wie F-001).
- **AC-005-5** Gegeben ein angemeldeter Nutzer / Wenn er eine Datei bis 1 MB hochlädt / Dann
  erscheint sie im Dashboard. Eine größere Datei wird abgelehnt. Download ist nur für den
  Besitzer möglich.
- **AC-005-6** Gegeben ein Admin / Wenn er auf `/admin/users` Rollen vergibt oder Nutzer sperrt /
  Dann gilt die Änderung. Ein Nutzer ohne Admin-Rolle sieht die Seite nicht und kann die Aktion
  nicht ausführen.
- **AC-005-7** Gegeben die fertige Umstellung / Wenn `go vet ./... && go test ./...`,
  `npm run typecheck` und `npm test` in `frontend/` laufen / Dann sind alle Befehle erfolgreich.
- **AC-005-8** Gegeben die fertige Umstellung / Wenn die Seiten über die alten URLs (`/`,
  `/login`, `/register`, `/dashboard`, `/admin/users`, `/app/`) aufgerufen werden / Dann
  antworten sie mit der React-Oberfläche, und es gibt keine 404 durch fehlende Routen.
- **AC-005-9** Gegeben das Repository / Wenn `cloudbuild.yaml` und `README.md` geprüft werden /
  Dann bauen die Schritte aus `frontend/`, und die Anleitung nennt den neuen Pfad.

## Offene Punkte

- Reihenfolge zu F-001: Erst committen, dann F-005 starten (Empfehlung).
- Die Entscheidungen Q-005-03 bis Q-005-07 gelten als Annahmen, bis der Nutzer sie bestätigt.
