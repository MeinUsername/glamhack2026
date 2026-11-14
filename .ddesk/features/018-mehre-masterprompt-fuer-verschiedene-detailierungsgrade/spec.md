---
id: F-018
title: Mehre Masterprompt für verschiedene Detailierungsgrade
status: done
---

# F-018 Mehre Masterprompt für verschiedene Detailierungsgrade

## Beschreibung

### Ziel

Der Admin pflegt mehrere Master-Prompts für verschiedene Detailgrade. Beim Kopieren oder Herunterladen des Prompts wählt der Nutzer den Detailgrad.

### Ausgangslage

- F-008: ein einziger Master-Prompt mit Versionen, Variablen `{{ideas}}` und `{{language}}`.
- F-003: Prompt-Generator auf der Korbseite mit Kopieren und Herunterladen.
- F-007: Sprachen de, en, fr, it.

### Umfang

**Enthalten**

- Beliebig viele Detailgrade, je mit Titel, Beschreibung und eigenem Prompt-Text.
- Titel und Beschreibung mehrsprachig (de/en/fr/it); der Prompt-Text ist einsprachig.
- Admin-Verwaltung: anlegen, bearbeiten, löschen, Reihenfolge ändern.
- Versionierung und Wiederherstellen je Detailgrad wie in F-008.
- Auswahldialog beim Klick auf Kopieren oder Herunterladen.
- Migration des bestehenden Master-Prompts zum Detailgrad «Standard».

**Nicht enthalten**

- Weitere Variablen; die Variablenliste ist für alle Detailgrade gleich.
- Mehrsprachiger Prompt-Text.
- Merken der Auswahl im Browser.

### Entscheidungen

- **D1 «Checkout» = Korbseite mit Generator.** Es gibt keine eigene Checkout-Seite. Quelle: Q-018-01.
- **D2 Dialog.** Ein Dialog fragt nach dem Detailgrad bei Kopieren und Herunterladen, nur ab zwei Detailgraden; bei einem läuft die Aktion direkt. Quelle: Q-018-02.
- **D3 Aufbau.** Eigener einsprachiger Prompt-Text, Titel und Beschreibung je Sprache. Quelle: Q-018-03.
- **D4 Versionierung bleibt, je Detailgrad.** Quelle: Q-018-04.
- **D5 Verwaltung.** Anlegen, bearbeiten, löschen, Reihenfolge ändern. Quelle: Q-018-05.
- **D6 Migration.** Der bestehende Master-Prompt wird zum Detailgrad «Standard». Quelle: Q-018-06.
- **D7 Sprachen.** Nur Englisch ist Pflicht, die übrigen Sprachen sind optional. Quelle: Q-018-07 (eigene Option des Nutzers).
- **D8 Löschen und Wahl.** Der letzte Detailgrad bleibt bestehen; alle eingeloggten Rollen wählen, der erste Detailgrad ist vorausgewählt. Quelle: Q-018-08.

### Annahmen

- Fehlt Titel oder Beschreibung in der UI-Sprache, zeigt die Oberfläche die englische Fassung. (Vom Nutzer nicht bestätigt.)
- «Der erste» Detailgrad ist der erste in der vom Admin festgelegten Reihenfolge. (Vom Nutzer nicht bestätigt.)
- Der Dialog lässt sich abbrechen, dann geschieht nichts. (Vom Nutzer nicht bestätigt.)
- Die Vorschau auf der Korbseite zeigt den gewählten Detailgrad. (Vom Nutzer nicht bestätigt.)

### Offene Punkte für den Plan

- Speicherung der Detailgrade und ihrer Versionen, Migration von `master_prompt_versions`.
- Anpassung der Routen `GET /api/master-prompt` und `/api/admin/master-prompt` aus F-008.

### Abhängigkeiten

F-003, F-006, F-007, F-008.

### Akzeptanzkriterien

Siehe `acceptance.md`.
