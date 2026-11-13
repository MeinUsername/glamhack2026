# F-001 Ein Nutzerverwaltung – Implementierungsplan

Grundlage: `spec.md` (Umfang, Entscheidungen) und `acceptance.md` (AC-001-1 bis AC-001-6).
Bestand: Go-Function (`server.go`, `auth.go`, `files.go`), Firebase Auth (E-Mail/Passwort), Firestore, htmx-Seiten in `templates/`, Client in `web/src/auth.js`.

Bestätigte Rückfragen: Ein Invitationslink vergibt die Rolle **User**. Admins dürfen über Rollen vergeben und Sperren hinaus nichts.

## Festlegungen dieses Plans

- **Rollen und Sperre in Firestore**, nicht in Firebase Custom Claims (Spec: Rollen in eigener Speicherung). Jeder Request liest die Rolle frisch, damit Änderungen sofort wirken (AC-001-5).
- **Collection `users`**, Dokument-ID = Firebase-UID: `email`, `role` (`admin` | `user`), `disabled` (bool), `created_at`.
- **Collection `invitations`**, Dokument-ID = SHA-256 des Tokens: `created_by` (UID), `created_at`, `expires_at` (+7 Tage), `used_at` (null), `used_by` (UID). Das Token selbst wird nie gespeichert.
- **Sperre** wirkt doppelt: `users.disabled` (Anzeige, Prüfung in der App) und Firebase-Konto `Disabled` (Anmeldung und bestehende Session-Cookies scheitern über `VerifySessionCookieAndCheckRevoked`).
- **Eigene Entscheidungen (nicht in der Spec):**
  - Registrierung ohne Link vergibt ebenfalls die Rolle **User**.
  - Ein Admin kann sich nicht selbst degradieren oder sperren. Der letzte Admin kann nicht degradiert oder gesperrt werden.
  - Bestehende Konten ohne `users`-Dokument bekommen beim ersten Login ein Dokument mit Rolle **User**.

## Aufgaben

### T1 – Datenmodell und Rollen-Speicher
- `users.go`: Typ `userDoc`, Konstanten für Rollen, `loadOrCreateUser(uid, email)` (legt fehlendes Dokument als `user` an, idempotent per Transaktion).
- `invitations.go`: Typ `invitationDoc`, Token-Erzeugung (32 Byte, `crypto/rand`), Hash-Funktion, Prüfung «gültig» (nicht abgelaufen, nicht verwendet).
- `currentUser` (`auth.go`) liefert zusätzlich die Rolle und lehnt gesperrte Nutzer ab.
- Basis für T2–T7. Keine ACs direkt.

### T2 – Einladungslink erzeugen (AC-001-2)
- `POST /api/invitations`: nur für angemeldete Nutzer, legt Dokument mit Hash an, gibt den Link `/register?invite=<token>` zurück (einmalige Anzeige).
- Dashboard: Schaltfläche «Einladungslink erzeugen» (htmx-Fragment, zeigt Link und Ablaufdatum).
- Verweist auf: AC-001-2.

### T3 – Registrierung mit und ohne Link (AC-001-1, AC-001-3, AC-001-4)
- `POST /register` mit `{idToken, invite?}`. Ablauf im Backend:
  1. ID-Token prüfen, UID und E-Mail übernehmen.
  2. Transaktion: ohne Link `users`-Dokument mit Rolle `user` anlegen. Mit Link: Einladung prüfen (existiert, nicht abgelaufen, nicht verwendet), `used_at`/`used_by` setzen und `users`-Dokument mit Rolle `user` anlegen.
  3. Schlägt Schritt 2 mit ungültigem Link fehl, wird das eben angelegte Firebase-Konto wieder gelöscht (nur wenn kein `users`-Dokument existiert). Antwort 410 oder 400 mit Meldung «Der Einladungslink ist ungültig oder abgelaufen.»
  4. Session-Cookie setzen (wie `createSession`).
