---
id: F-024
next: 11
---

# F-024 Akzeptanzkriterien

- **AC-024-1** Gegeben eine Idee / Wenn sie mit mehreren ICOM-Kategorien und Orten gespeichert wird / Dann sind beide Listen gespeichert, ohne Doppelte, in der Reihenfolge der ersten Nennung; beide sind optional.
- **AC-024-2** Gegeben eine unbekannte Kategorie- oder Orts-ID / Wenn eine Idee damit gespeichert werden soll / Dann lehnt das Backend mit einer Meldung ab.
- **AC-024-3** Gegeben eine Idee, die vor F-024 gespeichert wurde / Wenn sie über die API gelesen wird / Dann liefert die API leere Listen für `icomCategories` und `locations`.
- **AC-024-4** Gegeben die Übersicht / Wenn Kategorien gewählt werden / Dann erscheinen Ideen mit mindestens einer davon (ODER); mit zusätzlich gewählten Orten nur Ideen, die auch einen der Orte haben (UND).
- **AC-024-5** Gegeben eine Auswahl / Wenn sie sich ändert / Dann steht sie in der URL (`categories`, `locations`); ein geöffneter Link mit diesen Parametern zeigt dieselbe Auswahl, unbekannte IDs werden ignoriert.
- **AC-024-6** Gegeben die Filterleiste / Wenn gefiltert wird / Dann zeigt sie «X von Y Ideen»; «Filter zurücksetzen» hebt alle Filter auf und ist ohne Auswahl deaktiviert.
- **AC-024-7** Gegeben die Filterleiste / Wenn der Schalter «Alle Unterkategorien zeigen» betätigt wird / Dann erscheinen oder verschwinden die Unterkategorien aller Gruppen gemeinsam; eine bestehende Auswahl bleibt dabei erhalten.
- **AC-024-8** Gegeben die Sprache Deutsch oder Englisch / Wenn die Filterleiste angezeigt wird / Dann erscheinen Gruppen, Kategorien und Orte in dieser Sprache.
- **AC-024-9** Gegeben das Ideenformular / Wenn Kategorien und Orte gewählt und gespeichert werden / Dann sendet es die IDs, und die Detailseite zeigt sie als Links auf die gefilterte Übersicht.
- **AC-024-10** Gegeben eine CSV mit den Spalten «ICOM categories» und «Location» / Wenn sie importiert wird / Dann werden die IDs übernommen (Trenner `;` oder `,`, Gross-/Kleinschreibung egal); eine unbekannte ID macht die Zeile ungültig.
