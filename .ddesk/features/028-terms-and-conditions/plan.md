---
id: F-028
---

# F-028 Plan

Zwei öffentliche Seiten (`/imprint`, `/terms`) und ein globaler Footer im `Layout`. Dazu eine Pflicht-Checkbox im Ideen-Formular und das Feld `terms_accepted_at` am Idee-Dokument. Alle Texte laufen über i18n (en, de, fr, it).

Wichtig: Die Zustimmung wird **nicht** in `validateIdeaInput` geprüft. Diese Funktion nutzt auch der CSV-Import (`ideas_import.go`), der keine Zustimmung kennt (D7: Import-Ideen haben `null`). Die Prüfung gehört in die beiden Handler (Anlegen, Bearbeiten). `PUT` ersetzt das ganze Dokument, `terms_accepted_at` wird so bei jedem Speichern neu geschrieben (AC-028-9). Bestehende Ideen ohne das Feld lesen sich als `null`, eine Migration ist nicht nötig.

## Aufgaben

- **T1 Backend: Zustimmung speichern und erzwingen** (AC-028-8, AC-028-9, AC-028-10)
  - `ideas.go`: `ideaDoc` erhält `TermsAcceptedAt *time.Time` (`firestore:"terms_accepted_at"`, `nil` = nie bestätigt). `ideaInput` erhält `TermsAccepted bool` (`json:"termsAccepted"`). `ideaView` bleibt unverändert (nicht im Export, D7).
  - Kleine Hilfsfunktion `applyTermsAcceptance(in ideaInput, doc *ideaDoc, now time.Time) error`: Ist `in.TermsAccepted` false, `userError("You must confirm the Terms and Conditions.")`, sonst `doc.TermsAcceptedAt = &now`.
  - Anlegen (`ideas.go` ~Zeile 291) und Bearbeiten (`ideas_update.go` ~Zeile 61): direkt nach `validateIdeaInput` aufrufen, Fehler über `writeUserError`. Die Prüfung steht vor dem Bildspeichern, damit bei Ablehnung nichts hochgeladen wird.
  - `validateIdeaInput`, `ideas_import.go` und `masterprompt.go` bleiben unverändert. Beim Bearbeiten wird das Feld durch `tx.Set` mit dem neuen Zeitpunkt überschrieben; Gegenprüfung, dass der Update-Pfad das Dokument aus `doc` schreibt und `terms_accepted_at` nicht aus `old` übernimmt.

- **T2 Backend: SPA-Routen** (AC-028-2)
  In `server.go` `GET /imprint` und `GET /terms` mit `serveApp` registrieren (öffentlich, kein Redirect, wie `/basket`).

- **T3 Frontend: Typen und Texte** (AC-028-1, AC-028-3, AC-028-4, AC-028-5, AC-028-6, AC-028-7)
  - `frontend/src/types.ts`: Falls `Idea` das Feld braucht, nichts ergänzen (nicht im View). Payload-Feld `termsAccepted` nur im Formular.
  - `frontend/src/i18n/locales/{en,de,fr,it}.ts`: Schlüssel für Footer-Links («Imprint», «Terms and Conditions»), Seitentitel, Impressum-Platzhaltertexte, Terms-Abschnitte (Überschrift und Text je Abschnitt), Checkbox-Label (mit Linkteil, z. B. via `Trans` oder Label-Text plus separatem Link-Text) und Fehlermeldung «Terms bestätigen». `messages.ts` und `i18n.test.tsx` verlangen vollständige Schlüssel in allen Sprachen.
  - Terms-Entwurf (D4) mit den Abschnitten: Geltungsbereich, Urheberrecht und Rechte Dritter (Nutzer versichert, Inhalte selbst erstellt oder berechtigt; Bilder, Texte, Marken), Verantwortung für eingereichte Inhalte, Freistellung, Haftungsausschluss, Entfernung von Inhalten, Änderungen. Am Seitenanfang kein juristischer Anspruch behaupten; Hinweis im Plan/Abschlussbericht, dass der Nutzer den Text juristisch prüft.

- **T4 Frontend: Footer** (AC-028-1, AC-028-5)
  In `components/Layout.tsx` unter `<main>` ein `<footer>` mit `Link` auf `/imprint` und `/terms`, Stil passend zum Header (Rand oben, `max-w-4xl`). Da `Layout` alle Routen umschliesst (auch `/login`, `/register`), erscheint der Footer überall (D8). Seite so aufbauen, dass der Footer bei kurzem Inhalt nicht mitten im Bild hängt (z. B. `min-h-screen flex flex-col`, `main` mit `flex-1`).

