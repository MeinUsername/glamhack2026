---
id: F-015
next: 8
---

- **AC-015-1** Gegeben ein Admin und eine CSV mit den Spalten der Ausgangsdatei / Wenn er die Datei hochlädt / Dann zeigt die Vorschau die Anzahl neuer, übersprungener und fehlerhafter Zeilen, und noch nichts ist gespeichert.
- **AC-015-2** Gegeben eine leere Instanz und die Ausgangsdatei / Wenn der Admin den Import bestätigt / Dann entsteht je Zeile eine Idee mit Titel und den Feldern laut Spalten-Zuordnung; «space needed» bleibt leer.
- **AC-015-3** Gegeben eine Zeile, deren Titel schon als Idee existiert (ohne Beachtung von Gross- und Kleinschreibung) / Wenn importiert wird / Dann wird sie übersprungen, in der Meldung genannt, und die bestehende Idee bleibt unverändert.
- **AC-015-4** Gegeben eine Zeile ohne Titel und weitere gültige Zeilen / Wenn importiert wird / Dann wird nur die fehlerhafte Zeile abgelehnt und gemeldet, die gültigen Zeilen werden gespeichert.
- **AC-015-5** Gegeben ein angemeldeter Nutzer ohne Admin-Rolle / Wenn er den Import aufruft / Dann wird er abgelehnt und nichts wird geändert.
- **AC-015-6** Gegeben die Zeile mit «equipment needed» = «e-ink device, wiring» / Wenn importiert wird / Dann entstehen die zwei Equipment-Chips «e-ink device» und «wiring».
- **AC-015-7** Gegeben die Ausgangsdatei / Wenn importiert wird / Dann bleiben Sustainability, Budget und Kategorien leer, und es werden keine Bilder angelegt.
