---
id: F-018
next: 7
---

# F-018 Akzeptanzkriterien

- **AC-018-1** Gegeben ein Admin auf der Master-Prompt-Seite / Wenn er einen Detailgrad mit Titel und Beschreibung (mindestens Englisch) und einem Prompt-Text speichert / Dann erscheint er in der Liste der Detailgrade und legt eine Version an.
- **AC-018-2** Gegeben ein Admin / Wenn er Detailgrade bearbeitet, löscht oder ihre Reihenfolge ändert / Dann gilt die Änderung; der letzte verbleibende Detailgrad lässt sich nicht löschen.
- **AC-018-3** Gegeben ein Detailgrad mit mehreren Versionen / Wenn der Admin eine frühere Version wiederherstellt / Dann entsteht eine neue Version mit diesem Text, keine Version wird gelöscht.
- **AC-018-4** Gegeben ein eingeloggter Nutzer mit gefülltem Korb und mindestens zwei Detailgraden / Wenn er auf der Korbseite auf Kopieren oder Herunterladen klickt / Dann fragt ein Dialog nach dem Detailgrad (Titel und Beschreibung in der UI-Sprache) und führt die Aktion erst nach der Wahl mit dem gewählten Prompt aus.
- **AC-018-5** Gegeben genau ein Detailgrad / Wenn der Nutzer auf Kopieren oder Herunterladen klickt / Dann läuft die Aktion ohne Dialog mit diesem Prompt.
- **AC-018-6** Gegeben mehrere Detailgrade / Wenn ein eingeloggter Nutzer beliebiger Rolle den Prompt wählt / Dann sind `{{ideas}}` und `{{language}}` in allen Detailgraden gleich verfügbar und werden ersetzt.
- **AC-018-7** Gegeben die bestehende Installation mit einem Master-Prompt aus F-008 / Wenn F-018 ausgerollt wird / Dann existiert dieser Text samt Versionen als Detailgrad «Standard».
