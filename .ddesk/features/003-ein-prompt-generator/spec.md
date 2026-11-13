---
id: F-003
title: Ein Prompt-Generator
status: plan-ready
---

# F-003 Ein Prompt-Generator

## Beschreibung

### Ziel

Eingeloggte Nutzer erzeugen aus dem Master-Prompt und den gekauften Ideen aus dem Korb einen fertigen Prompt in der ausgewählten Sprache. Den Prompt laden sie als Datei herunter oder kopieren ihn.

### Ausgangslage

- Der Master-Prompt ist Markdown mit den Variablen `{{ideas}}` und `{{language}}` (F-008, D1). Er wird in F-008 versioniert gepflegt.
- `{{ideas}}` ist der Korb aus F-006 im Browser des Nutzers. Der Korb liegt nur im Localstorage, nicht auf dem Server (F-008, D2 und D4).
- `{{language}}` kommt aus der Mehrsprachigkeit (F-007): Deutsch, Englisch, Französisch, Italienisch.

### Umfang

**Enthalten**

- Seite «Prompt-Generator» mit Vorschau des fertigen Prompts.
- Ersetzen von `{{ideas}}` und `{{language}}` im aktuellen Master-Prompt.
- Download des fertigen Prompts als Markdown-Datei.
- Schaltfläche «In die Zwischenablage» für den fertigen Prompt.
- Zugriff nur für eingeloggte Rollen.

**Nicht enthalten**

- Bearbeiten des Master-Prompts (das ist F-008).
- Speichern fertiger Prompts auf dem Server oder im Nutzerkonto.
- Andere Ausgabeformate als Markdown.
- Sprachen außerhalb von Deutsch, Englisch, Französisch und Italienisch.

### Entscheidungen

- **D1 Quelle des Master-Prompts.** Der Generator liest die aktuelle Version aus F-008. Quelle: Q-003-01.
- **D2 Zugriff.** Den Generator nutzen nur eingeloggte Rollen, wie den Korb in F-006 (D3). Besucher ohne Login werden zur Anmeldung geleitet. Quelle: Q-003-02.
- **D3 Lesen des Master-Prompts.** Der Master-Prompt ist für alle eingeloggten Rollen lesbar. Schreiben bleibt beim Admin (F-008, D8). Folge: F-008, D9 («Nur der Admin darf den Master-Prompt lesen») wird geändert. Diese Änderung ist nicht Teil von F-003 und wird in F-008 nachgezogen. Quelle: Q-003-08.
- **D4 Sprache.** `{{language}}` nutzt die Sprache aus der Oberfläche (F-007). Die Browsersprache ist der Startwert. Format wie in F-008, D5, z. B. `de (Deutsch)`. Quelle: Q-003-03.
- **D5 Inhalt von `{{ideas}}`.** Alle Felder jeder Idee im Korb, wie in F-008, D3.

### Annahmen

Diese Punkte hat der Nutzer nicht beantwortet. Sie folgen der Empfehlung aus den Rückfragen und sind noch nicht bestätigt.

- Ist der Korb leer, ist «Herunterladen» und «In die Zwischenablage» deaktiviert, und ein Hinweis erklärt warum. (Q-003-04)
- Der Download ist eine Datei `.md`. (Q-003-05)
- Der Generator liegt auf einer eigenen Seite «Prompt-Generator» und nicht auf der Korbseite. (Q-003-06)
- Kopieren erfolgt über die Schaltfläche «In die Zwischenablage», nicht über reine Textanzeige. (Q-003-07)

### Offene Punkte für den Plan

- Was passiert, wenn F-008 noch keine Version des Master-Prompts hat? Vorschlag: Hinweis statt Download.
- Rendern im Browser: Der Korb liegt im Browser, also wird `{{ideas}}` dort ersetzt. Offen ist, wie der Master-Text zum Browser kommt (API-Endpunkt).

### Abhängigkeiten

- **F-001 Nutzerverwaltung:** Rollen und Anmeldung.
- **F-006 Shopping Basket:** Quelle von `{{ideas}}`.
- **F-007 Mehrsprachigkeit:** Quelle von `{{language}}`.
- **F-008 Master-Prompt-Editor:** Quelle des Master-Prompts. F-003 setzt die Änderung von F-008, D9 voraus (D3 oben).

### Akzeptanzkriterien

Siehe `acceptance.md`.
