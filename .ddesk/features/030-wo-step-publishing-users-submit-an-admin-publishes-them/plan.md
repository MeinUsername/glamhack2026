---
id: F-030
---

# F-030 Plan

Jede Idee bekommt ein Feld `status` (`pending` | `published` | `rejected`) und optional `rejection_reason`. Eine Hilfsfunktion `effectiveStatus(d)` liest ein fehlendes Feld als `published` (Q-030-18: keine Datenmigration, Filter im Code, die Listen lesen ohnehin alle Dokumente). Alle lesenden Pfade (Übersicht, Detail, Bilder, `{{allideas}}`) laufen durch eine gemeinsame Sichtbarkeitsprüfung: Admin sieht alles, alle anderen nur `published`, sonst 404. Der Warenkorb lädt Ideen über `GET /api/ideas/{id}` und wirft Einträge bei 404 bereits heraus (F-006 D4); er braucht keine eigene Logik.

Der Mailversand sitzt hinter dem Port `Mailer`. **D8 ist offen** (Q-030-13: «Kommt später»). Der Plan liefert deshalb den Port, einen Fake für Tests und eine Produktions-Standardimplementierung, die nur loggt. Der echte Anbieter ist als T11 abgetrennt und blockiert die übrigen Aufgaben nicht; bis T11 erledigt ist, gehen im Betrieb keine Mails raus (die Ideen stehen trotzdem auf der Freigaben-Seite, D11).

Entscheidungen aus den Rückfragen (alle mit der empfohlenen Antwort bestätigt): Q-030-14 Bestätigungsseite nach dem Einreichen (O1), Q-030-15 Ablehnungs-Mail nur mit Credit-Line-E-Mail (O2), Q-030-16 Überarbeiten wie heute, kein neuer Link (O3), Q-030-17 Bearbeiten bleibt für alle offen (O4), Q-030-19 `{{allideas}}` nur mit `published`.

Festlegungen des Plans (Vorschläge, nicht aus der Spec):
- Bearbeiten (`PUT /api/ideas/{id}`) einer `pending`- oder `rejected`-Idee durch Nicht-Admins ergibt 404 (D3, AC-030-2). Das Überarbeiten abgelehnter Ideen macht damit der Admin (O3).
- Speichert ein Admin eine bereits `pending`e Idee, bleibt sie `pending` und löst keine zweite Mail aus. Aus `published` und `rejected` wird `pending` mit Mail; `rejection_reason` wird dabei geleert.
- Die Mail wird synchron im Request gesendet (Cloud Run drosselt die CPU nach der Antwort), mit kurzem Timeout; ein Fehler wird geloggt und ändert die Antwort nicht (D11).
- Der Link in der Mail baut sich aus der Umgebungsvariable `APP_BASE_URL` plus `/admin/approvals`.
- Freigaben-Seite listet `pending`; abgelehnte Ideen sieht der Admin in der Übersicht mit Kennzeichnung.

## Aufgaben

- **T1 Datenmodell und Sichtbarkeit** (AC-030-1, AC-030-2, AC-030-10)
  nutzt F-011: Übersicht `apiListIdeas`
  In `ideas.go` bzw. neuer Datei `ideas_status.go`:
  - Konstanten `statusPending`, `statusPublished`, `statusRejected`; `ideaDoc` erhält `Status string firestore:"status"` und `RejectionReason string firestore:"rejection_reason"`.
  - `effectiveStatus(d ideaDoc) string` (leer ⇒ `published`).
  - `s.canView(r, d) bool`: `published` für alle, sonst nur wenn `s.currentUser(r)` ein Admin ist. Variante mit übergebener Auflösung (`resolve`) für Tests ohne Firebase, analog `guardAdmin`.
  - `ideaView` und `ideaSummary` erhalten `status` und `rejectionReason` (Letzteres nur für Admins gefüllt).

- **T2 Lesende Endpunkte filtern** (AC-030-2, AC-030-3, AC-030-10)
  nutzt F-011: Übersicht, F-006: Warenkorb
  - `apiGetIdea` und `apiIdeaImage`: nicht sichtbar ⇒ 404 «idea not found» (gleiche Antwort wie bei unbekannter ID, kein Rückschluss auf Existenz).
  - `apiListIdeas`: Nicht-Admins sehen nur `published`; Admins alle mit `status`.
  - Warenkorb: nur gegenprüfen, dass `BasketEntry` und `PromptGenerator` ein 404 behandeln (Eintrag entfällt).

