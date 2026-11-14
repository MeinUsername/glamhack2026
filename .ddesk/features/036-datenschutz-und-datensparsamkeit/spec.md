---
id: F-036
title: Datenschutz und Datensparsamkeit
status: refining
---

# F-036 Datenschutz und Datensparsamkeit

## Beschreibung

Die Seite bekommt eine Datenschutzerklärung und die technischen Massnahmen, die sie voraussetzt. Aus dem Rechtstext-Entwurf «Impressum, Rechtstexte & To-Do» (14. Nov. 2026, noch nicht rechtlich geprüft) wurde gegen die Implementierung geprüft, was fehlt oder dem Text widerspricht. Dieses Feature deckt den Datenschutz-Teil ab; Impressum und Nutzungsbedingungen sind F-037, der Link «Melden» ist F-034.

### Ziel

Die Datenschutzerklärung beschreibt wahrheitsgemäss, was die Seite tut, und die Seite tut, was die Erklärung zusagt (Schweizer DSG, bei Nutzenden aus der EU DSGVO).

### Befund gegen die Implementierung (Stand `main`, 14. Nov. 2026)

| Aussage im Entwurf | Realität im Code | Folge |
|---|---|---|
| Keine externen Schriften | `frontend/index.html` lädt Figtree, DM Mono, Instrument Sans von `fonts.googleapis.com` / `fonts.gstatic.com` (IP-Adresse geht an Google) | Schriften selbst hosten |
| Metadaten (EXIF) der Bilder werden beim Hochladen entfernt | `ideas_images.go` prüft nur den Typ und schreibt die Bytes unverändert in den Bucket | Entfernen umsetzen |
| Löschung der Daten auf Anfrage | F-033 löscht weich (`deleted_at`); Felder und Bilder bleiben in Firestore und im Bucket | echter Löschpfad für Löschbegehren |
| Keine Namen oder E-Mails werden abgefragt | Credit Line (F-027): Vorname, Nachname, Institut, E-Mail; öffentlich auf der Detailseite und im Prompt-Export | Text anpassen oder Feld ändern (Rückfrage offen) |
| Kein Konto nötig | gilt nur fürs Einreichen; es gibt Konten per Einladung (Firebase Auth, E-Mail) | in «Welche Daten» und «Empfänger» aufnehmen (Firebase / Google) |
| Cookie nur für das Projektteam | Sitzungs-Cookie `session` (HttpOnly) für jede Anmeldung; zusätzlich Sprachwahl in `localStorage` | Abschnitt «Cookies und Speicher» korrigieren |
| Ideen sind sofort für alle sichtbar | erst nach Freigabe durch einen Admin (F-030) | Formulierung anpassen |
| Region [us-central1 / europe-west6] | Dienst läuft in `us-central1` (`cloudbuild.yaml`, README) | USA-Variante, oder Umzug |
| Datenschutz-Seite und Footer-Link | beides fehlt (Footer: nur Impressum und Nutzungsbedingungen) | anlegen |
| Ablaufdatum, nach dem Seite und Daten gelöscht werden | nichts umgesetzt | Rückfrage |

Was stimmt: Der Korb liegt nur im Browser (`localStorage`, nur Idee-IDs), es gibt keine Analyse- oder Werbewerkzeuge, der Prompt wird im Browser erzeugt (kein KI-Dienst), die Suchmaschinensperre aus F-032 ist da. Sobald der Mail-Anbieter aus F-030 (T11) feststeht, gehört er als Empfänger in die Erklärung; heute versendet die App keine Mails.

### Umfang

