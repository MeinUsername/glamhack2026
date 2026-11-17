# glamhack2026

Ideen-Shop für Kunstvermittlung: Ideen erfassen und ansehen, in den Korb legen und daraus einen
Prompt erzeugen. Admins melden sich über Firebase Auth an und verwalten Nutzer, Einladungen,
den Master-Prompt und den CSV-Import.

## Aufbau

- **Backend:** eine Go-Function (Cloud Run functions, Runtime `go127`). Einstieg ist `Handler` in
  `app.go`. Routing in `server.go`.
  - `auth.go`: Firebase Admin SDK prüft das ID-Token und setzt ein Session-Cookie (HttpOnly, Secure).
  - `ideas*.go`: Ideen (Seiten-Template), Bilder, CSV-Import.
  - `users.go`, `invitations.go`, `admin.go`: Rollen, Einladungslinks, Admin-API.
- **Frontend:** React-App mit TypeScript und Tailwind CSS in `frontend/`. Vite baut nach
  `static/app/`, die Go-Function liefert die Seiten `/`, `/login`, `/register`, `/ideas`, `/basket` und
  `/admin/...` mit derselben `index.html` aus. Der Client-Router zeigt die Seite.
  - `frontend/src/auth/`: Firebase JS SDK, Session über `POST /session`, Registrierung über `POST /register`.
  - `frontend/src/pages/`: Login, Registrierung, Ideen, Korb, Admin-Seiten (Nutzer mit Einladung, Master-Prompt, Import).
- **Build-Ausgabe** `static/app/` ist eingecheckt, weil der Deploy kein npm ausführt.
- **Daten:** Firestore-Collection `ideas`; die Bilder liegen im Bucket. Benutzer verwaltet Firebase Auth, nicht die Datenbank.
- **Nutzerverwaltung:** Collection `users` (Dokument-ID = UID) mit Rolle (`admin` | `user`)
  und Sperre (`disabled`). Collection `invitations` (Dokument-ID = SHA-256 des Einladungstokens,
  einmalig, 7 Tage). Rollen liest jeder Request frisch aus Firestore.
  - Einladungslink: Admin-Seite `/admin/users` «Einladungslink erzeugen» oder `POST /api/invitations`.
  - Admin-API: `GET /api/admin/users`, `POST /api/admin/users/{uid}/role`,
    `POST /api/admin/users/{uid}/disabled`. Die Seite `/admin/users` nur für Admins.

## Ersten Admin einrichten

Der Initialadmin entsteht beim Start der Function (F-012). Die Adresse steht in
`INITIAL_ADMIN_EMAIL` (Standard: `glamhack@x99.ch`). Das Passwort kommt aus
`INITIAL_ADMIN_PASSWORD`, nur wenn der Account neu angelegt wird. Ein bestehender Account
behält sein Passwort und bekommt nur die Rolle `admin`. Ohne Passwort und ohne Account startet
die App trotzdem, legt aber keinen Admin an.

Anmelden geht über die nicht verlinkte Seite `/login` mit E-Mail und Passwort.

Weitere Admins kommen über Einladungslinks (Admin-Seite `/admin/users`). Jeder Link ist
einmal einlösbar und läuft nicht ab; wer ihn einlöst, wird Admin.

Der frühere Befehl `cmd/setup-admin` macht einen bestehenden Account einmalig zum Admin. Er
bleibt für Projekte, die vor F-012 angelegt wurden.

```sh
go run ./cmd/setup-admin -project glamhack-hack-2026 admin@example.ch
```

### Konfiguration

| Variable | Zweck |
| --- | --- |
| `SITE_PASSWORD` | Gemeinsames Seitenpasswort (F-038); ohne Wert bleibt die App offen, mit Warnung im Log |
| `INITIAL_ADMIN_EMAIL` | Adresse des Initialadmins (Standard `glamhack@x99.ch`) |
| `INITIAL_ADMIN_PASSWORD` | Passwort, nur beim Neuanlegen. Gehört in den Secret Manager, nicht in den Quelltext |

Vor dem ersten Deploy mit F-012 muss `INITIAL_ADMIN_PASSWORD` im Secret Manager liegen und
am Cloud-Run-Dienst als Secret eingebunden sein, zum Beispiel über
`--set-secrets INITIAL_ADMIN_PASSWORD=<secret-name>:latest`. Die Secret-Zuordnung steht in `cloudbuild.yaml`; ein fehlendes Secret bricht den Deploy ab.

## Seitenpasswort (F-038)

