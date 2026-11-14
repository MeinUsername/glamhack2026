---
id: F-035
title: ICOM Kriterien
status: done
---

# F-035 ICOM Kriterien

## Beschreibung

## Ziel

Die ICOM-Kriterien (Kategorien mit Beschreibung und ICOM-Referenzen) haben genau eine Quelle: die JSON-Datei `frontend/src/data/icom-filter-kategorien.json`. Backend und Frontend leiten alle Kriterien daraus ab. Die Filterlogik der Übersicht wird zum Mehrfachfilter mit UND-Verknüpfung der Kategorien.

## Ausgangslage

F-024 liefert bereits die Felder `icomCategories` und `locations` bei den Ideen, die Prüfung im Backend, die Filterleiste mit URL-Zustand, Chips im Formular und den CSV-Import. Die Kategorie-IDs stehen aber doppelt vor: in der JSON-Datei und als Liste in `ideas_icom.go` (ein Test hält beide im Gleichlauf). F-035 schliesst diese Lücke und ändert die Filterlogik.

## Umfang

- Backend liest die Kriterien aus derselben JSON-Datei (`go:embed`), die Liste `icomCategoryIDs` in `ideas_icom.go` entfällt. Die Datei muss im Deploy enthalten sein (`.gcloudignore` schliesst `frontend/` heute aus, die Ausnahme ist Teil der Umsetzung).
- Mehrfachfilter: gewählte Kategorien sind UND-verknüpft, eine Idee muss alle gewählten Kategorien haben.
- Kategorie-Beschreibungen erscheinen in der Filterleiste, die ICOM-Referenzen (`icomRefs`, z. B. S.2) auf der Ideen-Detailseite.

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Was leistet F-035 über F-024 hinaus? | Kriterien aus der JSON-Datei laden statt IDs im Go-Code zu duplizieren |
| Quelle der Kriterien | `frontend/src/data/icom-filter-kategorien.json` bleibt einzige Quelle, das Backend bindet sie per `go:embed` ein |
| Verknüpfung der Kategorien | UND (Idee hat alle gewählten Kategorien); löst das ODER aus F-024 (AC-024-4) ab |
| Anzeige | Beschreibung im Filter, Referenzen auf der Detailseite |
| Reichweite | nur Ideenübersicht, nicht Prompt-Generator oder Export |

## Annahmen (bitte prüfen)

- *Orte bleiben ODER-verknüpft, zwischen Kategorien und Orten gilt weiter UND; die Antwort zu Frage 3 betraf nur die Kategorien.*
- *Das Datenformat der Ideen (`icomCategories`, `locations`) ändert sich nicht, bestehende Daten bleiben gültig.*

## Nicht im Umfang

- Pflege der Kriterien in der Oberfläche
- neue Felder oder Kriterien-Ebenen
- Filter im Prompt-Generator oder Export
