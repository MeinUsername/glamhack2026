---
id: F-027
title: Credit Line and Contact Information
status: done
---

# F-027 Credit Line and Contact Information

## Beschreibung

# Credit Line and Contact Information

credit line and contact information auf der Edit und New Idea Seite
(optional field: format: first name, last name, Institute, email)

all fields are optional but have an placeholder

### Ziel

Eine Idee kann optional eine Credit Line und Kontaktangaben tragen (Vorname, Nachname, Institut, E-Mail), damit klar ist, von wem die Idee stammt und wen man dazu ansprechen kann.

### Umfang

- Vier getrennte, optionale Felder: Vorname, Nachname, Institut, E-Mail. Jedes Feld hat einen Platzhalter.
- Formular (Anlegen und Bearbeiten): Block «Credit Line and Contact Information» steht **vor** dem Mediation Concept (das Concept bleibt letztes Feld, F-026).
- Detailseite: gleicher Block als Abschnitt **vor** dem Mediation Concept; leere Angaben werden nicht angezeigt, ohne jede Angabe entfällt der Abschnitt.
- Die E-Mail ist öffentlich sichtbar (auch ohne Anmeldung, F-012) und wird als `mailto:`-Link dargestellt.
- E-Mail wird, falls ausgefüllt, auf gültiges Format geprüft (Frontend und Backend).
- Master-Prompt: Die Credit Line einer Idee mit Angaben wird in den Prompt aufgenommen (`frontend/src/prompt/render.ts`).

Nicht Teil dieses Features: Übersichtsseite, CSV-Import (F-015, liest und setzt die Felder nicht), Export.

### Entscheidungen

- **D1 (Q-027-01):** Detailseite zeigt den Block; Position vor dem Mediation Concept.
- **D2 (Q-027-02):** E-Mail ist öffentlich sichtbar, als mailto-Link.
- **D3 (Q-027-03):** Vier getrennte Felder statt Freitext.
- **D4 (Q-027-04):** E-Mail-Format wird geprüft.
- **D5 (Q-027-05):** Credit Line erscheint im Master-Prompt.
- **D6 (Q-027-06):** CSV-Import bleibt unverändert.
- **D7 (Q-027-07):** Im Formular steht der Block vor dem Mediation Concept.

### Abhängigkeiten

- **F-014:** Formular der Idee. **F-023 / F-026:** Mediation Concept und dessen Position. **F-012:** öffentliche Sicht. **F-003:** Master-Prompt.

### Akzeptanzkriterien

Siehe `acceptance.md`.
