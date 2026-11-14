---
id: F-012
title: Public Usage
status: done
---

# F-012 Public Usage

## Beschreibung

# Public Usage

- Verschiede den Login auf eine "geheime" Unterseite /login, welche nur einen Admin Login hat.

- Admin können nur per Invite Link beitreten

- Nur Admin könne Invite Links generieren

- Der Initialadmin Email wird in der Konfiguration hinterlegt. Er ist aktuell glamhack@x99.ch

- Die normale User Nutzung braucht keinen Login mehr

## Ziel

Die App ist für alle Besucher ohne Anmeldung nutzbar. Anmeldung ist nur noch für Admins da, über eine nicht verlinkte Seite `/login`. Admins kommen nur über Einladungslinks in die App.

## Ausgangslage

- F-001 führt Rollen (Admin, User), Einladungslinks und E-Mail/Passwort-Login über Firebase Auth ein. Jeder registrierte Nutzer kann dort Einladungslinks erzeugen; die Links sind einmalig und 7 Tage gültig.
- Es gibt noch keine Nicht-Admin-Konten (Antwort Q-012-02).

## Umfang

**Enthalten**

- Die gesamte App ist ohne Login nutzbar: Ansehen, Anlegen und Bearbeiten von Ideen und Seiten, Korb (F-006), Übersicht (F-011), Export und Import (F-010), Mehrsprachigkeit (F-007).
- Login-Seite `/login` nur für Admins, mit der bestehenden Anmeldung aus F-001.
- Die Seite `/login` ist nicht aus der öffentlichen Oberfläche verlinkt und nur über die direkte URL erreichbar.
- Initialadmin: Die E-Mail-Adresse wird in der Konfiguration hinterlegt (aktuell glamhack@x99.ch). Beim Start wird dieser Admin automatisch angelegt und meldet sich über `/login` an.
- Einladungslinks: Nur Admins können sie erzeugen. Jeder Link ist einmalig nutzbar und läuft nicht ab. Dies ändert die Regel aus F-001 (7 Tage Gültigkeit).
- Bestehende Konten bleiben unverändert anmeldbar (Antwort Q-012-02).

**Nicht enthalten**

- Rate-Limit oder anderer Schutz von `/login` bei Fehlversuchen. Die Absicherung ist die nicht verlinkte URL.
- Eigene Anmeldemethode für Admins. Es bleibt bei E-Mail/Passwort aus F-001.
- Migration oder Löschung von Nicht-Admin-Konten.
- Ein Zugang für Nicht-Admins zu geschützten Funktionen. Es gibt keine geschützten Funktionen mehr außer dem Admin-Bereich.

## Entscheidungen

- **D1 Ohne Login alles öffentlich (Q-012-01).** Die gesamte Nutzung, einschließlich Anlegen und Bearbeiten von Ideen und Seiten, braucht keinen Login. Nur der Admin-Bereich ist geschützt.
- **D2 Bestehende Konten bleiben (Q-012-02).** Vorhandene Nicht-Admin-Konten aus F-001 werden nicht geändert. Da es noch keine gibt, entsteht kein Migrationsbedarf.
- **D3 Initialadmin per Konfiguration (Q-012-03).** Der Initialadmin wird aus der Konfiguration beim Start als Admin angelegt. Er meldet sich über `/login` an und braucht keinen Einladungslink.
- **D4 Admin-Login wie in F-001 (Q-012-04).** Anmeldung per E-Mail und Passwort über Firebase Auth, Mechanismus unverändert.
- **D5 Einladungslinks einmalig, ohne Ablauf (Q-012-05).** Jeder Admin-Einladungslink ist genau einmal einlösbar und hat kein Ablaufdatum. Das ändert F-001 (dort 7 Tage).
- **D6 `/login` nicht verlinkt (Q-012-06).** Die Seite erscheint in der öffentlichen Oberfläche nicht, auch nicht im Footer.
- **D7 Kein Rate-Limit (Q-012-07).** `/login` ist nur durch die geheime URL geschützt.
- **D8 Alle Admins dürfen einladen (Q-012-08).** Jeder Admin kann Einladungslinks erzeugen, nicht nur der Initialadmin.

## Offene Punkte

- Keine offenen Rückfragen.
- Hinweis zu D1: Da auch das Bearbeiten ohne Login möglich ist, kann jeder Besucher Ideen und Seiten ändern. Das ist die Entscheidung des Nutzers; Schutz gegen Mutwillen ist nicht Teil dieses Features.

## Akzeptanzkriterien

Siehe `acceptance.md`.
