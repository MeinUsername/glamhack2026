---
id: F-031
title: Upload Section
status: done
---

# F-031 Upload Section

## Beschreibung

# Upload Section

- Reference Section with Links
- Typing of Links (Tools, Reference, Institutes)

### Ziel

Eine Idee kann eine Referenzsektion mit Links tragen. Jeder Link hat einen Typ (anfangs Tools, Reference, Institutes), damit Leser Werkzeuge, Quellen und beteiligte Institute auf einen Blick finden.

### Umfang

- **Zugehörigkeit:** Die Links gehören zu einer Idee und sind eine Erweiterung der Idee (kein eigenes Objekt, keine globale Seite).
- **Link-Felder:** URL, Titel, Typ.
- **Typen:** Admin-pflegbare Liste, vorbelegt mit Tools, Reference, Institutes. Neue Admin-Seite «Link-Typen» (anlegen, umbenennen, löschen); Verhalten beim Löschen eines benutzten Typs ist in der Planung festzulegen (Vorschlag: Löschen nur, wenn kein Link den Typ nutzt).
- **Erfassen:** Auf dem Ideenformular (Anlegen und Bearbeiten), ohne Login wie das übrige Formular (F-012). Position: nach der Credit Line (F-027), vor dem Mediation Concept (bleibt letztes Feld, F-026).
- **Grenzen:** Links sind optional, höchstens 20 pro Idee.
- **URL-Prüfung:** Nur `http` und `https`, in Frontend und Backend.
- **Detailseite:** Abschnitt an gleicher Position, gruppiert nach Typ mit Überschrift je Typ; ohne Links entfällt der Abschnitt. Links öffnen in neuem Tab mit `rel="noopener noreferrer"`.
- **Master-Prompt:** Links einer Idee erscheinen im Prompt als Liste je Typ (`frontend/src/prompt/render.ts`).
- **Export/Import (F-010, F-015):** Links werden mitgeführt. Kein Filter nach Link-Typ (F-024), keine Anzeige in der Übersicht.
- **Freigabe (F-030):** Eine Änderung der Links zählt als Änderung der Idee und setzt sie zurück in die Prüfung.
- **Mehrsprachigkeit (F-007):** Oberflächentexte übersetzt; die Namen der Typen sind Admin-Daten (siehe O1).

Nicht Teil dieses Features: Datei-Upload (nur Links), Filter nach Typ, Anzeige in der Übersicht.

### Entscheidungen

- **D1 (Q-031-07):** Links gehören pro Idee (Formular und Detailseite).
- **D2 (Q-031-08):** Erfassen und Bearbeiten für alle wie beim Ideenformular, ohne Login.
- **D3 (Q-031-09):** Ein Link hat URL, Titel und Typ.
- **D4 (Q-031-10):** Typen sind durch Admins pflegbar, nicht fest.
- **D5 (Q-031-11):** Detailseite gruppiert nach Typ.
- **D6 (Q-031-12):** Abschnitt nach Credit Line, vor Mediation Concept.
- **D7 (Q-031-13):** Optional, höchstens 20 Links.
- **D8 (Q-031-14):** URL nur http/https, Prüfung in Frontend und Backend.
- **D9 (Q-031-15):** Nur Links, kein Datei-Upload.
- **D10 (Q-031-16):** Links erscheinen im Master-Prompt als Liste je Typ.
- **D11 (Q-031-17):** Export/Import führen Links mit; kein Filter.
- **D12 (Q-031-18):** Neuer Tab mit `rel="noopener noreferrer"`.
- **D13 (Q-031-19):** Freigabe (F-030) und Mehrsprachigkeit (F-007) gelten.

Die Antworten Q-031-01 bis Q-031-06 stammen aus einer früheren Runde. Ihre Fragetexte liegen nicht im Feature-Ordner vor; sie sind hier nicht eingearbeitet (siehe O3).

### Offene Punkte (Vorschlag, zu bestätigen)

- **O1:** Typ-Namen sind Admin-Daten (D4) und passen schlecht zu fest übersetzten Texten (D13). Vorschlag: Ein Typ hat einen deutschen und einen englischen Namen, die Admin-Seite pflegt beide.
- **O2:** Reihenfolge der Gruppen und Links. Vorschlag: Gruppen nach Sortierung der Typen (Admin änderbar), Links innerhalb eines Typs in Eingabereihenfolge.
- **O3:** Q-031-01 bis -06 prüfen: Falls diese Antworten Entscheidungen enthalten, die den obigen widersprechen, bitte nachtragen.
- **O4:** Anonymes Bearbeiten (D2) erlaubt es jedem, Links zu setzen (Spam-Gefahr). Vorschlag: durch die Freigabe (D13) abgedeckt, keine weitere Massnahme.
- **O5:** Typ löschen, der noch genutzt wird: Vorschlag Löschen blockieren mit Hinweis.

### Abhängigkeiten

- **F-007:** Mehrsprachigkeit, **F-010/F-015:** Export und Import, **F-012:** Bearbeiten ohne Login, **F-026:** Position des Concepts, **F-027:** Credit Line, **F-030:** Freigabe.

### Akzeptanzkriterien

Siehe `acceptance.md`.
