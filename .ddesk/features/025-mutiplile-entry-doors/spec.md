---
id: F-025
title: Mutiplile Entry Doors
status: done
---

# F-025 Mutiplile Entry Doors

## Beschreibung

# Mutiplile Entry Doors

- Mache eine Seite mit der man Prompts runterladen kann für Feedback zu bestehenden Konzepte.

- Füge bei der Prompt Verwaltung die Kategorie ein für Feedback Prompt

- Wenn ein Feedback Prompt die Varialbe {{allideas}} enthält, dann werden alle Ideen eingefügt. 

### Ziel

Es gibt eine öffentliche Seite, auf der man Feedback-Prompts zu bestehenden Konzepten herunterladen oder kopieren kann. Feedback-Prompts werden in der Prompt-Verwaltung als eigene Kategorie verwaltet. Enthält ein Feedback-Prompt die Variable `{{allideas}}`, wird sie durch alle Ideen ersetzt.

### Umfang

- Neue Seite «Feedback-Prompts» mit Liste aller Feedback-Prompts (Titel, Beschreibung, Aktionen Herunterladen und Kopieren). Das Verhalten entspricht dem Checkout aus dem Korb (Download als Datei, Kopieren in die Zwischenablage).
- Die Seite ist ohne Login erreichbar.
- Prompt-Verwaltung (Admin, F-018): neues Feld Kategorie pro Prompt mit den Werten Master-Prompt und Feedback-Prompt. Bestehende Prompts bleiben Master-Prompt.
- Neue Variable `{{allideas}}`, nur in Feedback-Prompts erlaubt. Sie wird durch alle Ideen ersetzt, im selben Format wie `{{ideas}}`, inklusive Mediation Concept (F-023).
- Die Ersetzung geschieht serverseitig beim Download bzw. Kopieren.
- Erlaubte Variablen in Feedback-Prompts: `{{allideas}}` und `{{language}}`. `{{ideas}}` ist dort nicht erlaubt.
- Feedback-Prompts sind einfacher als Detailgrade: keine Versionierung und keine vier Sprachen für Titel und Beschreibung.

Nicht Teil dieses Features: Änderungen am Korb-Checkout, am Master-Prompt-Format von `{{ideas}}`, ZIP-Download.

### Entscheidungen

- **D1 (Q-025-01):** Die Seite ist öffentlich, kein Login nötig.
- **D2 (Q-025-02, eigene Antwort):** Wie beim Korb-Checkout: Download als Datei und Kopieren in die Zwischenablage, kein ZIP.
- **D3 (Q-025-03):** Kategorie als neues Feld pro Prompt in der bestehenden Verwaltung; bestehende Prompts gelten als Master-Prompt.
- **D4 (Q-025-04):** `{{allideas}}` = alle Ideen der Datenbank, Format wie `{{ideas}}`, inkl. Mediation Concept.
- **D5 (Q-025-05):** Ersetzung serverseitig.
- **D6 (Q-025-06):** Feedback-Prompts dürfen nur `{{allideas}}` und `{{language}}` nutzen.
- **D7 (Q-025-07):** `{{allideas}}` ist in Master-Prompts nicht erlaubt (Speichern wird mit Fehler abgelehnt wie bei unbekannten Variablen, AC-008-5).
- **D8 (Q-025-08):** Keine Versionierung, keine Mehrsprachigkeit von Titel/Beschreibung.
- **D9 (Q-025-09):** Die Seite zeigt eine Liste mehrerer Feedback-Prompts.

### Abhängigkeiten

- **F-008, F-018, F-021, F-023:** Prompt-Verwaltung, Variablen, Mediation Concept (`masterprompt.go`, `promptlevels.go`).
- **F-003:** Bisher rendert der Browser die Variablen; hier erstmals serverseitig.
- Korb-Checkout (`Basket.tsx`, `PromptGenerator.tsx`) als Vorbild für Download und Kopieren.

### Offene Punkte für den Plan

- **Datenschutz (D1 + D4 + D5):** Ein öffentlicher Endpunkt liefert den vollständigen Ideenbestand ohne Login. Das widerspricht ggf. dem bisherigen Zugriffsmodell (Ideen nur für Angemeldete, siehe `security.md`). Vor der Umsetzung bestätigen; der Nutzer hat dies mit D1 und D4 akzeptiert, die Folge wurde aber nicht ausdrücklich gefragt.
- **D8 ist knapp:** Annahme: ein Titel, eine Beschreibung, ein Text (einsprachig, Sprache = Sprache des Prompts), kein Verlauf. Im Plan prüfen, ob die vier Sprachen für die öffentliche Seite doch nötig sind.
- **`{{language}}`:** Welche Sprache ersetzt wird (UI-Sprache des Besuchers als Parameter), im Plan klären.
- Dateiname und Format des Downloads (Annahme: wie Korb-Checkout).
- Sehr viele Ideen: Obergrenze der Promptgrösse prüfen (`maxMasterPromptRunes`).
- Das Glossar enthält nur «Mediation Concept»; «Feedback-Prompt» ggf. aufnehmen.

### Akzeptanzkriterien

Siehe `acceptance.md`.
