---
id: F-002
title: Eine Seite-Template
status: done
---

# F-002 Eine Seite-Template

## Beschreibung

### Ziel

Ein Seiten-Template, mit dem Nutzer eine Ausstellungsidee als Seite erfassen und visualisieren können. Jede Ausstellungsidee ist eine gespeicherte Seite mit denselben Feldern.

### Umfang

- Erfassungsformular für eine Seite mit den Feldern unten.
- Speichern der Seite und Abruf der Inhalte über einen Backend-Endpoint.
- Darstellung der Seite im Frontend (React, siehe F-005).
- Hochladen von Bildern zur Idee.

Nicht Teil dieses Features: Bearbeiten und Auflisten mehrerer Seiten, Freigabe- oder Rollenlogik über die Erfassung hinaus, Export. Die Verwaltung der Seiten ist Gegenstand von F-004.

### Felder

| Feld | Art | Hinweis |
|---|---|---|
| Titel | Text | keine Pflicht |
| Beschreibung | Text | keine Pflicht |
| Bilder der Idee | Upload | bis 5 Bilder, Formate JPG, PNG, WebP, je max. 5 MB |
| Zielpublikum | Text | keine Pflicht |
| Needed Space | strukturiert | Fläche in m², Volumen in m³ (je Zahl) |
| Needed Equipment | Chip-Liste | Autocomplete über alle bisher erfassten Geräte; ein nicht vorhandenes Gerät wird als neuer Chip hinzugefügt |
| Goal | Text | keine Pflicht |
| Sustainability | Text | keine Pflicht |
| Accessibility | Text | keine Pflicht |
| Budget | Auswahl | genau eine Größe: S, M, L oder XL, ohne Erklärung je Größe |

### Entscheidungen

- **Speicherung:** Das Frontend rendert das Template in React. Das Backend speichert nur die Inhalte der Seite und liefert sie über einen Endpoint aus.
- **Pflichtfelder:** Keines. Eine leere Seite kann gespeichert werden.
- **Bilder:** Bis 5 Bilder je Idee, Formate JPG, PNG, WebP, je max. 5 MB.
- **Wer erfasst:** Alle angemeldeten Nutzer, also Rollen User und Admin.
- **Sprache:** Feldnamen und Code-Bezeichner durchgehend englisch (`sustainability`, `accessibility`, `space`, `equipment`, `budget` usw.). Die Feldnamen wurden auf Englisch belassen, nicht auf Deutsch übersetzt.
- **Needed Space:** Strukturiert in Fläche (m²) und Volumen (m³), beides als Zahl.
- **Needed Equipment:** Chip-Liste mit Autocomplete. Die Vorschläge kommen aus allen bisher erfassten Geräten. Ein neues Gerät wird übernommen, wenn es noch nicht vorhanden ist.
- **Budget:** Auswahl S / M / L / XL, ohne Richtwerte je Größe.

### Abhängigkeiten

- **F-001 Nutzerverwaltung:** Anmeldung und Rollen User/Admin. Die Erfassung setzt eine Anmeldung voraus.
- **F-005 React-Frontend:** Das Template wird in React umgesetzt.

### Offene Punkte für den Plan

- Form und Pfad des Endpoints (Speichern, Laden, Bild-Upload).
- Speicherort der Bilder.
- Die Beschriftung in der Oberfläche ist nicht ausdrücklich festgelegt. Die Antwort sieht englische Feldnamen vor. Ob die Labels im UI ebenfalls englisch sind, ist beim Plan zu klären.

### Akzeptanzkriterien

Siehe `acceptance.md`.
