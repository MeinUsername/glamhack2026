---
id: F-026
title: Verschiebe das Mediation Concept an das Ende
status: done
---

# F-026 Verschiebe das Mediation Concept an das Ende

## Beschreibung

# Verschiebe das Mediation Concept an das Ende der Detailseite

- das Konzept ist relativ lang und ergänzt die anderen Informationen mehr

### Ziel

Das Mediation Concept ist lang und ergänzt die übrigen Angaben. Es steht deshalb als letzter Abschnitt der Detailseite einer Idee und als letztes Feld im Formular, statt mitten in den Kerninformationen.

### Umfang

- Detailseite (`IdeaPage.tsx`): Abschnitt «Mediation Concept» wandert hinter «Budget» an das Ende des Artikels.
- Formular (`IdeaForm.tsx`, Anlegen und Bearbeiten): Concept-Feld (Markdown-Editor mit Vorschau) steht als letztes Feld, vor den Aktionen (Speichern/Abbrechen).
- Reine Umordnung: Inhalt, Rendering, Ausblenden bei leerem Concept (F-023 D6) und Speicherformat bleiben unverändert.

Nicht Teil dieses Features: Master-Prompt (Reihenfolge unverändert), Übersichtsseite, Backend, Export, CSV-Import.

### Entscheidungen

- **D1 (Q-026-01):** Ganz am Ende der Detailseite, nach «Budget».
- **D2 (Q-026-02):** Das Formular folgt derselben Reihenfolge, das Concept-Feld wird dort ebenfalls ans Ende verschoben.
- **D3 (Q-026-03):** Master-Prompt bleibt unverändert.

### Abhängigkeiten

- **F-023:** Feld, Rendering und Editor des Mediation Concept.
- **F-014:** Formular der Idee.

### Akzeptanzkriterien

Siehe `acceptance.md`.
