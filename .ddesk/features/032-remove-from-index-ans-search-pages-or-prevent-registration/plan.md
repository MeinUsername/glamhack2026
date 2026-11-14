---
id: F-032
---

# F-032 Plan

Alles läuft über eine HTTP-Middleware vor dem Router. Sie setzt den Header `X-Robots-Tag`, liefert `/robots.txt` aus und weist Bot-User-Agents mit 403 ab. Dazu kommt das meta robots im HTML-Grundgerüst. Alle Seiten (Login, Registrierung, Admin, Ideen, Feedback-Prompts, Impressum, Nutzungsbedingungen) liefern über `writeAppIndex` dasselbe `static/app/index.html` aus, ein einziges meta-Tag deckt also AC-032-4 ab.

Entscheidungen zum Zuschnitt:

- Die Middleware wird in `handler()` (`app.go`) **vor** `initOnce` und vor `srv.mux` eingehängt, nicht in `routes()`. So tragen auch Fehlerantworten (`service unavailable`, 404 vom Mux) den Header (AC-032-3), und `/robots.txt` und die Bot-Sperre funktionieren auch, wenn Firebase/Firestore nicht initialisiert werden kann.
- Die bestehenden Tests rufen `s.mux.ServeHTTP` direkt auf und bleiben deshalb unberührt (AC-032-7). Neue Tests rufen die Middleware über `botGuard(s.mux)` auf.
- Die Bot-Liste steht einmal in einer Variablen und speist sowohl `robots.txt` als auch die 403-Prüfung, damit beide nicht auseinanderlaufen (AC-032-2, AC-032-5).
- Leerer User-Agent und normale Browser sind nicht in der Liste und laufen unverändert durch (AC-032-7). Kein Rate-Limit, kein Captcha, `/session` und Einladungsablauf bleiben unangetastet.

## Aufgaben

- **T1 Backend: Bot-Liste und robots.txt** (AC-032-1, AC-032-2)
  Neue Datei `robots.go` im Paket `app`.
  - `var blockedBots = []string{"GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot", "Google-Extended", "PerplexityBot", "Bytespider", "Amazonbot", "Applebot-Extended", "meta-externalagent", "FacebookBot", "cohere-ai", "Diffbot", "ImagesiftBot", "Omgilibot"}`. Muss mindestens die Namen aus der Spec enthalten.
  - `robotsTxt() string` baut den Text: zuerst `User-agent: *` / `Disallow: /`, danach je Bot ein eigener Block `User-agent: <Name>` / `Disallow: /`, Blöcke durch Leerzeile getrennt. Der Text wird einmal beim Paketstart oder lazy erzeugt (`var robotsBody = robotsTxt()`).
  - `serveRobots(w, r)`: `Content-Type: text/plain; charset=utf-8`, Status 200, Body `robotsBody`. Nur `GET`/`HEAD`; andere Methoden gehen durch die normale Kette (404/405 vom Mux ist ok).

- **T2 Backend: Middleware `botGuard`** (AC-032-3, AC-032-5, AC-032-6, AC-032-7)
  In `robots.go`:
  - `func botGuard(next http.Handler) http.Handler`:
    1. Setzt als Erstes `X-Robots-Tag: noindex, nofollow` auf **jede** Antwort, auch auf robots.txt und auf die 403.
    2. Ist `r.URL.Path == "/robots.txt"` (GET/HEAD), `serveRobots` und Ende. Das gilt auch für Bot-User-Agents (AC-032-6), damit Crawler das Verbot lesen können.
    3. `isBlockedBot(r.UserAgent())`: Kleinschreibung beider Seiten, `strings.Contains`. Treffer: `http.Error(w, "Forbidden", 403)`, ohne Weitergabe an `next` (kein Seiten- oder API-Inhalt, AC-032-5).
    4. Sonst `next.ServeHTTP`.
  - `isBlockedBot(ua string) bool`: leerer UA ergibt `false`. Beachte, dass kein Eintrag der Liste leer sein darf, sonst träfe `Contains` jeden UA (im Test abgesichert).
  - Header vor `WriteHeader`/`Write` setzen. Antworten, die der Mux oder `http.FileServer` später erzeugen, behalten den Header, weil niemand ihn löscht (Assets `/app/assets/...`, Bilder `/api/ideas/{id}/images/{n}`).