- **Datenschutz-Seite** `/privacy` (öffentlich, noindex), verlinkt in der Fusszeile jeder Seite, in de/en/fr/it. Inhalt nach dem Entwurf unten, mit den Korrekturen aus dem Befund.
- **Schriften selbst hosten** statt von Google laden; `preconnect` und Stylesheet-Link entfallen.
- **Bild-Metadaten entfernen** (EXIF, GPS, Kameradaten) beim Hochladen, vor dem Speichern, für Erstellen, Bearbeiten und CSV-Import mit Bildern.
- **Endgültig löschen** (Löschbegehren): ein Admin kann eine Idee aus dem Papierkorb (F-033) endgültig löschen; Dokument und Bilder im Bucket werden entfernt. Gemeint ist nur das Löschen auf Anfrage, kein Automatismus.
- **Aufbewahrung** der Server-Logs festlegen und in die Erklärung eintragen (Cloud-Run-Logs).
- **Ablaufdatum / Abschaltung:** Datum festlegen, bis zu dem Seite und Daten gelöscht werden, und in die Erklärung eintragen.
- Keine Cookies für Analyse oder Werbung, kein Tracking, keine externen Skripte (bleibt so; als Regressionstest absichern).

### Entwurf der Datenschutzerklärung (Quelle: Rechtstext-Entwurf, deutsch)

Platzhalter in `[ ]` füllt die Umsetzung nach den Antworten. `[prüfen]` bestätigt der Developer gegen den Code (siehe Befund).

1. **Verantwortlich:** Opendata.ch, 4000 Basel; Kontakt für alle Datenschutzfragen: goodquestion.glamhack@gmail.com. «Good Question – A Tool Kit for Art Mediation» ist ein Prototyp aus dem GLAMhack 2026, betreut vom Projektteam.
2. **Daten, Zweck, Dauer:** eingereichte Ideen (Titel, Beschreibungen, Angaben im Formular, Credit Line) zum öffentlichen Anzeigen; hochgeladene Bilder; technische Zugriffsdaten (IP-Adresse, Zeit, Seite, Browser, Betriebssystem) zum Betrieb und zur Missbrauchsabwehr, `[Anzahl]` Tage; E-Mails an die Projektadresse, inkl. Meldungen; Konten von Nutzenden und Admins (E-Mail, Rolle). Für das Einreichen einer Idee ist kein Konto nötig. Hinweis, nur Namen und Kontaktdaten Einverstandener zu nennen. Bild-Metadaten werden entfernt.
3. **Cookies und Speicher:** keine Cookies für Analyse oder Werbung; Korb und Sprachwahl nur im Browser; technisch nötiges Sitzungs-Cookie bei der Anmeldung.
4. **Kein Tracking, keine KI-Dienste;** keine externen Schriften.
5. **Empfänger:** Öffentlichkeit (freigegebene Ideen und Bilder), Google Cloud (Hosting, Auftragsbearbeitung), Firebase Authentication (Anmeldung), Gmail (Projektadresse), `[Mail-Anbieter aus F-030]`. Kein Verkauf, keine Werbung.
6. **Ausland:** Region `[us-central1 (USA) | europe-west6 (Zürich)]`; für die USA Swiss-U.S. Data Privacy Framework und Standardvertragsklauseln `[prüfen]`.
7. **Sicherheit:** HTTPS; nur das Projektteam hat Zugriff auf die Verwaltung.
8. **Rechte:** Auskunft, Berichtigung, Löschung, Widerspruch, Herausgabe; per E-Mail, Antwort in der Regel innert 30 Tagen (Titel oder Link der Idee nennen); Beschwerde beim EDÖB (edoeb.admin.ch); bei Wohnsitz in der EU Rechte nach DSGVO.
9. **Änderungen,** Stand-Datum.

### Nicht im Umfang

- Rechtliche Prüfung der Texte (bleibt offen, Entwurf).
- Impressum und Nutzungsbedingungen (F-037), Link «Melden» (F-034).
- Passwortschutz der Seite (die Suchmaschinensperre aus F-032 besteht; ein Passwort ist nicht geplant, siehe Rückfrage).

### Offene Fragen

Siehe die Rückfragen in ddesk. Akzeptanzkriterien folgen nach den Antworten; die vorläufigen stehen in `acceptance.md`.
