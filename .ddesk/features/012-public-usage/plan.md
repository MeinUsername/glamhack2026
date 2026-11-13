# F-012 Public Usage – Implementierungsplan

Grundlage: `spec.md` (Ziel, Umfang, Entscheidungen D1–D8) und `acceptance.md` (AC-012-1 bis AC-012-13). Die Kriterien sind hier mit ihrer ddesk-ID referenziert.

Bestand (Stand Code): Go-Function in `app.go`, Routing in `server.go`. Login und Session in `auth.go`, Einladungen in `invitations.go`, Rollen und Sperren in `users.go`, Admin-Guard in `admin.go`, Dateien in `files.go`, Seiten (Ideen) in `ideas.go` und `ideas_images.go`. Frontend in `frontend/src/`: Layout mit Header-Links in `components/Layout.tsx`, Seiten in `pages/`, Ideen-Seiten in `ideas/`, Texte in `i18n/locales/` (de, en, fr, it).

## Festlegungen dieses Plans

- **Q-012-09 (Initialadmin-Passwort):** Das Passwort kommt aus der Umgebungsvariable `INITIAL_ADMIN_PASSWORD` (Secret Manager). Sie wird nur gelesen, wenn der Account neu angelegt wird. Bestehende Accounts werden nicht geändert.
- **Q-012-10 (Rolle beim Einladungslink):** Wer einen Einladungslink einlöst, erhält die Rolle `admin`. AC-001-4 (Rolle `user`) gilt für F-012 nicht mehr.
- **Q-012-11 (`/register`):** Registrierung ist nur mit Einladungslink möglich. Ohne Link lehnt der Server ab, und die Seite zeigt den Hinweis statt des Formulars.
- **Q-012-12 (Dateien):** Der Datei-Upload (F-001) bleibt auf `/dashboard` und ist nur für Admins erreichbar.
- **Q-012-13 (Bearbeiten):** Bearbeiten von Ideen ist eigene Aufgabe (T6 und T8) in diesem Plan.
- **Konfiguration des Initialadmins:** Standard ist `glamhack@x99.ch`, überschreibbar über `INITIAL_ADMIN_EMAIL`. Anlegen beim ersten Aufruf der Function (`newServer` läuft in `initOnce`). Ist der Account schon da, wird nur die Rolle `admin` gesetzt; die Sperre bleibt unverändert.
- **Anonyme Seiten:** `created_by` ist leer, wenn niemand angemeldet ist. Das ist die Folge von D1.
- **Login von Nicht-Admins:** Die Anmeldung funktioniert wie bisher (AC-012-12). Ohne Admin-Rolle gibt es nur keinen Zugriff auf den Admin-Bereich (AC-012-5). Nach dem Login geht ein Nicht-Admin auf `/`, ein Admin auf `/dashboard`.
- **Begriffe:** «Seiten» aus der Spec sind die Ideen-Seiten aus F-002 (Collection `ideas`).
- **Kein Rate-Limit (D7):** Es wird nichts gebaut, AC-012-13 ist durch Nichtstun erfüllt.
- **Abhängigkeit für F-006:** Die Korbseite braucht `GET /api/ideas/{id}` ohne Anmeldung. T5 liefert das.
- **Übersicht (F-011):** `GET /api/ideas` und die Seite `/ideas` werden in T5 und T8 öffentlich gemacht. F-011 selbst ist nicht Teil dieses Plans.
- **Export und Import (F-010), Mehrsprachigkeit (F-007):** Nicht Teil dieses Plans. Die Routen von F-010 müssen bei ihrer Umsetzung öffentlich sein.
- **Spec-Hinweis:** Die Spec hat 13 Kriterien, die Vorgabe sind drei bis acht je Feature. Das spricht dafür, das Feature zu schneiden. Der Plan folgt den 13 Kriterien.

## Aufgaben

