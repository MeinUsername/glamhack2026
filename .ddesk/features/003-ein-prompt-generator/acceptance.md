---
id: F-003
next: 7
---

- **AC-003-1** Gegeben ein eingeloggter Nutzer mit zwei Ideen im Korb und der Sprache Deutsch / Wenn er den Prompt-Generator öffnet / Dann zeigt die Vorschau den aktuellen Master-Prompt, `{{ideas}}` ist durch alle Felder beider Ideen ersetzt, und `{{language}}` ist `de (Deutsch)`.
- **AC-003-2** Gegeben ein eingeloggter Nutzer mit fertiger Vorschau / Wenn er «Herunterladen» wählt / Dann erhält er eine Datei `.md` mit genau dem Text der Vorschau.
- **AC-003-3** Gegeben ein eingeloggter Nutzer mit fertiger Vorschau / Wenn er «In die Zwischenablage» wählt / Dann liegt derselbe Text in der Zwischenablage.
- **AC-003-4** Gegeben ein eingeloggter Nutzer hat in der Oberfläche Französisch gewählt / Wenn der Prompt erzeugt wird / Dann ist `{{language}}` durch `fr (Französisch)` ersetzt.
- **AC-003-5** Gegeben ein Besucher ohne Login / Wenn er die Seite des Prompt-Generators aufruft / Dann sieht er den Generator nicht und wird zur Anmeldung geleitet.
- **AC-003-6** Gegeben ein eingeloggter Nutzer mit leerem Korb / Wenn er den Prompt-Generator öffnet / Dann sind «Herunterladen» und «In die Zwischenablage» deaktiviert, und ein Hinweis erklärt, dass der Korb leer ist.