- **T3 Mailer-Port, Fake, Empfänger** (AC-030-4, AC-030-5)
  nutzt F-012: Rollen und Sperre in der Collection `users`
  - Neue Datei `mail.go`: `type Mailer interface { Send(ctx, Message) error }`, `Message{To []string; Subject, Body string}`; `logMailer` (loggt Empfänger und Betreff, Standard im Betrieb), `fakeMailer` (nur in `_test.go`, sammelt Nachrichten, optional mit Fehler).
  - `server` erhält Feld `mailer Mailer`, in `newServer` auf `logMailer` gesetzt (T11 tauscht es).
  - `s.activeAdminEmails(ctx)`: Collection `users`, Rolle `admin` und nicht `disabled`, leere Adressen ausgelassen.
  - `s.notifyAdminsPending(ctx, id, title)`: baut Betreff/Text (Titel, Link `APP_BASE_URL + /admin/approvals`), sendet, loggt Fehler und gibt nichts zurück (D11). Ohne Empfänger oder ohne `APP_BASE_URL` wird geloggt.

- **T4 Einreichen** (AC-030-1, AC-030-4, AC-030-5)
  nutzt F-027: Credit-Line-E-Mail unverändert
  `apiCreateIdea`: `doc.Status = statusPending`; nach erfolgreicher Transaktion `notifyAdminsPending`. Antwort `{id, status}`.

- **T5 Bearbeiten setzt zurück** (AC-030-2, AC-030-8, AC-030-9)
  nutzt F-012: Bearbeiten ohne Login
  `apiUpdateIdea`: Nach dem Laden `canView` prüfen (sonst 404). Neuer Status: war `pending` ⇒ bleibt `pending`, keine Mail; war `published` oder `rejected` ⇒ `pending`, `RejectionReason` leeren, Mail nach erfolgreichem `writeIdea`. Antwort `{id, status}`.

- **T6 Freigaben-API und Seite** (AC-030-3, AC-030-6, AC-030-7, AC-030-12)
  nutzt F-027: Credit-Line-E-Mail für die Ablehnungs-Mail
  - `server.go`: `GET /admin/approvals` (`requireAdmin(adminPage)`), `GET /api/admin/approvals` (Liste `pending`, volle Ideen für die Vorschau, älteste zuerst), `POST /api/admin/approvals/{id}/publish`, `POST /api/admin/approvals/{id}/reject` (Body `{reason}` optional, auf `maxIdeaTextRunes` begrenzt). Alle `requireAdmin`.
  - Publish und Reject in einer Transaktion: nur wenn aktueller Status `pending`, sonst 409 (zwei Admins gleichzeitig). Publish: keine Mail. Reject: `rejection_reason` speichern; ist `credit_email` gefüllt, Info-Mail (Titel, Begründung), sonst keine (O2); Fehler nur loggen.
  - Lese- und Schreibrechte gleichen dem Rest der Admin-API: 401 ohne Login, 403 ohne Admin-Rolle.

- **T7 CSV-Import veröffentlicht sofort** (AC-030-11)
  nutzt F-015: `apiImportIdeas`
  In `ideas_import.go` beim `batch.Set` `doc.Status = statusPublished` setzen; keine Mail. Duplikatprüfung über Titel (`loadExistingTitles`) bleibt statusunabhängig.

- **T8 Prompt-Platzhalter `{{allideas}}`** (AC-030-2)
  nutzt F-025: `loadAllIdeas`
  `feedbackprompts.go`: nur Ideen mit `effectiveStatus == published` übernehmen (öffentliche Route, darf keine `pending`-Inhalte preisgeben).

- **T9 Frontend: Typen, Texte, Bestätigungsseite** (AC-030-1, AC-030-8, AC-030-9)
  - `types.ts`: `IdeaStatus`, `status` und `rejectionReason` an `Idea` und der Listenzeile.
  - `i18n/locales/{en,de,fr,it}.ts`: Texte für Status-Kennzeichnungen, Bestätigungsseite, Freigaben-Seite, Navigationspunkt, Aktionen, Begründungsfeld.
  - `IdeaForm.tsx`: nach dem Speichern durch Nicht-Admins Weiterleitung auf `/ideas/submitted` (Hinweis «Deine Idee wurde zur Prüfung eingereicht», Link zur Übersicht); Admins gehen wie bisher auf die Detailseite.
  - Neue Seite `pages/IdeaSubmitted.tsx`, Route in `App.tsx`, `GET /ideas/submitted` in `server.go` vor `/ideas/{id}`.

