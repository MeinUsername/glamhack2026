---
id: F-038
title: Erstelle eine Seite, welche als Passwort dient, damit nicht einfach jemand darauf zugreifen kann
status: done
---

# F-038 Erstelle eine Seite, welche als Passwort dient, damit nicht einfach jemand darauf zugreifen kann

## Beschreibung

# Erstelle eine Seite, welche als Passwort dient, damit nicht einfach jemand darauf zugreifen kann

- Passwort über Konfiguration zu setzen und sollte nicht im Git autauchen.

## Ziel

Die App ist nur für Besucher zugänglich, die ein gemeinsames Seitenpasswort kennen. Ohne dieses Passwort sieht niemand Ideen, Bilder, API-Daten oder Admin-Login. Das Passwort steht in der Konfiguration und nie im Git.

## Umfang

**Enthalten**

- **Passwortseite `/access`:** Formular mit einem Passwortfeld. Bei richtiger Eingabe setzt der Server ein Cookie (HttpOnly, Secure, SameSite=Lax) und leitet auf die ursprünglich angefragte Seite zurück.
- **Gesamte App geschützt:** Seiten, API (`/api/...`), Bilder, Assets, `/login`, `/register` und alle Admin-Routen verlangen die Freigabe. Ausnahmen: die Passwortseite samt ihrem Prüf-Endpunkt und `/robots.txt` (F-032).
- **Aufruf ohne Freigabe:** Seitenaufrufe werden auf `/access` weitergeleitet, mit Rücksprungadresse (nur interne Pfade erlaubt). API- und Bildanfragen ohne Freigabe antworten mit `401`.
- **Freigabedauer:** 30 Tage. Das Cookie enthält keinen Klartext, sondern ein signiertes Token, das bei Änderung des Passworts ungültig wird.
- **Konfiguration:** Umgebungsvariable `SITE_PASSWORD`. In Produktion kommt sie aus dem Secret Manager, lokal aus einer nicht eingecheckten Datei (`.env`, in `.gitignore`). Das Passwort steht in keiner eingecheckten Datei, auch nicht in Tests oder `cloudbuild.yaml`.
- **Ohne konfiguriertes Passwort:** Der Schutz ist aus, die App bleibt offen (lokale Entwicklung, Tests). Beim Start steht dazu eine Warnung im Log.
- **Raten-Schutz:** Nach mehreren Fehlversuchen pro IP-Adresse wird die weitere Eingabe zeitweise gesperrt (Antwort `429`). Der Vergleich des Passworts läuft in konstanter Zeit.
- **Admin-Login:** `/login` liegt hinter dem Seitenpasswort; der Admin gibt zuerst das Seitenpasswort ein, danach meldet er sich mit Firebase an. Beide Schutzstufen sind unabhängig.
- Die Antworten der Passwortseite tragen `noindex` (F-032).

**Nicht enthalten**

- Persönliche Konten oder Passwörter je Besucher (es gibt genau ein gemeinsames Passwort).
- Abmelden-Knopf, Passwort-Änderung in der Oberfläche; Änderung nur über die Konfiguration.
- Ausnahme für Impressum, Nutzungsbedingungen und Datenschutz (F-036, F-037): sie sind nur nach Freigabe sichtbar.
- Ersatz der Firebase-Anmeldung für Admins (F-012 bleibt).

## Entscheidungen

- **D1 (Q-038-01):** Alles ausser Passwortseite und `/robots.txt` ist geschützt, einschliesslich API, Bilder und Admin-Login.
- **D2 (Q-038-02):** Eigene Passwortseite mit Formular und Cookie-Session, kein Basic Auth, kein Passwort im Link.
- **D3 (Q-038-03):** Freigabe 30 Tage gültig.
- **D4 (Q-038-04):** Passwort über Umgebungsvariable `SITE_PASSWORD` (Secret Manager bzw. lokale, nicht eingecheckte Datei).
- **D5 (Q-038-05):** Fehlt das Passwort, ist der Schutz aus.
- **D6 (Q-038-06):** Sperre pro IP nach Fehlversuchen.
- **D7 (Q-038-07):** `/login` braucht zusätzlich das Seitenpasswort.
- **D8 (Q-038-08):** Ohne Passwort erreichbar sind nur die Passwortseite und `/robots.txt`.
- **D9 (Q-038-09):** Weiterleitung auf `/access` mit Rücksprung nach der Eingabe; API antwortet `401`.

## Hinweise

- Wirkt zusammen mit F-012 (öffentliche Nutzung), F-032 (robots, Bot-Sperre) und F-036/F-037 (Rechtsseiten, jetzt hinter dem Passwort).
- Offen für den Plan: Schwellwert und Dauer der IP-Sperre (Vorschlag: 5 Fehlversuche, 15 Minuten); Cloud Run hat mehrere Instanzen, ein Zähler pro Instanz im Speicher genügt als Bremse.
