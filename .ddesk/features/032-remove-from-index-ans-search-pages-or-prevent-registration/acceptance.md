---
id: F-032
next: 8
---

# F-032 Akzeptanzkriterien

- **AC-032-1** Gegeben ein beliebiger Client ohne Login / Wenn er `GET /robots.txt` aufruft / Dann antwortet der Server mit Status 200, `Content-Type: text/plain` und enthält für `User-agent: *` die Zeile `Disallow: /`.
- **AC-032-2** Gegeben `GET /robots.txt` / Wenn die Antwort gelesen wird / Dann enthält sie je einen eigenen Block mit `Disallow: /` für die bekannten KI- und Crawler-User-Agents der Bot-Liste.
- **AC-032-3** Gegeben eine beliebige Antwort der App (HTML-Seite, API, Asset, Bild, Fehlerantwort) / Wenn sie ausgeliefert wird / Dann trägt sie den Header `X-Robots-Tag: noindex, nofollow`.
- **AC-032-4** Gegeben das HTML-Grundgerüst der SPA und die serverseitig erzeugten Seiten (Login, Registrierung, Admin) / Wenn sie ausgeliefert werden / Dann enthalten sie `<meta name="robots" content="noindex, nofollow">`.
- **AC-032-5** Gegeben eine Anfrage mit einem User-Agent der Bot-Liste (Gross-/Kleinschreibung egal, Teilstring-Treffer) / Wenn sie eine beliebige Route ausser `/robots.txt` aufruft / Dann antwortet der Server mit 403 und liefert keinen Seiten- oder API-Inhalt.
- **AC-032-6** Gegeben eine Anfrage mit einem User-Agent der Bot-Liste / Wenn sie `GET /robots.txt` aufruft / Dann antwortet der Server mit 200 und dem Inhalt der robots.txt.
- **AC-032-7** Gegeben ein normaler Browser-User-Agent oder ein leerer User-Agent / Wenn er Seiten, API, Login oder Registrierung mit Einladung nutzt / Dann verhält sich die App unverändert, und der Einladungsablauf bleibt wie in F-012.
