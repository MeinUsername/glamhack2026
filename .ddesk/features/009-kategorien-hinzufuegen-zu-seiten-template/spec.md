---
id: F-009
title: Kategorien hinzufügen zu Seiten Template
status: done
---

# F-009 Kategorien hinzufügen zu Seiten Template

## Beschreibung

### Ziel

Das Seiten-Template aus F-002 erhält eine Mehrfachauswahl «Categories of critical art mediation» mit den vier Kategorien Affirmative, Reproductive, Deconstructive und Transformation. Jede Kategorie ist im Tooltip mit einer kurzen Erklärung hinterlegt, damit Erfassende die Einordnung nachvollziehen können.

### Umfang

- Mehrfachauswahl mit den vier Kategorien im Erfassungsformular der Seite.
- Tooltip am Feldtitel mit der Erklärung je Kategorie.
- Speichern der Auswahl zusammen mit der Seite.
- Anzeige der gewählten Kategorien auf der Darstellung der Seite.
- Validierung der Auswahl (siehe Entscheidungen).

Nicht Teil dieses Features: Filtern oder Auflisten von Seiten nach Kategorie, Mindest- oder Höchstanzahl, Übersetzung von Labels und Erklärungen.

### Kategorien

| Option (Label) | Erklärung im Tooltip |
|---|---|
| Affirmative | Die Vermittlung kommuniziert die Aufgaben des Museums nach außen. Kunst gilt als Fachdomäne; Angebote wie Vorträge, Kataloge und Expertenführungen richten sich an das Fachpublikum. |
| Reproductive | Die Vermittlung bildet das Publikum von morgen heran und baut Schwellenängste ab. Angebote richten sich an Schulklassen, Familien und Menschen mit besonderen Bedürfnissen. |
| Deconstructive | Die Vermittlung hinterfragt Museum, Kunst und Kanonisierung gemeinsam mit dem Publikum. Interventionen und kritische Führungen stehen im Vordergrund. |
| Transformation | Die Vermittlung erweitert die Funktionen der Institution und verändert sie in Zusammenarbeit mit dem Publikum. Projekte mit Interessengruppen gehören dazu. |

Tooltip-Kopf (Einleitung): «Am Kreuzungspunkt von vier Diskursen: Die documenta 12 Vermittlung zwischen Affirmation, Reproduktion, Dekonstruktion und Transformation».

Quelle im Tooltip: Carmen Mörsch, 2009, documenta-12-Vermittlung. Die Erklärungen sind eigene Kurzfassungen des Textes, kein wörtlicher Abdruck.

### Entscheidungen

- **Auswahl:** Mehrfachauswahl. Beliebig viele Kategorien, auch keine. Das Feld ist nicht Pflicht.
- **Validierung:** Zulässig sind nur die vier Werte. Ein anderer Wert wird abgelehnt. Eine doppelt übermittelte Kategorie wird nur einmal gespeichert.
- **Werte:** Als Schlüssel `affirmative`, `reproductive`, `deconstructive`, `transformation`. Die Labels sind englisch, wie in der Vorlage.
- **Tooltip:** Am Feldtitel. Er zeigt den Tooltip-Kopf und je Kategorie die Erklärung aus der Tabelle, mit Quellenangabe.
- **Anzeige:** Gewählte Kategorien erscheinen als Chips unter dem Seitentitel. Ohne Auswahl entfällt der Chip-Block.
- **Speicherung:** Die Auswahl gehört zur Seite (F-002) und wird mit ihr gespeichert und abgerufen.

### Abhängigkeiten

- **F-002 Eine Seite-Template:** Das Feld wird dem Template hinzugefügt. Erfassung, Speichern und Abruf kommen von F-002.
- **F-001 Nutzerverwaltung:** Die Erfassung setzt eine Anmeldung voraus, unverändert zu F-002.

### Annahmen

- Der Tooltip hängt am Feldtitel und zeigt alle vier Erklärungen, nicht je Option ein eigener Tooltip.
- Die Vorlage schreibt «mdiation». Hier steht «mediation». Der Tippfehler ist korrigiert.
- Die Vorlage schreibt «Affimative». Hier steht «Affirmative».

### Offene Punkte für den Plan

- Form der Übermittlung der Auswahl im Endpoint von F-002 (Liste von Schlüsseln).
- Darstellung der Chips und des Tooltips in React (F-005).
- Bedienung des Tooltips auf Touch-Geräten.

### Akzeptanzkriterien

Siehe `acceptance.md`.
