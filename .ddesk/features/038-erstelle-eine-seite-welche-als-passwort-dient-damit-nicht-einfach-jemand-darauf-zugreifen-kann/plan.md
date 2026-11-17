---
id: F-038
---

# F-038 Plan: Seitenpasswort

## Umsetzungsstand (17. November 2026)

- [x] T1–T5: `access.go` und Einbindung vor der Firebase-Initialisierung in `app.go`.
- [x] T6: `access_test.go` deckt AC-038-1 bis AC-038-7, Token-Manipulation, Passwortwechsel,
  sichere Rücksprünge, parallele Fehlversuche, Tabellenlimit, Bodylimit und Sprachwahl ab.
- [x] T7: `.env.example`, Git-/Cloud-Upload-Ausschluss, Secret-Zuordnung und README ergänzt;
  lokales `security.md` um F-038 erweitert (die Datei ist im Projekt bereits ignoriert).
- [x] T8: `go vet ./...`, `go test -race ./...` und `git diff --check` erfolgreich.
  HTTPS-Smoke-Test mit echtem lokalem Testserver und Cookie-Jar prüft Freigabe, Rücksprung,
  Seiten, API, Bilder und Assets; weitere Tests prüfen `/robots.txt` und ungeprüfte Requests.
  Anstelle eines manuellen Laufs gegen Firebase wird dieser Ablauf reproduzierbar automatisiert.
  Passwortwerte werden ausschließlich zur Laufzeit erzeugt; `.env.example` enthält nur einen leeren Wert.

Zusätzlich zur ursprünglichen Planung verhindert die Middleware das Caching auch nach Freigabe;
sie überschreibt dazu Cache-Header der vorhandenen Bild- und SPA-Handler bei der Ausgabe.
Die vorhandene Abhängigkeit `golang.org/x/text` wird direkt für die Sprachwahl verwendet.
Die fünfzehnminütige Ablaufzeit bereinigt auch Einträge unterhalb des Sperrschwellwerts.

**Betrieb noch ausstehend:** `SITE_PASSWORD` im Secret Manager anlegen, Zugriff des
Servicekontos sicherstellen und deployen. Keine Cloud-Konfiguration oder produktiven Secrets
wurden geändert. Ohne Variable bleibt die App gemäß D5 offen.

## Festlegungen aus dem Plan

- **Schwellwert Raten-Schutz:** 5 Fehlversuche pro IP, danach 15 Minuten Sperre (Vorschlag der Spec). Zähler im Speicher je Instanz; als Konstanten, leicht änderbar.
- **Passwortseite serverseitig:** `/access` ist ein einfaches HTML-Formular, das der Go-Server selbst ausliefert. Das React-Bundle (`/app/...`) liegt hinter dem Schutz und kann deshalb nicht für diese Seite dienen. Texte auf Deutsch und Englisch nach `Accept-Language`, ohne eigene Assets.
- **Token:** `<ablauf-unixzeit>.<HMAC-SHA256(ablauf, schlüssel)>`, Schlüssel = SHA-256 des Passworts mit festem Kontext-Präfix. Ändert sich das Passwort, ändert sich der Schlüssel und alte Cookies werden ungültig. Kein Klartext im Cookie.
- **Cookie:** Name `access`, HttpOnly, Secure, SameSite=Lax, Path `/`, Max-Age 30 Tage. Secure bleibt immer gesetzt (Browser akzeptieren es auf `localhost`).
- **Client-IP:** erster Eintrag aus `X-Forwarded-For` (Cloud Run), sonst `RemoteAddr`.
- **Einbindung:** neue Middleware `accessGuard` in `app.go` zwischen `botGuard` und `handler`; `botGuard` bleibt aussen, damit `/robots.txt` und `X-Robots-Tag` unverändert gelten (AC-038-7).
- **Keine Rückfragen nötig:** Alle Entscheidungen D1–D9 liegen vor, die einzige offene Frage (Schwellwert) ist oben beantwortet.

