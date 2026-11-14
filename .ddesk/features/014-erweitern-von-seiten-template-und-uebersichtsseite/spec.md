---
id: F-014
title: Erweitern von Seiten Template und Übersichtsseite
status: review
---

# F-014 Erweitern von Seiten Template und Übersichtsseite

## Beschreibung

### Ziel

Das Seiten-Template aus F-002 (mit der Erweiterung aus F-009) wird um die Felder einer neuen Vorlage ergänzt, die als erste Zeile der Notiz steht. Die Felder der Vorlage werden mit den bestehenden zusammengeführt. Wo die Vorlage einen bestehenden Begriff anders benennt oder anders typisiert, gilt die Entscheidung aus den Rückfragen. Die Übersichtsseite wird erweitert, soweit die Rückfragen das festlegen.

Ausgangsnotiz des Nutzers (erste Zeile):

> Title · description of idea · description of interaction · goal · target group · equipment needed · space needed · staff needed · necessarily related to specific exhibits · accessibility · picture

### Umfang

- Felder des Seiten-Templates: Ergänzung um die neuen Felder und Zusammenführung mit den bestehenden Feldern (siehe Tabelle).
- Erfassungsformular, Speichern und Abruf der neuen Felder mit der Seite (wie F-002).
- Übersichtsseite: Anzeige gemäss Entscheidung D6.

Nicht Teil dieses Features: Filtern oder Sortieren der Übersichtsseite nach neuen Feldern, Export der neuen Felder (gehört zu F-010, falls dort relevant), Übersetzung der Labels.

### Felder nach Zusammenführung

| Feld (Vorlage) | Bestehendes Feld | Art | Status |
|---|---|---|---|
| Title | Titel (F-002) | Text, keine Pflicht | bestehend |
| description of idea | Beschreibung (F-002) | Text, keine Pflicht | bestehend |
| description of interaction | – | Text | neu |
| goal | Goal (F-002) | Text, keine Pflicht | bestehend |
| target group | Zielpublikum (F-002), Schlüssel `target_group` | Text, keine Pflicht | bestehend, umbenannt (D1) |
| equipment needed | Needed Equipment (F-002) | Chip-Liste mit Autocomplete | bestehend |
| space needed | Needed Space (F-002) | strukturiert: Fläche m², Volumen m³ | bestehend (D2) |
| staff needed | – | Text | neu (D4) |
| necessarily related to specific exhibits | – | Text | neu (D4) |
| accessibility | Accessibility (F-002) | Text, keine Pflicht | bestehend |
| picture | Bilder der Idee (F-002) | Upload, bis 5 Bilder, JPG/PNG/WebP, je max. 5 MB | bestehend, unverändert (D3) |

Bestehende Felder, die die Vorlage nicht nennt, bleiben erhalten (D5): Sustainability (F-002), Budget S/M/L/XL (F-002), Categories of critical art mediation (F-009).

### Entscheidungen

- **D1 (Q-014-01):** Das Feld «target group» wird mit «Zielpublikum» zusammengeführt. Das bestehende Feld wird umbenannt in `target_group`.
- **D2 (Q-014-02):** «Space needed» bleibt strukturiert, wie in F-002: Fläche in m² und Volumen in m³, je eine Zahl.
- **D3 (Q-014-03):** Bilder bleiben wie in F-002: bis 5 Bilder, Formate JPG, PNG, WebP, je max. 5 MB.
- **D4 (Q-014-04, Q-014-07):** «description of interaction», «staff needed» und «necessarily related to specific exhibits» sind Textfelder. Die Antwort auf Q-014-04 war widersprüchlich («Alle drei als Text» mit dem Freitext «…als boolean»). Die Rückfrage Q-014-07 hat «Alle drei als Text» bestätigt.
- **D5 (Q-014-05):** Sustainability, Budget und die Kategorien aus F-009 bleiben erhalten.
- **D6 (Q-014-06, nicht beantwortet):** Die Übersichtsseite zeigt Titel, Bild und Kurzbeschreibung wie bisher. Die Frage war nicht blockierend und blieb ohne Antwort; die Empfehlung wird übernommen. Zu prüfen beim Plan.

### Abhängigkeiten

- **F-002 Eine Seite-Template:** Die Felder werden dem Template hinzugefügt, Erfassung, Speichern und Abruf kommen von dort.
- **F-009 Kategorien hinzufügen zu Seiten Template:** Die Kategorien bleiben erhalten (D5).
- **F-011 Übersichtseite aller Ideen:** Die Übersichtsseite aus F-011 ist die Grundlage für die Erweiterung in D6.

### Offene Punkte für den Plan

- Übersichtsseite (D6) ist nicht beantwortet. Die Empfehlung gilt, bis der Nutzer anders entscheidet.
- Schlüsselnamen der neuen Felder im Endpoint (`description_of_interaction`, `staff_needed`, `exhibit_related` o. ä.).
- Die Labels in der Oberfläche sind wie in F-002 offen: englisch wie in der Vorlage oder deutsch.
- Der Begriff «Übersichtsseite» im Feature-Titel ist nicht im Glossar; das Glossar des Projekts ist leer (`ddesk glossary find` liefert keine Treffer).

### Akzeptanzkriterien

Siehe `acceptance.md`.