- **T10 Frontend: Freigaben, Kennzeichnung, Navigation** (AC-030-3, AC-030-6, AC-030-7, AC-030-12)
  - Neue Seite `pages/AdminApprovals.tsx` (Route `/admin/approvals`): Liste mit Vorschau (Komponenten der Detailseite wiederverwenden), Schaltflächen «Veröffentlichen» und «Ablehnen» mit optionaler Begründung; nach der Aktion Eintrag aus der Liste entfernen; Fehler 409 verständlich melden.
  - `IdeasList.tsx` und `IdeaPage.tsx`: Status-Kennzeichnung für `pending` und `rejected` (nur Admins bekommen solche Ideen geliefert); bei `rejected` die Begründung anzeigen.
  - Navigation: Eintrag «Freigaben» nur für Admins in `components/Layout`.

- **T11 Mail-Anbieter (blockiert durch D8)** (AC-030-4)
  Erst nach der Entscheidung SMTP oder Transaktions-API. Dann: Implementierung von `Mailer` in eigener Datei, Auswahl in `newServer` über Umgebungsvariablen (fehlen sie, bleibt `logMailer`), Secrets in `cloudbuild.yaml` und README. Kein Code in T1 bis T10 hängt davon ab. Vor dem Start dieser Aufgabe Rückfrage Q-030-13 neu stellen.

- **T12 Tests** (alle AC)
  - Go ohne Firestore (Stil `users_test.go`, `guardAdmin` mit Fake-`resolve`): `effectiveStatus` mit leerem Feld (AC-030-10); `canView` für anonym, Nutzer, Admin (AC-030-2, AC-030-3); Mail-Text und Empfängerfilter, gesperrte Admins ausgelassen (AC-030-4); `fakeMailer` mit Fehler: Einreichen läuft durch, Fehler geloggt (AC-030-5); Statusübergänge als reine Funktion `nextStatusOnEdit(old, isAdmin)` (AC-030-8, AC-030-9); Reject-Mail nur mit Credit-Line-E-Mail (AC-030-7); Guard auf Freigaben-Routen: 401 anonym, 403 Nutzer (AC-030-12); Import setzt `published` (AC-030-11, `ideas_import_test.go`).
  - Vitest: `IdeaForm` leitet Nicht-Admins auf `/ideas/submitted` (AC-030-1); `AdminApprovals` zeigt Liste, Veröffentlichen und Ablehnen mit Begründung rufen die API auf (AC-030-6, AC-030-7); Status-Kennzeichnung in `IdeasList`/`IdeaPage` (AC-030-3); Warenkorb wirft 404-Eintrag heraus (AC-030-2); i18n-Test deckt neue Schlüssel in allen Sprachen ab. Testnamen tragen die AC-Nummer.
  - Hinweis: Tests mit Firestore-Zugriff (Statusfilter in `apiListIdeas`) gibt es im Repo nicht; die Filterlogik steckt deshalb in reinen Funktionen, die ohne Datenbank testbar sind.

- **T13 Doku und Verifikation** (alle AC)
  README: Abschnitt «Freigabe» (Statuswerte, Seite `/admin/approvals`, `APP_BASE_URL`, Mail-Anbieter offen); `security.md`: neue Routen und die Sichtbarkeitsregel. `go vet ./...`, `go test ./...`, `npm run typecheck`, `npm test` laufen grün, danach `npm run build` (die Build-Ausgabe `static/app/` ist eingecheckt).

## Reihenfolge

T1 zuerst. T2, T3, T7, T8 folgen unabhängig auf T1 (T3 hängt nicht von T1 ab). T4 und T5 brauchen T1 und T3, T6 braucht T1 und T3. T9 kann parallel zum Backend starten, T10 braucht T6 und T9. T12 begleitet die Aufgaben, T13 zuletzt. T11 läuft erst nach der Entscheidung D8 und liegt ausserhalb der Reihenfolge.
