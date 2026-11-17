---
id: F-038
next: 9
---

# F-038 Akzeptanzkriterien

- **AC-038-1** Gegeben ein Besucher ohne Freigabe / Wenn er eine Seite der App aufruft (z. B. `/ideas`, `/login`, `/admin/users`) / Dann wird er auf `/access` mit Rücksprungadresse weitergeleitet und sieht keine Inhalte.
- **AC-038-2** Gegeben ein Besucher ohne Freigabe / Wenn er die API oder ein Bild direkt aufruft / Dann antwortet der Server mit `401` ohne Inhalt.
- **AC-038-3** Gegeben ein konfiguriertes `SITE_PASSWORD` / Wenn der Besucher auf `/access` das richtige Passwort eingibt / Dann erhält er ein 30 Tage gültiges Cookie (HttpOnly, Secure) und landet auf der ursprünglich angefragten Seite.
- **AC-038-4** Gegeben ein Besucher auf `/access` / Wenn er ein falsches Passwort eingibt / Dann erhält er keine Freigabe und sieht eine Fehlermeldung.
- **AC-038-5** Gegeben mehrere Fehlversuche derselben IP-Adresse / Wenn weitere Versuche folgen / Dann antwortet der Server zeitweise mit `429`, auch bei richtigem Passwort.
- **AC-038-6** Gegeben kein `SITE_PASSWORD` konfiguriert / Wenn die App startet und aufgerufen wird / Dann ist sie ohne Passwort nutzbar und das Log enthält eine Warnung.
- **AC-038-7** Gegeben ein Besucher ohne Freigabe / Wenn er `/robots.txt` aufruft / Dann erhält er sie ohne Passwort.
- **AC-038-8** Gegeben das Repository / Wenn Code, Konfiguration, Tests und Doku durchsucht werden / Dann steht das Passwort in keiner eingecheckten Datei, und die lokale Passwortdatei ist in `.gitignore`.