Mit `SITE_PASSWORD` schützt der Go-Server die gesamte App: Seiten, API, Bilder, Assets und
auch `/login` sowie die Rechtsseiten. Nur `/access` und `/robots.txt` bleiben ohne Freigabe
erreichbar. Die Passwortseite funktioniert ohne Firebase und zeigt deutsche oder englische
Texte nach `Accept-Language`. Nach der Eingabe geht es zurück zur angefragten internen Adresse.

Die Freigabe gilt 30 Tage. Das signierte Cookie `access` ist HttpOnly, Secure und SameSite=Lax;
es enthält kein Passwort. API-/Asset-Anfragen ohne Freigabe erhalten `401`, Seitenaufrufe eine
Weiterleitung. Geschützte Antworten sind nicht cachebar. Die Firebase-Anmeldung für Admins
bleibt zusätzlich erforderlich. Ohne gesetztes Passwort bleibt alles offen, mit einer einmaligen
Warnung beim ersten Request. Eine geänderte Konfiguration wird beim Instanzstart eingelesen.

**Lokal ist kein Seitenpasswort nötig.** `SITE_PASSWORD` nicht setzen; die App ist dann direkt
zugänglich. Falls die Variable noch in deiner Shell gesetzt ist, mit `unset SITE_PASSWORD` entfernen.
Es muss keine `.env` angelegt oder geladen werden.

Das Passwort für **Produktion** setzt dieses Skript:

```sh
./scripts/set-site-password.sh
```

Es fragt das neue Passwort zweimal verdeckt ab, legt das Secret `SITE_PASSWORD` an oder fügt
eine neue Version hinzu und gewährt dem tatsächlichen Cloud-Run-Laufzeit-Servicekonto Zugriff.
Das Passwort landet weder in einer lokalen Datei noch als Argument in der Kommandozeile.
Voraussetzungen: installierte und angemeldete Google Cloud CLI (`gcloud auth login`),
ein bestehender Cloud-Run-Dienst sowie Rechte zur Secret-Verwaltung und zum Lesen des Dienstes.
Projekt, Dienst und Region sind vorbelegt; Optionen zeigt `./scripts/set-site-password.sh --help`.

Anschließend die App neu deployen. `cloudbuild.yaml` bindet `SITE_PASSWORD:latest` ein;
das Secret muss vor dem Deploy existieren. Zum Ändern des Passworts dasselbe Skript erneut
aufrufen und danach neu deployen. Das Skript führt selbst keinen Deploy durch.

Nach vollständigem Austausch der alten Instanzen sind alle bisherigen Freigaben ungültig.
Nach fünf falschen Eingaben pro IP antwortet der Server 15 Minuten mit `429` und `Retry-After`,
auch bei richtigem Passwort. Die Zähler gelten je Instanz und sind auf 10 000 Einträge begrenzt;
bei voller Tabelle werden neue Clients bis zur Freigabe von Platz zurückgewiesen. Die Client-IP
kommt aus dem ersten `X-Forwarded-For`-Eintrag, sofern dieser eine gültige IP enthält,
sonst aus `RemoteAddr`. Diese Bremse
setzt einen vertrauenswürdigen Proxy voraus und ersetzt keine zentrale Missbrauchskontrolle.

## ICOM-Kategorien und Orte

Jede Idee kann mehrere ICOM-Kategorien und einen oder mehrere Orte haben (Felder
`icom_categories` und `locations`). Die Kategorien und ihre Labels (de/en) stehen in
`frontend/src/data/icom-filter-kategorien.json`. Das Backend prüft dieselben IDs in
`ideas_icom.go`. Ein Go-Test meldet, wenn die beiden Listen auseinanderlaufen. Wer die JSON-Datei
ändert, passt also auch `ideas_icom.go` an.

- **Übersicht `/ideas`:** Filterleiste. Innerhalb der Kategorien und innerhalb der Orte gilt ODER,
  zwischen Kategorie und Ort UND. Der Filter steht in der URL, z. B.
  `/ideas?categories=accessibility,dialogue-exchange&locations=online`.
- **Bearbeiten:** Chips im Ideenformular.
- **CSV-Import:** optionale Spalten `ICOM categories` und `Location`, IDs getrennt mit `;`.

Bestehende Ideen bekommen ihre Werte über `cmd/assign-icom` und die Zuordnung in
`cmd/assign-icom/zuordnung.json` (Titel → IDs). Ohne `-apply` ist es ein Probelauf, der nur zeigt,
was sich ändern würde. Ideen, die schon Werte haben, bleiben unverändert, ausser mit `-overwrite`.

```sh
go run ./cmd/assign-icom -project glamhack-hack-2026          # Probelauf
go run ./cmd/assign-icom -project glamhack-hack-2026 -apply   # schreiben
```

## Lokal bauen und testen

