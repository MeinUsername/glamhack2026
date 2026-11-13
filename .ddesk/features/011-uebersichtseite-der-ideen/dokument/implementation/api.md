# API – Umsetzung F-011

- [neu] `GET /api/ideas` liefert alle Ideen als `{id, title, imageCount}`, neueste zuerst.
  Warum: F-002 bietet nur den Abruf einer Idee; die Übersicht braucht eine Liste. Die Spec von F-002 schloss das Auflisten aus und verwies auf F-004, das es nicht gibt.
- [neu] Die Antwort enthält nur die Felder der Übersicht (D5), keine Beschreibung und keine Bild-URLs. Die Vorschau holt die Seite über `/api/ideas/{id}/images/0`.
  Warum: Die Liste bleibt klein; Bilder werden nur geladen, wenn die Vorschau sichtbar ist.