- **T5 Frontend: Seiten Imprint und Terms** (AC-028-2, AC-028-3, AC-028-4, AC-028-5)
  - Neue `pages/Imprint.tsx` und `pages/Terms.tsx`, in `App.tsx` unter dem `Layout` als `/imprint` und `/terms` einhängen, ohne Anmeldeprüfung.
  - `Imprint`: Struktur (Betreiber, Adresse, Kontakt, Verantwortliche Person) mit deutlich markierten Platzhaltern «TODO», sichtbar abgesetzt (z. B. hervorgehobener Hinweis «Angaben folgen»).
  - `Terms`: rendert die Abschnitte aus den i18n-Schlüsseln als `h2` plus Absätze. Die Abschnitte sind zu Urheberrecht und Rechten Dritter, Verantwortung für Inhalte, Freistellung, Haftungsausschluss und Entfernung von Inhalten (AC-028-3).

- **T6 Frontend: Checkbox im Ideenformular** (AC-028-6, AC-028-7, AC-028-8, AC-028-9)
  In `ideas/IdeaForm.tsx`:
  - Eigener State `termsAccepted` (immer initial `false`, auch beim Bearbeiten, AC-028-9), bewusst nicht Teil von `fromIdea`.
  - Checkbox mit Label und Link auf `/terms` (`target="_blank"`, `rel="noopener"`, damit das Formular nicht verloren geht) als letztes Element vor dem Speichern-Button, nach dem Mediation Concept (F-026) und nach dem Credit-Block aus F-027, falls vorhanden.
  - `handleSubmit`: Ist die Checkbox nicht gesetzt, nichts senden, `error` zeigt die Meldung (AC-028-7). Zusätzlich Button `disabled` ist optional; die Meldung muss aber erreichbar sein, daher Button nicht sperren, sondern beim Absenden prüfen. Payload `data.termsAccepted = true`.
  - Backend-Fehler laufen über den bestehenden `error`-Pfad.

- **T7 Tests** (alle AC)
  - Backend `ideas_test.go`: `applyTermsAcceptance` ohne Zustimmung gibt `userError`, mit Zustimmung ist `TermsAcceptedAt` gesetzt und liegt nahe an `now` (AC-028-8, AC-028-10); zweiter Aufruf mit neuem `now` aktualisiert den Wert (AC-028-9).
  - Backend: Handler-Test (falls Handler mit Fake-DB testbar, sonst über Hilfsfunktion): Anlegen und Bearbeiten ohne `termsAccepted` liefern 400 und speichern nichts (AC-028-10). `ideas_import_test.go`: Import funktioniert weiterhin ohne Zustimmung, `TermsAcceptedAt` bleibt `nil`; bestehende Dokumente ohne Feld bleiben ladbar.
  - `spa_test.go`: `GET /imprint` und `GET /terms` liefern 200 mit der React-Seite, ohne Redirect (AC-028-2).
  - `Layout.test.tsx`: Footer mit beiden Links, auch auf `/login` und `/register` (AC-028-1); Sprachwechsel ändert die Linktexte (AC-028-5).
  - `public.test.tsx` oder eigene `Terms.test.tsx`/`Imprint.test.tsx`: beide Seiten ohne Login sichtbar (AC-028-2); Terms enthalten die fünf Abschnitte (AC-028-3); Imprint zeigt markierte Platzhalter (AC-028-4); Texte wechseln mit der Sprache (AC-028-5).
  - `IdeaForm.test.tsx`: Checkbox vorhanden, nicht angekreuzt, Label verlinkt `/terms` (AC-028-6); Absenden ohne Haken sendet nichts und zeigt Meldung (AC-028-7); mit Haken enthält der Payload `termsAccepted: true` (AC-028-8); Bearbeiten startet wieder ungesetzt (AC-028-9). Bestehende Formular-Tests setzen die Checkbox, damit sie grün bleiben.
  - `i18n.test.tsx` deckt die neuen Schlüssel in allen Sprachen ab.

- **T8 Verifikation** (alle AC)
  `npm test` im Ordner `frontend` und `go test ./...` laufen grün. Keine Änderung an `ideas_import.go`, `masterprompt.go`, `validateIdeaInput`. Manuell prüfen: Footer auf Login, `/imprint` und `/terms` ausgeloggt, Speichern mit und ohne Haken.

## Reihenfolge

T1 und T2 sind unabhängig vom Frontend. T3 zuerst im Frontend (Texte), dann T4, T5 und T6. T6 braucht T1 für den Ende-zu-Ende-Fluss. T7 begleitet die Aufgaben, T8 zuletzt.

## Hinweise

- **F-027:** Läuft parallel am Formular. Die Checkbox kommt ans Ende des Formulars (hinter Concept und Credit-Block), das vermeidet Konflikte in der Feldreihenfolge.
- Der juristische Review des Terms-Textes und die endgültigen Impressum-Angaben liegen ausserhalb dieses Features.
