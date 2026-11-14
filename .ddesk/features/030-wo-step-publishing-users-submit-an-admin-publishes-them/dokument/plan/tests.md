# Tests – Plan F-030

- [entworfen] Go-Tests ohne Firestore für `effectiveStatus`, `canView`, `nextStatusOnEdit`, Empfängerfilter, Mail-Text, Reject-Mail-Regel und Guards der Freigaben-Routen (AC-030-2 bis AC-030-10, AC-030-12).
  Warum: Das Repo hat keinen Firestore-Emulator; die Logik liegt deshalb in reinen Funktionen.
- [entworfen] `fakeMailer` mit Fehler: Einreichen funktioniert trotzdem (AC-030-5).
  Warum: D11.
- [entworfen] Import-Test: Ideen sind `published`, keine Mail (AC-030-11).
  Warum: D12.
- [entworfen] Vitest für Weiterleitung auf die Bestätigungsseite, Freigaben-Seite, Status-Kennzeichnung, Warenkorb-404, i18n (AC-030-1, AC-030-3, AC-030-6, AC-030-7).
  Warum: Die Oberfläche trägt diese Kriterien.
