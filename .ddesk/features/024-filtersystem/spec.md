---
id: F-024
title: Filtersystem
status: review
---

# F-024 Filtersystem

## Beschreibung

# Filtersystem

- Filterkategorien für Ideen, abgeleitet aus dem ICOM Code of Ethics for Museums (2026)
- Zweiter Filter «Ort» (Im Museum, Ausserhalb, Online)
- Filterleiste auf der Ideen-Übersicht

### Ziel

Besuchende und Admins finden passende Ideen schneller: Die Übersicht lässt sich nach Themen aus dem ICOM Code of Ethics und nach dem Ort der Vermittlung filtern. Eine gefilterte Ansicht lässt sich als Link teilen.

### Umfang

- **Kategorien:** 15 Kategorien in 4 Gruppen (Menschen & Teilhabe, Zugang & Inklusion, Lernen & Reflexion, Verantwortung & Care), mit Labels und Beschreibungen in Deutsch und Englisch. Quelle: `frontend/src/data/icom-filter-kategorien.json`.
- **Orte:** Im Museum, Ausserhalb, Online (gleiche Datei, `secondaryFilters`).
- **Datenmodell:** Eine Idee hat `icom_categories` (Liste von Kategorie-IDs) und `locations` (Liste von Orts-IDs). Beide optional; die F-009-Kategorien bleiben unverändert daneben bestehen.
- **API:** `GET /api/ideas` und `GET /api/ideas/{id}` liefern `icomCategories` und `locations` (leere Listen für ältere Ideen). Anlegen und Bearbeiten nehmen beide Felder an; unbekannte IDs werden abgelehnt.
- **Übersicht:** Filterleiste als Seitenleiste links (auf schmalen Bildschirmen über den Ideen). Gruppen als Überschriften, die Unterkategorien als Chips; ein Schalter blendet alle Unterkategorien ein oder aus. Anzeige der Treffer («7 von 18 Ideen») und «Filter zurücksetzen».
- **Logik:** Innerhalb der Kategorien ODER, innerhalb der Orte ODER, zwischen Kategorie und Ort UND. Leere Auswahl filtert nicht.
- **URL:** Der Filter steht in der URL (`?categories=…&locations=…`), unbekannte IDs werden ignoriert.
- **Formular:** Kategorien und Orte als Chips im Ideenformular (Anlegen und Bearbeiten).
- **Detailseite:** Kategorien und Orte als Links auf die entsprechend gefilterte Übersicht.
- **CSV-Import (F-015):** Optionale Spalten «ICOM categories» und «Location», IDs getrennt mit `;` oder `,`, Gross-/Kleinschreibung egal. Unbekannte IDs machen die Zeile ungültig.
- **Bestehende Ideen:** Befehl `cmd/assign-icom` mit Zuordnung `cmd/assign-icom/zuordnung.json` (Titel → IDs). Ohne `-apply` ein Probelauf; Ideen mit vorhandenen Werten bleiben unverändert, ausser mit `-overwrite`.
- **Mehrsprachigkeit (F-007):** Labels der Kategorien in Deutsch und Englisch; Französisch und Italienisch zeigen Englisch (siehe O1). Oberflächentexte in allen vier Sprachen.

Nicht Teil dieses Features: Filter nach F-009-Kategorien, nach Link-Typ (F-031) oder nach Budget; serverseitiges Filtern.

### Entscheidungen

- **D1:** Die ICOM-Kategorien kommen zusätzlich zu den F-009-Kategorien, sie ersetzen sie nicht.
- **D2:** Mehrere Kategorien und mehrere Orte pro Idee.
- **D3:** ODER innerhalb einer Filterart, UND zwischen Kategorie und Ort.
- **D4:** Filterzustand in der URL, damit gefilterte Ansichten geteilt werden können.
- **D5:** Gefiltert wird im Browser; die Übersicht lädt alle Ideen (Menge klein).
- **D6:** Die JSON-Datei im Frontend ist die Quelle der Labels. Das Backend prüft dieselben IDs in `ideas_icom.go`, weil `frontend/` nicht deployt wird; ein Go-Test hält beide Listen gleich.
- **D7:** Unterkategorien werden nur gemeinsam ein- und ausgeblendet (Schalter), nicht pro Gruppe. Ein Link mit gewählter Kategorie schaltet sie ein.
- **D8:** Bestehende Ideen erhalten ihre Werte einmalig per Befehl, nicht automatisch.

### Offene Punkte (Vorschlag, zu bestätigen)

- **O1:** Französische und italienische Labels fehlen in der JSON-Datei. Vorschlag: `fr` und `it` ergänzen, sobald die Übersetzungen vorliegen; bis dahin Englisch.
- **O2:** Zuordnung der 18 Start-Ideen in `zuordnung.json` ist ein Vorschlag und fachlich zu prüfen, bevor `-apply` läuft.
- **O3:** Freigabe (F-030): Ob eine Änderung nur der Kategorien eine Idee zurück in die Prüfung setzt, ist zu klären. Vorschlag: ja, wie jede Änderung der Idee.
- **O4:** Der Go-Teil wurde ohne lokalen Go-Compiler geschrieben; `go vet` und `go test` müssen vor dem Merge grün sein.

### Abhängigkeiten

- **F-007:** Mehrsprachigkeit, **F-009:** bestehende Kategorien, **F-011:** Übersicht, **F-012:** Bearbeiten ohne Login, **F-015:** CSV-Import, **F-029:** versionierte Bild-URLs (Karten der Übersicht), **F-030:** Freigabe.

### Akzeptanzkriterien

Siehe `acceptance.md`.
