---
id: F-021
title: Editor der Prompts sollte auch die Liste der Variablen einzuszeigen
status: refining
---

# F-021 Editor der Prompts sollte auch die Liste der Variablen einzuszeigen

## Beschreibung

# Editor der Prompts sollte auch die Liste der Variablen einzuszeigen

- Variablen als Liste oben anzeigen
- Im Editor highlighten
- Idealerweise sogar ein einfügen an der Cursorposition erlauben

### Ziel

Wer den Master-Prompt bearbeitet, sieht die erlaubten Variablen (`{{ideas}}`, `{{language}}`, siehe F-008 D1 und `masterprompt.go`) als Liste über dem Editor, sieht sie im Text hervorgehoben und kann sie per Klick an der Cursorposition einfügen.

### Ausgangslage

- Der Editor ist eine einfache `<textarea>` im Quelltext-Modus (`frontend/src/pages/AdminMasterPrompt.tsx`), ohne Editor-Bibliothek.
- Der Server lehnt unbekannte Variablen beim Speichern ab (F-008, AC-008-5).
- Mehrere Master-Prompts als Detailgrade mit Dialog gibt es seit F-018.

### Umfang (vorläufig, Annahmen = Empfehlungen der Rückfragen)

- Liste der erlaubten Variablen oberhalb des Editors, je Variable Name und kurze Beschreibung.
- Variablen `{{name}}` im Editor farblich hervorgehoben; unbekannte Variablen sichtbar anders markiert.
- Klick auf eine Variable fügt `{{name}}` an der Cursorposition ein, eine Auswahl wird ersetzt; der Cursor steht danach hinter der Einfügung.
- Anzahl der Vorkommen je Variable in der Liste.

Nicht Teil: neue Variablen, Änderung der Server-Validierung, Drag&Drop.

### Entscheidungen

Noch keine. Die Rückfragen Q-021-01 bis Q-021-06 sind gestellt (`ddesk ask`), `ddesk wait` lieferte bisher keine Antwort. Bis dahin gelten die jeweils empfohlenen Optionen nur als Arbeitsannahme.

### Offene Punkte

- Q-021-01: Geltungsbereich (nur Master-Prompt-Editor oder auch Dialoge für Detailgrade, F-018).
- Q-021-02: Umsetzung des Highlightens (Textarea mit Overlay ohne neue Abhängigkeit oder Editor-Bibliothek).
- Q-021-03: Darstellung unbekannter Variablen.
- Q-021-04: Inhalt der Liste (Beschreibung, Knopf).
- Q-021-05: Einfüge-Verhalten.
- Q-021-06: Anzahl Vorkommen.
- Das Glossar des Projekts ist leer; `{{variable}}` ggf. aufnehmen.
- Die Variablenliste sollte aus einer einzigen Quelle stammen (heute `allowedVariables` im Server), damit Liste und Validierung nicht auseinanderlaufen.

### Akzeptanzkriterien

Siehe `acceptance.md` (Entwurf, abhängig von den Antworten).