### T1 – Initialadmin beim Start anlegen
- Neue Datei `initialadmin.go`: Konstante `defaultInitialAdminEmail = "glamhack@x99.ch"`. Lesen von `INITIAL_ADMIN_EMAIL` (Überschreiben) und `INITIAL_ADMIN_PASSWORD`.
- Funktion `(s *server) ensureInitialAdmin(ctx) error`:
  - Firebase-Account zur E-Mail suchen (`GetUserByEmail`). Fehlt er und ist das Passwort gesetzt, Account mit `CreateUser` anlegen.
  - Users-Dokument: fehlt es, mit Rolle `admin` anlegen. Ist es da, nur `role = admin` setzen. `disabled` bleibt unverändert.
  - Fehlt der Account und das Passwort, nur `log.Printf` und `nil` zurückgeben, damit die App startet.
- Aufruf in `newServer` (`app.go`/`server.go`) nach der Initialisierung des Auth-Clients. Fehler werden geloggt, nicht zurückgegeben.
- Verweist auf: AC-012-3 (Account existiert beim Start), AC-012-4 (Initialadmin hat Admin-Rechte).

### T2 – Einladungslinks: Admin-only, einmalig, ohne Ablauf
- `invitations.go`: `newInvitation` schreibt kein `expires_at` mehr. `invitationDoc.usable(now)` prüft nur `UsedAt == nil`. Das Feld `ExpiresAt` bleibt im Struct, damit alte Dokumente lesbar sind, wird aber ignoriert.
- `redeemInvitation` legt das Users-Dokument mit `Role = roleAdmin` an (`newUser` mit Rolle überschreiben oder eigene Hilfsfunktion `newAdminUser(email)`).
- `apiCreateInvitation`: Antwort nur noch `{"link": ...}`. Feld `expiresAt` entfällt.
- `server.go`: `POST /api/invitations` in `s.requireAdmin(...)` wrappen.
- Nutzt F-001: `invitations.go`, `users.go` (`newUser`, `roleAdmin`), `admin.go` (`requireAdmin`).
- Verweist auf: AC-012-7 (einmalig nutzbar), AC-012-8 (kein Ablauf), AC-012-9 (zweite Nutzung abgelehnt), AC-012-10 (Nicht-Admin kann keinen Link erzeugen), AC-012-11 (zwei Admins, beide Links gültig).
- Abhängig von keiner anderen Aufgabe.

### T3 – Registrierung nur mit Einladung, Login-Weiterleitung
- `auth.go` `register`: Ist `body.Invite` leer, `discardNewAccount` aufrufen und mit 403 `"Registrierung nur mit Einladungslink."` antworten.
- `auth.go` `loginPage`: Admin → Weiterleitung auf `/dashboard`, Nicht-Admin → auf `/`.
- `createSession` bleibt unverändert, damit bestehende Nicht-Admin-Konten sich wie bisher anmelden können.
- Nutzt F-001: `auth.go` (`register`, `createSession`, `loginPage`).
- Verweist auf: AC-012-5 (Nicht-Admin hat keinen Admin-Zugriff, Teil 1), AC-012-12 (Anmeldung bestehender Konten unverändert).
- Abhängig von T2 (Einlösung setzt Rolle admin).

### T4 – Dateien und Dashboard nur für Admins
- `server.go`: `GET /api/files`, `POST /api/files` und `GET /files/{id}` in `s.requireAdmin(...)` wrappen. Der Eigentümer-Check in `download` bleibt.
- `GET /dashboard` bleibt Seite. Anonyme Besucher gehen weiter auf `/login` (bestehende Weiterleitung in `dashboard`).
- Nutzt F-001: `files.go`, `admin.go` (`requireAdmin`).
- Verweist auf: AC-012-5 (Nicht-Admin erhält keinen Zugang zum Admin-Bereich, Teil 2).
- Abhängig von keiner anderen Aufgabe.

