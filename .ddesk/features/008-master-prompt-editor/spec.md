---
id: F-008
title: Master - Prompt Editor
status: testing
---

# F-008 Master - Prompt Editor

## Beschreibung

### Ziel

Der Admin pflegt den Master-Prompt als Markdown-Text mit Variablen. Jede Speicherung hält den Stand als Version fest, und der Admin kann eine frühere Version wiederherstellen. Der Master-Prompt ist die Grundlage für den Prompt-Generator (F-003).

### Ausgangslage

- F-003 beschreibt einen Master-Prompt im Source. F-008 macht ihn im UI pflegbar.
- Die gekauften Ideen stammen aus dem Korb aus F-006. Der Korb liegt im Localstorage des Browsers.
- Die ausgewählte Sprache stammt aus der Mehrsprachigkeit aus F-007 (Deutsch, Englisch, Französisch, Italienisch).
- Rollen und Anmeldung kommen aus F-001. Nur die Rolle Admin ist zulässig.

### Umfang

**Enthalten**

- Markdown-Editor für den Master-Prompt, nur für den Admin.
- Zwei Variablen, siehe Entscheidungen: `{{ideas}}` und `{{language}}`.
- Versionierung: Jede Speicherung legt eine Version ab.
- Liste der Versionen mit Wiederherstellen-Aktion je Version.
- Rendern der Variablen für die Vorschau mit dem Korb und der Sprache des Browsers.

**Nicht enthalten**

- Der Prompt-Generator selbst und die Ausgabe des fertigen Prompts (F-003).
- Lesen des Master-Prompts durch andere Rollen (siehe Offene Punkte).
- Vergleich zweier Versionen (Diff), Kommentare zu Versionen.
- Weitere Variablen über die zwei genannten hinaus.

### Entscheidungen

- **D1 Variablen-Schreibweise.** Variablen stehen als `{{name}}` im Text. Die Namen sind englisch: `{{ideas}}` und `{{language}}`. Quelle: Nutzerantwort auf Q-008-01.
- **D2 Gekaufte Ideen = Korb aus F-006.** `{{ideas}}` ist der Inhalt des Korbs aus F-006. Quelle: Q-008-02.
- **D3 Inhalt von `{{ideas}}`.** `{{ideas}}` wird durch alle Felder jeder Idee im Korb ersetzt. Quelle: Q-008-01 (eigene Option des Nutzers).
- **D4 Quelle des Korbs beim Rendern.** `{{ideas}}` wird aus dem Korb des Browsers gerendert, in dem der Prompt angezeigt wird. Der Korb des Admins wird nicht verwendet. Quelle: Q-008-07. Folge: Der Korb wird nicht auf dem Server gespeichert, das bleibt wie in F-006.
- **D5 Sprache.** `{{language}}` wird als Code und Name ersetzt, z. B. `de (Deutsch)`. Quelle: Q-008-03.
- **D6 Version pro Speicherung.** Jede Speicherung legt eine neue Version an. Es gibt keinen separaten Button «Version speichern». Quelle: Q-008-04.
- **D7 Wiederherstellen.** Das Wiederherstellen kopiert eine alte Version als neue Version an das Ende der Historie. Keine Version wird gelöscht. Quelle: Q-008-05.
- **D8 Schreibrecht.** Nur der Admin darf den Master-Prompt speichern und wiederherstellen. Quelle: Ausgangstext und Q-008-06.
- **D9 Leserecht.** Nur der Admin darf den Master-Prompt lesen. Quelle: Q-008-06.

### Annahmen

- Eine Speicherung ohne Änderung am Text legt keine neue Version an. (Vom Nutzer nicht bestätigt.)
- Eine unbekannte Variable wie `{{foo}}` lehnt das Speichern ab und nennt den Namen. (Vom Nutzer nicht bestätigt.)
- Der Korb ist leer: `{{ideas}}` wird zu einem leeren Text. (Vom Nutzer nicht bestätigt.)
- Die Sprachliste ist die aus F-007: de, en, fr, it. Der Name steht auf Deutsch, z. B. «Deutsch». (Vom Nutzer nicht bestätigt.)
- Die Variable `{{language}}` nutzt die Sprache des Browsers oder die Auswahl im UI aus F-007. (Vom Nutzer nicht bestätigt.)

### Offene Punkte für den Plan

- Lesen des Master-Prompts: Der Prompt-Generator (F-003) braucht den Text zur Laufzeit. Es ist offen, ob dafür eine eigene Leseberechtigung nötig ist, da D9 nur dem Admin das Lesen erlaubt.
- Editor-Ansicht: Quelltext mit Vorschau nebeneinander oder umschaltbar. Nicht entschieden.
- Speicherformat der Versionen (Tabelle mit Zeitstempel und Autor).
- Gleichzeitiges Bearbeiten durch zwei Admins: letzter Schreibvorgang gewinnt, sofern nicht im Plan anders entschieden.

### Abhängigkeiten

- **F-001 Nutzerverwaltung:** Rolle Admin und Anmeldung.
- **F-006 Shopping Basket:** Quelle von `{{ideas}}`, Lesen des Korbs im Browser.
- **F-007 Mehrsprachigkeit:** Quelle von `{{language}}`.
- **F-003 Ein Prompt-Generator:** Verbraucher des Master-Prompts.

### Akzeptanzkriterien

Siehe `acceptance.md`.
