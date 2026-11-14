---
id: F-030
next: 13
---

# F-030 Akzeptanzkriterien

- **AC-030-1** Gegeben eine neu eingereichte Idee / Wenn sie gespeichert wird / Dann hat sie den Status `pending` und erscheint nicht in der Übersicht.
- **AC-030-2** Gegeben eine Idee in Prüfung / Wenn ein Nicht-Admin (auch anonym) die Detailseite, die Bilder oder die API abruft / Dann erhält er 404; im Warenkorb ist sie nicht verfügbar.
- **AC-030-3** Gegeben eine Idee in Prüfung / Wenn ein Admin Übersicht, Detailseite oder Freigaben-Seite öffnet / Dann sieht er sie mit Status-Kennzeichnung.
- **AC-030-4** Gegeben eine neu eingereichte Idee / Wenn sie gespeichert wird / Dann erhalten alle aktiven Admins eine E-Mail mit Titel und Link auf die Freigaben-Seite, gesperrte Admins nicht.
- **AC-030-5** Gegeben der Mailversand schlägt fehl / Wenn eine Idee eingereicht wird / Dann wird sie gespeichert, der Fehler geloggt, und sie steht auf der Freigaben-Seite.
- **AC-030-6** Gegeben die Freigaben-Seite / Wenn ein Admin «Veröffentlichen» wählt / Dann ist die Idee `published` und für alle sichtbar; der Einreicher erhält keine Mail.
- **AC-030-7** Gegeben die Freigaben-Seite / Wenn ein Admin mit optionaler Begründung ablehnt / Dann ist die Idee `rejected` und nur für Admins sichtbar; mit Credit-Line-E-Mail geht eine Info-Mail dorthin, ohne keine.
- **AC-030-8** Gegeben eine abgelehnte Idee / Wenn sie überarbeitet und gespeichert wird / Dann ist sie wieder `pending` und die Admins werden erneut benachrichtigt.
- **AC-030-9** Gegeben eine veröffentlichte Idee / Wenn sie bearbeitet und gespeichert wird / Dann ist sie wieder `pending`, aus Übersicht und Warenkorb verschwunden, und die Admins werden erneut benachrichtigt.
- **AC-030-10** Gegeben Ideen vor der Einführung / Wenn die Funktion aktiv ist / Dann gelten sie als `published` und bleiben sichtbar.
- **AC-030-11** Gegeben ein Admin-CSV-Import (F-015) / Wenn er ausgeführt wird / Dann sind die Ideen sofort `published`, ohne Mail.
- **AC-030-12** Gegeben ein Nutzer ohne Admin-Rolle / Wenn er die Freigaben-Seite oder deren API aufruft / Dann wird der Zugriff verweigert; eine Idee von einem Admin selbst durchläuft die Freigabe wie jede andere.
