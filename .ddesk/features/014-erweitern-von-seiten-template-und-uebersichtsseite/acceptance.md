---
id: F-014
next: 6
---

- **AC-014-1** Gegeben ein angemeldeter Nutzer / Wenn er eine Seite erfasst / Dann enthält das Formular die Felder Title, description of idea, description of interaction, goal, target group, equipment needed, space needed, staff needed, necessarily related to specific exhibits, accessibility und picture sowie Sustainability, Budget und die Kategorien.
- **AC-014-2** Gegeben eine Seite mit Werten in target group / Wenn sie gespeichert und wieder abgerufen wird / Dann ist der Wert unter dem Feld target_group erhalten und das alte Feld «Zielpublikum» ist nicht mehr vorhanden.
- **AC-014-3** Gegeben das Feld space needed / Wenn Fläche in m² und Volumen in m³ als Zahlen eingegeben werden / Dann werden beide Werte gespeichert und abgerufen; ein nicht-numerischer Wert wird abgelehnt.
- **AC-014-4** Gegeben die Felder description of interaction, staff needed und necessarily related to specific exhibits / Wenn eine Seite mit Text in diesen Feldern gespeichert wird / Dann bleibt der Text unverändert erhalten und wird beim Abruf zurückgegeben.
- **AC-014-5** Gegeben eine Seite mit Bildern / Wenn der Nutzer das sechste Bild oder ein Bild über 5 MB oder in einem anderen Format hochlädt / Dann wird der Upload abgelehnt und die bestehenden Bilder bleiben unverändert.
- **AC-014-6** Gegeben die Übersichtsseite aller Ideen / Wenn sie geöffnet wird / Dann zeigt sie je Idee Titel, Bild und Kurzbeschreibung wie bisher und keine der neuen Felder.
