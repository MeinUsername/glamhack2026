---
id: F-012
next: 14
---

# F-012 Akzeptanzkriterien

- **AC-012-1** Gegeben ein nicht eingeloggter Besucher / Wenn er Ideen, Seiten, Korb und Übersicht aufruft / Dann kann er sie ohne Anmeldung nutzen.
- **AC-012-2** Gegeben ein nicht eingeloggter Besucher / Wenn er Ideen oder Seiten anlegt oder bearbeitet / Dann wird die Änderung ohne Anmeldung gespeichert.
- **AC-012-3** Gegeben die Konfiguration nennt glamhack@x99.ch als Initialadmin / Wenn die Anwendung startet / Dann existiert dieser Admin-Account ohne Einladungslink.
- **AC-012-4** Gegeben der Initialadmin / Wenn er sich mit E-Mail und Passwort auf `/login` anmeldet / Dann erhält er Admin-Rechte.
- **AC-012-5** Gegeben die Seite `/login` / Wenn ein Nutzer ohne Admin-Rolle sich anmeldet / Dann erhält er keinen Zugang zum Admin-Bereich.
- **AC-012-6** Gegeben die öffentliche Oberfläche / Wenn sie geladen wird / Dann enthält sie keinen Link auf `/login`.
- **AC-012-7** Gegeben ein Admin / Wenn er einen Einladungslink erzeugt / Dann kann dieser Link genau einmal eingelöst werden.
- **AC-012-8** Gegeben ein Einladungslink, der Monate alt ist und noch nicht eingelöst wurde / Wenn jemand ihn einlöst / Dann funktioniert er (kein Ablaufdatum).
- **AC-012-9** Gegeben ein eingelöster Einladungslink / Wenn ihn jemand erneut verwendet / Dann wird er abgelehnt.
- **AC-012-10** Gegeben ein Nutzer ohne Admin-Rolle / Wenn er einen Einladungslink erzeugen will / Dann wird das abgelehnt.
- **AC-012-11** Gegeben zwei Admins / Wenn beide Einladungslinks erzeugen / Dann sind beide Links gültig.
- **AC-012-12** Gegeben bestehende Nicht-Admin-Konten aus F-001 / Wenn sich einer anmeldet / Dann funktioniert die Anmeldung wie bisher.
- **AC-012-13** Gegeben mehrere Fehlversuche auf `/login` / Wenn sie in kurzer Zeit folgen / Dann wird keine Sperre ausgelöst.
