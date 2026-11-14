---
id: F-023
next: 10
---

# F-023 Akzeptanzkriterien

- **AC-023-1** Gegeben das Formular zum Anlegen oder Bearbeiten einer Idee / Wenn es geöffnet wird / Dann gibt es ein optionales Feld «Mediation Concept» als Markdown-Editor (CodeMirror), getrennt von der kurzen Beschreibung.
- **AC-023-2** Gegeben der Markdown-Editor / Wenn der Nutzer auf Vorschau umschaltet / Dann sieht er den Text gerendert, ohne zu speichern, und kann zurück zum Schreiben wechseln.
- **AC-023-3** Gegeben eine Idee mit Concept / Wenn sie gespeichert und neu geladen oder bearbeitet wird / Dann ist der Markdown-Text unverändert vorhanden.
- **AC-023-4** Gegeben die Detailseite einer Idee mit Concept / Wenn sie geladen wird / Dann wird der Text als Markdown gerendert (Überschriften, Listen, Tabellen, Links, Code).
- **AC-023-5** Gegeben ein Concept mit rohem HTML oder Skript (z. B. `<script>`) / Wenn die Detailseite es anzeigt / Dann wird nichts davon ausgeführt oder als HTML gerendert, und Links öffnen in neuem Tab mit `noopener noreferrer`.
- **AC-023-6** Gegeben eine Idee ohne Concept, auch eine bestehende / Wenn die Detailseite geladen wird / Dann ist kein Concept-Abschnitt sichtbar, und Speichern ohne Concept ist möglich.
- **AC-023-7** Gegeben die Übersichtsseite / Wenn Ideen angezeigt werden / Dann erscheint das Concept dort nicht, es steht weiterhin die kurze Beschreibung.
- **AC-023-8** Gegeben Ideen mit Concept im Warenkorb / Wenn der Master-Prompt erzeugt wird / Dann ist das Concept jeder Idee, die eines hat, im Prompt enthalten.
- **AC-023-9** Gegeben eine CSV-Datei im Import (F-015) / Wenn sie importiert wird / Dann wird kein Concept gelesen oder gesetzt und der Import verhält sich wie bisher.
