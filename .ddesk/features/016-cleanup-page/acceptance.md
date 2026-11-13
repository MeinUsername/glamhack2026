---
id: F-016
next: 1
---

# F-016 Akzeptanzkriterien

- **AC-016-1** Gegeben ein Besucher / Wenn er `/dashboard` aufruft / Dann wird er auf `/ideas` weitergeleitet.
- **AC-016-2** Gegeben die Anwendung / Wenn `/files/{id}`, `GET /api/files` oder `POST /api/files` aufgerufen wird / Dann antwortet der Server mit 404.
- **AC-016-3** Gegeben ein Admin / Wenn er die Navigation und die Startseite sieht / Dann gibt es dort keinen Verweis auf Dateien oder Dashboard.
- **AC-016-4** Gegeben der Quellcode nach dem Cleanup / Wenn der Build läuft / Dann sind `files.go`, `files_test.go` und die Dashboard-Seite entfernt und der Build sowie die Tests laufen durch.
- **AC-016-5** Gegeben die Übersetzungsdateien (de, en, fr, it) / Wenn der Cleanup abgeschlossen ist / Dann bleiben die Schlüssel der entfernten Texte erhalten.
- **AC-016-6** Gegeben die öffentlichen Seiten / Wenn ein Besucher sie aufruft / Dann nutzen Layout, Header, Typografie, Abstände, Farbschema und Komponenten dieselben, einheitlich gestalteten Regeln.
- **AC-016-7** Gegeben ein Besucher / Wenn er `/ideas` und `/basket` aufruft / Dann funktionieren sie wie bisher.
- **AC-016-8** Gegeben ein Admin / Wenn er `/admin/users` und `/admin/master-prompt` aufruft / Dann funktionieren sie wie bisher.