- **T3 Backend: Middleware einhängen** (AC-032-3, AC-032-6)
  `app.go`, `handler()`: Statt direkt `initOnce`/`srv.mux` aufzurufen, die bisherige Logik in `serve(w, r)` verschieben und `functions.HTTP("Handler", botGuard(http.HandlerFunc(serve)).ServeHTTP)` registrieren (oder `handler` selbst so umbauen). `http.Error` bei `initErr` läuft damit hinter der Middleware und trägt den Header.

- **T4 Frontend: meta robots** (AC-032-4)
  - `frontend/index.html`: `<meta name="robots" content="noindex, nofollow" />` in den `<head>`.
  - `npm run build` in `frontend/` ausführen (README Zeile 63), damit das eingecheckte `static/app/index.html` das Tag enthält; der Go-Server liefert diese Datei aus. Prüfen, dass Vite das Tag unverändert übernimmt (`grep robots static/app/index.html`). Die neu gehashten Asset-Dateien werden mit eingecheckt, alte entfernt (wie bei früheren Features).
  - Es gibt keine weiteren serverseitig erzeugten HTML-Seiten; `loginPage`, `registerPage`, `adminPage` und alle `serveApp`-Routen nutzen `writeAppIndex`. Das im Abschlussbericht festhalten.

- **T5 Tests** (AC-032-1 bis AC-032-7)
  Neue Datei `robots_test.go`, Funktionsnamen `TestAC032_<n>_...`, Server über `newRouteServer(t)` und Handler `botGuard(s.mux)`:
  - AC-032-1: `GET /robots.txt` ohne Cookie: 200, `Content-Type` beginnt mit `text/plain`, Body enthält `User-agent: *\nDisallow: /`.
  - AC-032-2: Für jeden Eintrag aus `blockedBots` enthält der Body `User-agent: <Name>\nDisallow: /`; ausserdem die Spec-Namen explizit aufgelistet (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, CCBot, Google-Extended, PerplexityBot, Bytespider, Amazonbot, Applebot-Extended, meta-externalagent).
  - AC-032-3: Header `X-Robots-Tag: noindex, nofollow` auf `/`, `/login`, `/api/me`, `/app/assets/` (Asset-Pfad), einem unbekannten Pfad (404), der robots.txt und einer 403-Antwort.
  - AC-032-4: Body von `/`, `/login`, `/register`, `/admin/users` (mit Redirect zu `/login` folgt der Test nicht; stattdessen `/login`) enthält `<meta name="robots" content="noindex, nofollow"`. Der Test liest die eingebettete `static/app/index.html` und fängt damit ab, dass der Build vergessen wurde. `admin.go` über `adminPage` direkt mit leerem `sessionUser` aufrufen, da `requireAdmin` ohne Session umleitet.
  - AC-032-5: Tabelle mit UAs, auch gemischte Schreibweise und Teilstring (`Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)`, `claudebot`, `CCBOT`), gegen `/`, `/login`, `/api/ideas`, `/ideas`: Status 403, Body enthält kein `<div id="root">` und kein JSON.
  - AC-032-6: Bot-UA auf `GET /robots.txt` ergibt 200 mit robots.txt-Inhalt.
  - AC-032-7: Browser-UA (Chrome, Safari, Firefox) und leerer UA: `/`, `/login`, `/register` weiterhin 200 mit `<div id="root">`; `/admin/users` weiterhin 303 nach `/login`. Zusätzlich `isBlockedBot("")` ist `false` und kein Eintrag in `blockedBots` ist leer. Die bestehenden Tests (`spa_test.go`, `public_test.go`) müssen unverändert grün bleiben.

- **T6 Dokumentation und Abschluss** (AC-032-1 bis AC-032-7)
  - `README.md`: Abschnitt (kurz) zum Indexierungsschutz, mit Ort der Bot-Liste (`robots.go`) und dem Hinweis, dass neue Bots nur dort ergänzt werden. Hinweis, dass bereits indexierte Seiten über die Search Console entfernt werden müssen (ausserhalb dieses Features).
  - `security.md`: Eintrag, dass User-Agent-Sperre nur ehrliche Crawler trifft und kein Sicherheitsmerkmal ist (User-Agent ist fälschbar); S3 (`/session`-Umgehung) bleibt offen.
  - `go test ./...` und `go vet ./...` ausführen; in `frontend/` `npm run build` (Typprüfung) erfolgreich.
  - Reihenfolge: T1, T2, T3 (Backend), T4 (Frontend-Build, vor T5 wegen des Body-Tests), T5, T6.