- `GET /api/invitations/{token}`: prüft den Link vor dem Anlegen des Kontos, damit im Normalfall gar kein Konto entsteht.
- `templates/register.html`: liest `?invite=` und zeigt bei ungültigem Link einen Hinweis.
- `web/src/auth.js`: Registrierung ruft `/register` statt `/session` und sendet den Link mit; vorab `GET /api/invitations/{token}`.
- Verweist auf: AC-001-1 (offene Registrierung, sofort aktiv, keine Bestätigungsmail), AC-001-3 (abgelaufen/verwendet wird abgelehnt), AC-001-4 (Rolle `user`).

### T4 – Admin-Prüfung (AC-001-6)
- `requireAdmin(next)`-Wrapper: lädt Rolle aus `users`; ohne Admin-Rolle 403 (JSON für `/api/...`, Fehlerfragment für htmx).
- Verweist auf: AC-001-6.

### T5 – Rollen vergeben und sperren (AC-001-5)
- `POST /admin/users/{uid}/role` (Wert `admin` oder `user`) und `POST /admin/users/{uid}/disabled` (`true`/`false`), beide hinter `requireAdmin`.
- Setzt `users.role`/`users.disabled` in einer Transaktion und spiegelt Sperre per `UpdateUser(Disabled)`. Beim Sperren zusätzlich `RevokeRefreshTokens`.
- Schutzregeln: Admin ändert nicht die eigene Rolle oder Sperre; der letzte Admin bleibt Admin und wird nicht gesperrt.
- Gesperrte Nutzer: `currentUser` lehnt ab, `createSession` gibt 403 mit «Dieses Konto ist gesperrt.».
- Verweist auf: AC-001-5.

### T6 – Admin-Oberfläche
- `GET /admin/users` (htmx-Seite, hinter `requireAdmin`): Tabelle mit E-Mail, Rolle (Select), Status (aktiv/gesperrt), Schaltfläche Sperren/Entsperren.
- Navigation im Dashboard nur für Admins sichtbar.
- Verweist auf: AC-001-5, AC-001-6 (Oberfläche).

### T7 – Erster Admin per Setup-Kommando (Spec-Umfang, ohne AC)
- `cmd/setup-admin/main.go` mit Argument E-Mail. Ruft `SetupFirstAdmin(ctx, project, email)` aus dem Paket `app` auf.
- Einmalig: Flag-Dokument `system/setup` in einer Transaktion. Existiert es, bricht das Kommando ab. Das Konto muss bereits existieren (Firebase Admin SDK lookup per E-Mail).
- Hinweis: Die Spec nennt diesen Punkt, aber kein Akzeptanzkriterium deckt ihn. Vorschlag: AC-001-7 ergänzen, sonst bleibt T7 ungeprüft.

### T8 – Tests und Abnahme
- Unit-Tests (Stil wie `files_test.go`, ohne Firestore): Token-Hash, Ablaufberechnung, Gültigkeitsprüfung, Schutzregeln letzter Admin und Selbstsperre.
- Transaktionspfade (T3, T5, T7) mit Firestore-Emulator, falls verfügbar; sonst manuell gegen das Projekt dokumentieren.
- Jeder Testname trägt die AC-Nummer (z. B. `TestAC001_2_InvitationIsSingleUseAndExpiresAfter7Days`).
- Vorab: `go vet ./...` und `go test ./...`. Hinweis: Ein `Makefile` mit `make check` existiert im Repo nicht; `make hooks` aus dem Workflow ebenfalls nicht.

## Reihenfolge

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T3 hängt an T1 und T2; T5 und T6 an T4.

## Abhängigkeiten zu anderen Features

Keine. F-001 ist das erste Feature der Roadmap, es gibt kein `interfaces.md` eines Vorgängers. Kein Vermerk «nutzt F-0xx» nötig.

## Offen (keine Rückfrage, nur zur Kenntnis)

- Ob T7 ein eigenes Akzeptanzkriterium bekommt (siehe T7).
- Die Plan-Ansicht `dokument/plan/{api,code,tests,doku}.md` (Workflow-Schritt 6) ist in diesem Plan nicht geschrieben, weil nur `plan.md` gefordert war.
