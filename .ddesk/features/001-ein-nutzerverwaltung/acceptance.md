---
id: F-001
next: 7
---

- **AC-001-1** Gegeben ein Besucher ohne Konto / Wenn er auf `/register` E-Mail und Passwort eingibt / Dann ist das Konto sofort angelegt, ohne E-Mail-Bestätigung.
- **AC-001-2** Gegeben ein registrierter Nutzer / Wenn er einen Invitationslink erzeugt / Dann ist dieser Link genau einmal nutzbar und 7 Tage gültig.
- **AC-001-3** Gegeben ein Invitationslink, der abgelaufen oder bereits verwendet ist / Wenn sich jemand damit registrieren will / Dann wird die Registrierung abgelehnt.
- **AC-001-4** Gegeben ein gültiger Invitationslink / Wenn sich jemand damit registriert / Dann erhält das neue Konto die Rolle User.
- **AC-001-5** Gegeben ein Admin / Wenn er einem Nutzer eine Rolle zuweist oder ihn sperrt / Dann gilt die Änderung für den Nutzer, und ein gesperrter Nutzer kann sich nicht mehr anmelden.
- **AC-001-6** Gegeben ein Nutzer ohne Admin-Rolle / Wenn er Rollen zuweist oder einen Nutzer sperrt / Dann wird die Aktion abgelehnt.
