---
id: F-029
title: Replacement von Bildern funktioniert nicht
status: plan-ready
---

# F-029 Replacement von Bildern funktioniert nicht

## Beschreibung

# Replacement von Bildern funktioniert nicht

Wenn man ein Bild ersetzen möchte, dann deslektiert man es auf der Edit page und lädt ein neues über die Picture Upload Section hoch. 
Das funktioniert nicht. Das alte bild bleibt sichtbar.

### Ziel

Beim Bearbeiten einer Idee soll das Ersetzen eines Bildes funktionieren: Wird ein bestehendes Bild abgewählt und ein neues hochgeladen, zeigt die Idee nach dem Speichern sofort das neue Bild, das alte ist weg.

### Ursache (Hypothese, in der Umsetzung zu bestätigen)

Bilder werden über `GET /api/ideas/{id}/images/{n}` mit dem Index `n` ausgeliefert, mit `Cache-Control: private, max-age=3600` (`ideas.go`, `apiIdeaImage`). Nach dem Ersetzen bleibt die URL gleich (z. B. `/images/0`), der Browser liefert das alte Bild aus dem Cache.

### Umfang

- Backend (`ideas.go`, `ideas_update.go`): Die Bild-URL ändert sich, sobald sich das Bild ändert (Version, z. B. Teil des Objektnamens als Teil der URL oder Query-Parameter). Der Cache bleibt erhalten.
- Frontend (`IdeaForm.tsx`, `IdeaPage.tsx` und weitere Stellen, die Bild-URLs bauen): verwenden die versionierte URL.
- Beim Speichern werden abgewählte Bilder auch aus dem Bucket gelöscht (prüfen, ob das bereits geschieht).
- Tests für Ersetzen (Backend und Formular).

Nicht Teil dieses Features: Reihenfolge ändern, Bildbearbeitung, Änderung der Limits (max. 5 Bilder, 5 MB, JPG/PNG/WebP).

### Entscheidungen

- **D1 (Q-029-01):** Ersetzen = abgewähltes Bild fällt weg, neues kommt dazu; nach dem Speichern ist das neue Bild sofort sichtbar, das alte nicht mehr.
- **D2 (Q-029-02):** Fix über versionierte Bild-URL, Cache (`max-age`) bleibt bestehen.
- **D3 (Q-029-03):** Abgewählte Bilder werden beim Speichern aus dem Bucket gelöscht.
- **D4 (Q-029-04):** Alle Bilder abgewählt und keines hochgeladen ist erlaubt (Idee ohne Bilder).
- **D5:** Neue Bilder werden hinten angehängt, behaltene Bilder behalten ihre Reihenfolge (bestehendes Verhalten).

### Abhängigkeiten

- **F-014:** Formular der Idee (Anlegen und Bearbeiten).

### Akzeptanzkriterien

Siehe `acceptance.md`.
