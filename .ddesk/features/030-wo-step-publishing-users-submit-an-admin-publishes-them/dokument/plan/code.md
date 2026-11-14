# Code – Plan F-030

- [entworfen] `ideaDoc.Status` und `RejectionReason`; `effectiveStatus` liest ein fehlendes Feld als `published`.
  Warum: Q-030-18, keine Datenmigration, bestehende Ideen bleiben sichtbar (AC-030-10).
- [entworfen] `canView` als zentrale Sichtbarkeitsprüfung für Liste, Detail, Bilder; Variante mit übergebener Benutzerauflösung.
  Warum: Eine Stelle statt drei Kopien, testbar ohne Firebase wie `guardAdmin`.
- [entworfen] `mail.go` mit Port `Mailer`, `logMailer` im Betrieb, `fakeMailer` in Tests.
  Warum: D8 ist offen (Q-030-13 «Kommt später»), Port und Fake erlauben die Umsetzung ohne Anbieter.
- [entworfen] Neue Dateien `ideas_status.go`, `approvals.go`; Frontend `AdminApprovals.tsx`, `IdeaSubmitted.tsx`.
  Warum: `ideas.go` ist mit gut 600 Zeilen schon gross.
- [entworfen] Mail synchron im Request, Fehler nur loggen.
  Warum: Cloud Run drosselt die CPU nach der Antwort; D11 verlangt, dass ein Fehler das Einreichen nicht stoppt.