```sh
cd frontend && npm install && npm run build && cd ..  # Typprüfung, dann erzeugt static/app
cd frontend && npm run typecheck && npm test && cd ..  # tsc --noEmit, Vitest
go vet ./... && go test ./...
```

`npm run dev` startet den Vite-Entwicklungsserver (unter `/app/`).

## Freigabe von Ideen (F-030)

Neue und geänderte Ideen haben den Status `pending`. Nur Admins sehen sie (Übersicht, Detailseite, Bilder), für alle anderen antwortet die API mit 404. Admins veröffentlichen oder lehnen auf `/admin/approvals` ab. Ideen ohne Statusfeld gelten als `published`, der Admin-CSV-Import veröffentlicht sofort. Beim Einreichen geht eine Mail an alle aktiven Admins, mit Link aus `APP_BASE_URL`. **Der Mail-Anbieter ist noch nicht gewählt** (F-030 D8): bis dahin verwendet der Server `logMailer`, der nur ins Log schreibt. Ein echter Versand braucht eine Implementierung von `Mailer` (`ideas_status.go`) und die Auswahl in `newServer`.

## ICOM-Kriterien (F-035)

`frontend/src/data/icom-filter-kategorien.json` ist die einzige Quelle der ICOM-Kategorien und Orte. Das Frontend liest daraus Beschriftungen, Beschreibungen und Referenzen, der Go-Code bettet die Datei per `go:embed` ein und leitet die gültigen IDs daraus ab (eine kaputte Datei stoppt den Start). Deshalb nimmt `.gcloudignore` genau diese Datei vom Ausschluss von `frontend/` aus. Die Übersicht filtert Kategorien mit UND (eine Idee braucht alle gewählten), Orte mit ODER, Kategorie und Ort zusammen mit UND.

## Papierkorb (F-033)

Admins löschen Ideen weich: `DELETE /api/ideas/{id}` setzt nur `deleted_at`. Übersicht, Detail, Bilder, Bearbeiten, Freigaben und `{{allideas}}` übergehen solche Ideen über den einen Filter `visibleTo`. Unter `/admin/trash` stellt ein Admin sie samt Bildern wieder her. Der CSV-Import zählt gelöschte Ideen weiter als vorhanden, damit ein Re-Import keine Dublette anlegt. Projektname, Claim und Kontakt stehen in `frontend/src/brand.ts`.

## Links bei Ideen (F-031)

Jede Idee kann bis zu 20 Links haben (Adresse nur `http`/`https`, optionaler Titel, ein Typ). Die Typen liegen in der Firestore-Collection `link_types` und werden unter `/admin/link-types` gepflegt. Beim ersten Start legt der Server `Tools`, `Reference` und `Institutes` an, wenn die Collection leer ist. Ein Typ, der noch in einer Idee vorkommt, lässt sich nicht löschen (die Idee speichert `link_type_ids` für diese Abfrage; die Abfrage `array-contains` braucht keinen zusammengesetzten Index). Der Export (AC-031-10) wartet auf F-010.

## Keine Indexierung (F-032)

Die App ist per `/robots.txt`, dem Header `X-Robots-Tag: noindex, nofollow` und `<meta name="robots">` von Suchmaschinen ausgenommen. Bekannte Crawler und KI-Bots (User-Agent, Liste in `robots.go`) bekommen auf allen Routen ausser `/robots.txt` ein 403. Neue Bots werden nur in `robots.go` ergänzt. Bereits indexierte Seiten müssen über die Search Console der Suchmaschinen entfernt werden.

## Deploy

Der Build läuft in Cloud Build (`cloudbuild.yaml`): `npm ci` und `npm run build` in `frontend/`,
dann `gcloud run deploy`. Lokal vor dem Deploy `npm run build` ausführen, damit `static/app`
aktuell ist.

```sh
gcloud run deploy glamhack-app --source . --function Handler --base-image go127 \
  --region us-central1 --project glamhack-hack-2026 --allow-unauthenticated \
  --memory 256Mi --min-instances 0 --max-instances 2 --timeout 60 \
  --set-env-vars PROJECT_ID=glamhack-hack-2026,BUCKET_NAME=glamhack-hack-2026-files \
  --set-secrets INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest,SITE_PASSWORD=SITE_PASSWORD:latest \
  --set-build-env-vars GOFLAGS=-buildvcs=false
```

Die App läuft unter `https://glamhack-app-966336370599.us-central1.run.app`, also ohne Präfix,
damit die Links `/login` und `/admin/users` stimmen. `/app/` leitet auf `/` weiter.

Die Firebase-Web-Konfiguration in `frontend/.env.production` ist öffentlich. Sicherheit kommt aus
Firebase Auth und der Prüfung im Backend.