### T5 – Ideen-API ohne Anmeldung
- `ideas.go`: In `apiCreateIdea`, `apiGetIdea`, `apiIdeaImage`, `apiEquipment` und `apiListIdeas` die Prüfung `currentUser` mit 401 entfernen.
- `apiCreateIdea`: `CreatedBy` ist die UID, wenn jemand angemeldet ist, sonst leer.
- Nutzt F-002: `POST /api/ideas`, `GET /api/ideas/{id}`, `GET /api/ideas/{id}/images/{n}`, `GET /api/equipment`, Funktionen `validateIdeaInput`, `storeIdeaImages` (Schnittstellen in `002-eine-seite-template/interfaces.md`). Nutzt F-011: `GET /api/ideas` (Übersicht, Quelle `ideas.go` `apiListIdeas`).
- Verweist auf: AC-012-1 (Ansehen ohne Anmeldung), AC-012-2 (Anlegen ohne Anmeldung).
- Abhängig von keiner anderen Aufgabe.

### T6 – Bearbeiten von Ideen (Q-012-13)
- Neue Route `PUT /api/ideas/{id}` in `server.go` und Handler `apiUpdateIdea` in `ideas.go`.
- Eingabe multipart wie beim Anlegen: Feld `data` (JSON wie `ideaInput`, zusätzlich `keepImages`: Liste der 0-basierten Indizes der bestehenden Bilder, die bleiben), Feld `images` (neue Dateien, höchstens 5 insgesamt).
- Validierung über `validateIdeaInput`. Equipment-Katalog wie beim Anlegen (fehlende Katalogeinträge in der Transaktion).
- Unbekannte ID → 404. Entfernte Bilder → `deleteObjects` nach dem Speichern. `created_by` und `created_at` bleiben unverändert.
- Route `GET /ideas/{id}/edit` in `server.go` (liefert `serveApp`) und in `spa_test.go` aufnehmen.
- Nutzt F-002: `validateIdeaInput`, `storeIdeaImages`, `deleteObjects`, `checkImage`, Route `GET /ideas/{id}` (Schnittstellen in `002-eine-seite-template/interfaces.md`).
- Verweist auf: AC-012-2 (Ändern ohne Anmeldung wird gespeichert).
- Abhängig von T5.

### T7 – Öffentliche Oberfläche ohne Login-Links (AC-012-6, AC-012-5 Teil 3)
- `components/Layout.tsx`: Für Besucher keine Links «Anmelden» und «Registrieren» mehr. Eingeloggt: «Dateien» und «Benutzer» nur für Admins, «Abmelden» für alle.
- `pages/Home.tsx`: Keine Links auf `/login` und `/register`, Hinweis nur für Admins.
- `pages/Login.tsx`: Link «Noch kein Konto?» (zu `/register`) entfernen. Nach Anmeldung: Admin → `/dashboard`, sonst `/`.
- `pages/Register.tsx`: Ohne Einladungslink statt des Formulars den Hinweis «Registrierung nur mit Einladungslink.» zeigen. Link «Anmelden» in der Fußzeile entfernen.
- `pages/Dashboard.tsx`: Nicht-Admin sieht «Nur für Admins.» (Meldung wie `AdminUsers`). Einladungs-Anzeige ohne Ablaufdatum (`invite.expiresAt` entfällt).
- Texte in `i18n/locales/de.ts`, `en.ts`, `fr.ts`, `it.ts`.
- Verweist auf: AC-012-6, AC-012-5 (Oberfläche für Nicht-Admins).
- Abhängig von T2 (Antwort ohne `expiresAt`) und T3.

### T8 – Ideen-Seiten ohne Login-Weiterleitung (AC-012-1, AC-012-2)
- `ideas/IdeaForm.tsx`: Die Weiterleitung auf `/login` (Zeile 46) entfernen. Edit-Modus bei `/ideas/:id/edit`: Felder mit der Seite füllen, speichern über `PUT /api/ideas/{id}`, bestehende Bilder mit `keepImages` schicken.
- `ideas/IdeaPage.tsx`: Die Weiterleitung auf `/login` (Zeile 39) entfernen. Link «Bearbeiten» zu `/ideas/:id/edit`.
- `ideas/IdeasList.tsx` (F-011): Die Weiterleitung auf `/login` (Zeile 20) entfernen.
- `App.tsx`: Route `/ideas/:id/edit` ergänzen.
- Texte in allen vier Locales.
- Nutzt F-002: `IdeaForm`, `IdeaPage`, `EquipmentInput`, Frontend-Regeln `imageProblem` in `ideas/rules.ts`. Nutzt F-011: `IdeasList`.
- Verweist auf: AC-012-1, AC-012-2.
- Abhängig von T5 und T6.

