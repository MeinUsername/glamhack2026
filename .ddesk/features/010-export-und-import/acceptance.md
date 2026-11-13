---
id: F-010
next: 8
---

- **AC-010-1** Gegeben ein Admin und gespeicherte Ideen mit Bildern / Wenn er den Export startet / Dann enthält die Datei alle Ideen und ihre Bilder als Base64 sowie die Schema-Version.
- **AC-010-2** Gegeben gespeicherter Masterprompt, Seiten-Templates, Kategorien, Nutzer und Rollen / Wenn der Admin exportiert / Dann enthält die Datei alle diese Daten, aber keine Passwörter oder Passwort-Hashes.
- **AC-010-3** Gegeben ein angemeldeter Nutzer ohne Admin-Rolle / Wenn er Export oder Import aufruft / Dann wird die Aktion abgelehnt und nichts geändert.
- **AC-010-4** Gegeben eine Idee mit derselben ID wie im Import / Wenn die Datei importiert wird / Dann ersetzt der importierte Datensatz den vorhandenen.
- **AC-010-5** Gegeben eine Exportdatei / Wenn sie unverändert in eine leere Instanz importiert wird / Dann stimmen Ideen, Bilder, Masterprompt, Templates, Kategorien und Rollen mit dem Stand des Exports überein.
- **AC-010-6** Gegeben eine Datei mit unbekannter Schema-Version / Wenn der Import startet / Dann wird er abgelehnt und die Daten bleiben unverändert.
