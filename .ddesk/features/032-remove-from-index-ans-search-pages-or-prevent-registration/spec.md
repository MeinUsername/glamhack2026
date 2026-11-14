---
id: F-032
title: Remove from Index ans Search Pages or prevent registration
status: done
---

# F-032 Remove from Index ans Search Pages or prevent registration

## Beschreibung

- Verhindere die Indexierung bei Google und Co über die entsprechenden Reference Files.
- Blockiere die Usage durch Bots.

### Ziel

Die App erscheint in keiner Suchmaschine und wird von bekannten Crawlern und KI-Bots weder gelesen noch genutzt. Die Registrierung bleibt einladungsbasiert und wird lediglich nicht indexiert.

### Umfang

- **`/robots.txt`** wird vom Server ausgeliefert: `User-agent: *` mit `Disallow: /`; zusätzlich eigene Blöcke mit `Disallow: /` für bekannte KI- und Crawler-User-Agents (z. B. GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, CCBot, Google-Extended, PerplexityBot, Bytespider, Amazonbot, Applebot-Extended, meta-externalagent).
- **`X-Robots-Tag: noindex, nofollow`** als HTTP-Header auf allen Antworten (HTML, API, Assets, Bilder).
- **`<meta name="robots" content="noindex, nofollow">`** im HTML-Grundgerüst der SPA (`frontend/index.html`) und in den serverseitig erzeugten Seiten (Login, Registrierung, Admin).
- **Serverseitige Sperre:** Anfragen, deren User-Agent zur Bot-Liste gehört, beantwortet der Server mit `403`. `/robots.txt` bleibt für alle erreichbar, damit Crawler das Verbot lesen können.
- **Seitenumfang:** die gesamte Seite, einschliesslich Ideen, Feedback-Prompts, Impressum und Nutzungsbedingungen.

Nicht Teil dieses Features: Rate-Limiting, Captcha/Honeypot, Schliessen der `/session`-Umgehung der Einladungspflicht (siehe `security.md` S3), Sitemap, Änderungen am Einladungsablauf, Entfernen bereits indexierter Seiten bei Suchmaschinen (Search Console).

### Entscheidungen

- **D1 (Q-032-01):** Alles wird von der Indexierung ausgenommen, auch Ideen, Impressum und Nutzungsbedingungen.
- **D2 (Q-032-02):** Dreifach absichern: `robots.txt`, `X-Robots-Tag`-Header und meta robots im HTML.
- **D3 (Q-032-03):** Bekannte Bots werden in `robots.txt` ausgeschlossen und serverseitig mit 403 abgewiesen. Kein Rate-Limit.
- **D4 (Q-032-04):** «Prevent registration» heisst: Registrierung bleibt einladungsbasiert, `/register` und `/login` werden nur nicht indexiert. Kein Captcha/Honeypot, `/session`-Umgehung bleibt ausserhalb dieses Features.

### Abhängigkeiten

- **F-012:** Öffentlicher Zugriff und Einladungen (Routen, Registrierung).
- **F-028:** Öffentliche Rechtsseiten, die ebenfalls ausgenommen werden.
- **F-025:** Öffentliche Feedback-Prompts-Seite, ebenfalls ausgenommen.

### Akzeptanzkriterien

Siehe `acceptance.md`.
