---
id: F-021
next: 6
---

# F-021 Akzeptanzkriterien (Entwurf, vorbehaltlich der Antworten auf Q-021-01..06)

- **AC-021-1** Gegeben der Master-Prompt-Editor / Wenn er geöffnet wird / Dann steht über dem Editor eine Liste aller erlaubten Variablen mit Beschreibung.
- **AC-021-2** Gegeben ein Text mit `{{ideas}}` / Wenn er im Editor steht / Dann ist die Variable hervorgehoben.
- **AC-021-3** Gegeben ein Text mit `{{foo}}` / Wenn er im Editor steht / Dann ist die Variable als unbekannt markiert.
- **AC-021-4** Gegeben der Cursor steht im Text / Wenn der Admin eine Variable in der Liste anklickt / Dann steht `{{name}}` an der Cursorposition und der Editor hat den Fokus.
- **AC-021-5** Gegeben Text ist markiert / Wenn der Admin eine Variable anklickt / Dann ersetzt `{{name}}` die Auswahl.