## Aufgaben

### T1 Konfiguration und Token (AC-038-3, AC-038-6, AC-038-8)
Neue Datei `access.go`:
- `SITE_PASSWORD` einmal beim ersten Request lesen (Konfigurationsstruktur, keine Globals im Test-Pfad; Tests können ein Passwort injizieren).
- Ist es leer: Schutz aus, einmal `log.Printf`-Warnung beim Start (im `initOnce`-Pfad bzw. beim Aufbau der Middleware).
- Funktionen `signToken(expiry)` / `verifyToken(value)` mit `hmac.Equal`; Passwortvergleich mit `subtle.ConstantTimeCompare` über die SHA-256-Hashes beider Seiten.

### T2 Middleware `accessGuard` (AC-038-1, AC-038-2, AC-038-7)
- Ausnahmen: `/access` (GET und POST) und `/robots.txt` (kommt schon vor der Middleware durch `botGuard`).
- Ohne gültiges Cookie: `GET`/`HEAD` auf Seitenpfade → `303` nach `/access?next=<Pfad+Query>`; Pfade `/api/...` und Bilder → `401` mit leerem Rumpf bzw. JSON ohne Inhalt; andere Methoden (POST/PUT/DELETE, z. B. `/session`, `/register`) → `401`.
- Assets unter `/app/...` ohne Freigabe: `401` (keine Inhalte).
- Schutz aus (kein Passwort): Middleware reicht alles durch.
- `Cache-Control: no-store` auf Weiterleitung und `401`.