### T9 – Tests und Abnahme
- Go, Umbenennung und Anpassung bestehender Tests:
  - `ideas_test.go` `TestAC002_7_IdeaEndpointsRequireSignIn`: durch einen Test ersetzen, dass die Endpunkte ohne Anmeldung antworten (AC-012-1, AC-012-2).
  - `invitations_test.go` `TestAC001_3_ExpiredInvitationIsRejected`: ersetzen durch «alter Link wird angenommen» (AC-012-8).
  - `invitations_test.go` `TestAC001_2_InvitationIsSingleUseAndExpiresAfter7Days`: Einmaligkeit bleibt, Ablauf entfällt (AC-012-7, AC-012-9).
  - Neu: Einlösung setzt die Rolle admin (T2), Initialadmin-Anlegen (T1, Entscheidungslogik als Tabellentest), Registrierung ohne Link abgelehnt (T3).
  - `spa_test.go`: `/ideas/{id}/edit` aufnehmen.
- Frontend (Vitest): `Layout.test.tsx` (kein `/login`-Link für Besucher, AC-012-6), `Register.test.tsx` (ohne Link kein Formular), `Dashboard.test.tsx` (Nicht-Admin-Hinweis, Einladungs-Antwort ohne `expiresAt`), `Login.test.tsx` (Weiterleitung, Link entfernt), `IdeaForm.test.tsx`, `IdeaPage.test.tsx` (ohne Anmeldung, Bearbeiten-Link).
- Befehle: `go vet ./...`, `go test ./...`, `cd frontend && npm run typecheck && npm test && npm run build`.
- Manuell: Besucher ohne Anmeldung legt eine Seite an, ändert sie und sieht die Übersicht (AC-012-1, AC-012-2). Initialadmin meldet sich über `/login` an (AC-012-4). Mehrere Fehlversuche auf `/login` ohne Sperre (AC-012-13).
- Abhängig von T1–T8.

### T10 – Dokumentation und Deploy
- `README.md`: Abschnitte «Ersten Admin einrichten» (Hinweis: Initialadmin entsteht beim Start), «Konfiguration» (`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`), Admin-API-Liste um `PUT /api/ideas/{id}` ergänzen, Abschnitt Einladungslinks aktualisieren (ohne Ablauf, Rolle admin).
- `cloudbuild.yaml` bzw. Deploy-Befehl: `INITIAL_ADMIN_PASSWORD` über `--set-secrets` aus Secret Manager.
- `npm run build`, damit `static/app/` aktuell ist.
- Abhängig von T9.

## Reihenfolge

T1, T2, T4, T5 sind unabhängig und können parallel laufen. Danach: T3 (nach T2), T6 (nach T5), T7 (nach T2, T3), T8 (nach T5, T6), T9 (nach T1–T8), T10 (nach T9).

## Offene Punkte

- Spec: 13 Kriterien liegen über der Vorgabe von drei bis acht. Schneiden ist deine Entscheidung.
- Spec D1: Anonymes Bearbeiten erlaubt Mutwillen. Das ist die Entscheidung des Nutzers; kein Schutz in diesem Plan.
- F-010 (Export und Import) und F-011 (Übersicht) haben eigene Routen. Ihr Plan muss sie bei der Umsetzung öffentlich machen.
- Das Passwort des Initialadmins muss vor dem ersten Deploy im Secret Manager liegen. Ohne Passwort entsteht der Account nicht; die App startet trotzdem.
