---
id: F-023
title: Concept Feld einfügen
status: plan-ready
---

# F-023 Concept Feld einfügen

## Beschreibung

# Concept Feld einfügen

Kannst du ein Mediation-Concept Feld einfügen, dass nur auf der Detail seite der Idee sichtbar sind

Description ist sollte kurz bleiben und auf der Übersichtsseite sein. 



Das Meidation-Concept sollte eine Markdown Text aktzeptiere (auf der Edit Seite auch mit Markdown-Editor mit Preview Funktion)

Das Markdow sollte auf der Detail Seite im View Modus gerendert werden.

### Ziel

Eine Idee bekommt ein zusätzliches, optionales Feld «Mediation Concept» (`mediationConcept`) mit Markdown-Text. Es erscheint nur auf der Detailseite (gerendert) und im Formular (Markdown-Editor mit Vorschau). Die bestehende `description` bleibt das kurze Feld für die Übersichtsseite.

### Umfang

- Neues Feld `mediationConcept` an der Idee (Backend `ideas.go`, `ideas_update.go`, Formular `IdeaForm.tsx`, Detailseite `IdeaPage.tsx`).
- Nur auf der Detailseite sichtbar, nicht in der Übersicht (F-011).
- Formular (Anlegen und Bearbeiten): Markdown-Editor mit Vorschau-Umschaltung.
- Detailseite: Markdown gerendert (GFM: Überschriften, Listen, Tabellen, Links, Code).
- Kein rohes HTML; Links öffnen in neuem Tab mit `rel="noopener noreferrer"`.
- Leeres Concept: Abschnitt auf der Detailseite ausgeblendet.
- Das Concept wird als Injection in den Master-Prompt eingebunden.

Nicht Teil dieses Features: CSV-Import des Concepts, Concept in der Übersicht, Bilder im Markdown, Versionierung, Längenbegrenzung.

### Entscheidungen

- **D1 (Q-023-01):** Neues zusätzliches Feld; `description` bleibt unverändert und kurz.
- **D2 (Q-023-02):** Optional, bestehende Ideen bleiben gültig.
- **D3 (Q-023-03, eigene Antwort):** Editor mit CodeMirror (Markdown-Modus) plus Vorschau. Der Nutzer meinte, CodeMirror sei schon in den Dependencies. Geprüft: In `frontend/package.json` ist weder CodeMirror noch ein Markdown-Renderer eingetragen, beides kommt neu dazu (im Plan bestätigen).
- **D4 (Q-023-04):** Kein rohes HTML, nur GFM, Links in neuem Tab.
- **D5 (Q-023-05, eigene Antwort):** Kein CSV-Import des Concepts; dafür Einbindung als Injection in den Master-Prompt.
- **D6 (Q-023-06):** Leeres Concept: Abschnitt auf der Detailseite komplett ausblenden.
- **D7 (Q-023-07):** Keine Längenbegrenzung des Concept-Texts.

### Abhängigkeiten

- **F-002, F-014:** Felder der Idee und Formular.
- **F-008, F-018, F-021:** Master-Prompt-Variablen (`ideas`, `language`, siehe `masterprompt.go`).
- **F-011:** Übersicht bleibt unverändert.
- **F-010:** Export (siehe offene Punkte).

### Offene Punkte für den Plan

- **Master-Prompt-Injection (D5):** Neue erlaubte Variable (z. B. `{{concepts}}`) oder Concept pro Idee innerhalb von `{{ideas}}`? Annahme: dem Idee-Block in `{{ideas}}` anhängen, keine neue Variable, bestehende Master-Prompts bleiben gültig.
- **Export (F-010):** Nur der CSV-Import wurde ausgeschlossen. Annahme: Feld ist im Export enthalten, falls es einen gibt; prüfen.
- **CodeMirror (D3):** Paketwahl (`@uiw/react-codemirror` oder direkt `@codemirror/*`) und Markdown-Renderer (z. B. `react-markdown` mit `remark-gfm`, ohne `rehype-raw`).
- **D7:** Firestore-Dokumente sind auf 1 MiB begrenzt; im Plan prüfen, ob eine technische Obergrenze nötig ist.
- Das Glossar ist leer; «Mediation Concept» ggf. aufnehmen.

### Akzeptanzkriterien

Siehe `acceptance.md`.