### T3 Passwortseite und Prüf-Endpunkt (AC-038-3, AC-038-4, AC-038-5)
- `GET /access`: Formular (ein Passwortfeld, verstecktes `next`), `noindex` über den bestehenden `X-Robots-Tag` und zusätzlich `<meta name="robots">`. Schutz aus oder bereits freigegeben → Weiterleitung auf `next`/`/`.
- `POST /access`: Sperre prüfen (sonst `429` mit `Retry-After`, auch bei richtigem Passwort); Passwort in konstanter Zeit vergleichen; richtig → Cookie setzen, Zähler der IP löschen, `303` auf `next`; falsch → Fehlzähler erhöhen, Formular erneut mit Fehlermeldung (`401`).
- `next`-Validierung: nur interne Pfade (beginnt mit einfachem `/`, nicht `//`, kein `\`, kein Schema), sonst `/`. `/access` selbst als Ziel wird zu `/`.
- Body-Grösse begrenzen (`http.MaxBytesReader`).

### T4 Raten-Schutz (AC-038-5)
- In `access.go` oder `access_limit.go`: Map IP → (Fehlversuche, Sperre bis) mit Mutex; Aufräumen abgelaufener Einträge beim Zugriff, Obergrenze für die Mapgrösse gegen Speicherwachstum.
- Zeitquelle injizierbar für Tests.

### T5 Einbindung (alle AC)
- `app.go`: `functions.HTTP("Handler", botGuard(accessGuard(http.HandlerFunc(handler))).ServeHTTP)`.
- `/access` nicht über `s.mux` führen, damit die Seite auch ohne initialisierten Firebase-Server antwortet (`handler` initialisiert lazy und kann mit `500` scheitern).

### T6 Tests (AC-038-1 bis AC-038-7)
`access_test.go`, ohne Firestore, mit `httptest` und einem Dummy-Handler hinter der Middleware; Testpasswort wird im Test zufällig erzeugt, nicht als Literal eingecheckt (AC-038-8):
- Seite ohne Cookie → `303` auf `/access?next=...` für `/ideas`, `/login`, `/admin/users` (AC-038-1).
- `/api/ideas`, Bild-URL, `/app/assets/x.js` ohne Cookie → `401`, leerer Rumpf (AC-038-2).
- Richtiges Passwort → Cookie mit HttpOnly, Secure, SameSite=Lax, Max-Age 30 Tage; Rücksprung; danach Zugriff möglich (AC-038-3).
- Falsches Passwort → kein Cookie, Fehlermeldung (AC-038-4).
- Nach 5 Fehlversuchen `429`, auch mit richtigem Passwort; Ablauf der Sperre mit Fake-Zeit; andere IP unberührt (AC-038-5).
- Ohne `SITE_PASSWORD`: alles offen (AC-038-6); Warnung im Log (Log-Ausgabe umlenken).
- `/robots.txt` ohne Freigabe erreichbar, Zusammenspiel mit `botGuard` (AC-038-7); bestehende `robots_test.go` bleibt grün.
- Token: manipuliert, abgelaufen, mit anderem Passwort signiert → abgelehnt.
- `next`: `//evil.example`, `https://evil.example`, `/\evil` → `/`.
- Bestehende Tests (`public_test.go`, `spa_test.go`) laufen ohne `SITE_PASSWORD` unverändert.

### T7 Konfiguration, Secret, Doku (AC-038-6, AC-038-8)
- `.gitignore`: `.env` ergänzen. Beispiel `.env.example` ohne Wert (`SITE_PASSWORD=`) einchecken.
- `cloudbuild.yaml`: `--set-secrets` um `SITE_PASSWORD=SITE_PASSWORD:latest` erweitern. Das Secret muss vor dem Deploy im Secret Manager existieren (sonst bricht der Deploy ab, siehe README zu `INITIAL_ADMIN_PASSWORD`); das ist ein manueller Schritt des Betreibers.
- `README.md`: Zeile in der Konfigurationstabelle, Abschnitt «Seitenpasswort (F-038)» mit lokalem Start (`.env` laden bzw. `export`), Secret anlegen, Passwort ändern (neues Secret-Version + Redeploy macht alle Freigaben ungültig), Hinweis auf Schutz aus ohne Passwort. `cmd/`-Starter (lokaler Server) prüfen, ob er `.env` lesen soll; falls ja, dort minimal ergänzen.
- `security.md`: Abschnitt zum Seitenpasswort und zur Reihenfolge der Schutzstufen (Seitenpasswort, dann Firebase).

### T8 Abschlusskontrolle (AC-038-8)
- `go vet ./... && go test ./...`.
- Suche im Repo nach dem verwendeten Testpasswort und nach Literalen bei `SITE_PASSWORD` (`git grep -n SITE_PASSWORD`): nur Namen, keine Werte.
- Manueller Lauf lokal mit gesetztem Passwort: Seite, API, Bild, `/login`, `/robots.txt`.

## Reihenfolge

T1 → T4 → T3 → T2 → T5 → T6 → T7 → T8

## Risiken

- Zähler je Instanz (max. 2 Instanzen): Sperre wirkt pro Instanz, als Bremse ausreichend (Spec).
- Hinter Cloud Run ist `X-Forwarded-For` der verlässliche Client-Eintrag; bei fehlendem Header fällt der Zähler auf `RemoteAddr` zurück.
- Das Frontend ruft `/api/...` teils beim Seitenstart auf; ohne Freigabe kommt der Nutzer nie so weit, weil das HTML selbst schon umgeleitet wird.

### Ergänzung: Passwort setzen

`scripts/set-site-password.sh` fragt das Produktionspasswort zweimal verdeckt ab, erstellt
`SITE_PASSWORD` oder fügt eine Version hinzu und vergibt die Secret-Leseberechtigung an das
Cloud-Run-Laufzeit-Servicekonto. Ein Deploy folgt separat. Lokal wird `SITE_PASSWORD` nicht
benötigt; ohne Variable erscheint keine Passwortseite. README entsprechend angepasst.
Geprüft: Bash-Syntax, Hilfe und vier Abläufe mit gemocktem `gcloud` (Anlegen, Ändern,
abweichende Bestätigung, leere Eingabe). Dabei keine Cloud-Änderungen durchgeführt.
