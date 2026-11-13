---
id: F-008
next: 8
---

- **AC-008-1** Gegeben ein Admin mit geöffnetem Editor / Wenn er den Text mit `{{ideas}}` und `{{language}}` ändert und speichert / Dann entsteht eine neue Version, und die Variablen bleiben als Platzhalter im gespeicherten Text stehen.
- **AC-008-2** Gegeben ein Nutzer ohne Admin-Rolle / Wenn er den Master-Prompt speichern oder lesen will / Dann wird die Aktion abgelehnt.
- **AC-008-3** Gegeben eine Liste mit Versionen 1 bis 4, wobei Version 4 aktuell ist / Wenn der Admin Version 2 wiederherstellt / Dann ist der Text von Version 2 der aktuelle Stand, Version 5 ist neu angelegt, und die Versionen 1 bis 4 bleiben erhalten.
- **AC-008-4** Gegeben ein Admin / Wenn er den Text ohne Änderung speichert / Dann wird keine neue Version angelegt.
- **AC-008-5** Gegeben ein Text mit `{{foo}}` / Wenn der Admin speichern will / Dann wird das Speichern abgelehnt, und die Meldung nennt `foo`.
- **AC-008-6** Gegeben ein Browser mit einem Korb aus zwei Ideen und der Sprache Deutsch / Wenn der Text mit `{{ideas}}` und `{{language}}` in der Vorschau gerendert wird / Dann ersetzt `{{ideas}}` alle Felder beider Ideen, und `{{language}}` wird zu `de (Deutsch)`.
- **AC-008-7** Gegeben ein Browser mit leerem Korb / Wenn der Text mit `{{ideas}}` gerendert wird / Dann wird `{{ideas}}` durch einen leeren Text ersetzt.
