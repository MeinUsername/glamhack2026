---
id: F-025
next: 11
---

# F-025 Akzeptanzkriterien

- **AC-025-1** Gegeben ein nicht angemeldeter Besucher / Wenn er die Seite «Feedback-Prompts» öffnet / Dann sieht er die Liste aller Feedback-Prompts mit Titel und Beschreibung.
- **AC-025-2** Gegeben ein Feedback-Prompt in der Liste / Wenn der Besucher «Herunterladen» wählt / Dann erhält er den Prompt als Datei, wie beim Korb-Checkout.
- **AC-025-3** Gegeben ein Feedback-Prompt in der Liste / Wenn der Besucher «Kopieren» wählt / Dann liegt der Prompt in der Zwischenablage.
- **AC-025-4** Gegeben die Prompt-Verwaltung / Wenn ein Admin einen Prompt anlegt oder bearbeitet / Dann kann er die Kategorie Master-Prompt oder Feedback-Prompt wählen.
- **AC-025-5** Gegeben bestehende Prompts vor diesem Feature / Wenn die Verwaltung geladen wird / Dann haben sie die Kategorie Master-Prompt und verhalten sich unverändert.
- **AC-025-6** Gegeben ein Feedback-Prompt mit `{{allideas}}` / Wenn er heruntergeladen oder kopiert wird / Dann ist die Variable serverseitig durch alle Ideen ersetzt, im Format von `{{ideas}}` inkl. Mediation Concept.
- **AC-025-7** Gegeben ein Feedback-Prompt ohne `{{allideas}}` / Wenn er heruntergeladen wird / Dann enthält er keine Ideen und bleibt bis auf `{{language}}` unverändert.
- **AC-025-8** Gegeben ein Master-Prompt mit `{{allideas}}` / Wenn der Admin speichert / Dann wird das Speichern mit einem Fehler zur unbekannten Variable abgelehnt.
- **AC-025-9** Gegeben ein Feedback-Prompt mit `{{ideas}}` / Wenn der Admin speichert / Dann wird das Speichern abgelehnt.
- **AC-025-10** Gegeben keine Feedback-Prompts / Wenn die Seite geöffnet wird / Dann erscheint ein Leerzustand statt einer Fehlermeldung.
