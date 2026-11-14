---
id: F-020
title: Kannst du die Idee Seite editerbar machen, dass man z.B. auch noch Bilder hochladen kann
status: plan-ready
---

# F-020 Kannst du die Idee Seite editerbar machen, dass man z.B. auch noch Bilder hochladen kann

## Beschreibung

# Kannst du die einzelne Ideen Seite editerbar machen, dass man z.B. auch noch Bilder hochladen kann

### Ziel

Eine Idee lässt sich bearbeiten, einschliesslich Bilder hinzufügen und entfernen. Das Bearbeiten selbst gibt es seit F-012 (T6, T8): Formular unter `/ideas/{id}/edit`, `PUT /api/ideas/{id}` mit `keepImages`. Dieses Feature macht es besser auffindbar und stellt sicher, dass es durchgängig funktioniert. Der Bearbeitungsweg bleibt das bestehende Formular.

### Umfang

- Der Einstieg zum Bearbeiten ist von der Idee-Seite und von der Übersichtsseite (F-011) aus deutlich sichtbar.
- Im Formular lassen sich alle Felder ändern, Bilder entfernen und neue hinzufügen (Grenzen wie F-002: bis 5 Bilder, JPG/PNG/WebP, je max. 5 MB).
- Nach dem Speichern landet man wieder auf der Idee-Seite mit den geänderten Daten.

Nicht Teil dieses Features: Inline-Bearbeiten auf der Idee-Seite, Bilder-Reihenfolge, Titelbild, Drag&Drop, höhere Bildlimits, Rechteprüfung, Änderungshistorie.

### Entscheidungen

- **D1 (Q-020-01):** Das bestehende Formular genügt, es soll nur besser auffindbar sein. Kein Inline-Bearbeiten.
- **D2 (Q-020-02):** Bearbeiten bleibt wie bisher für jeden ohne Login möglich (F-012, AC-012-2).
- **D3 (Q-020-03, nicht beantwortet, nicht blockierend):** Keine Änderungshistorie, eine Änderung überschreibt die Idee. Die Empfehlung wird übernommen; zu prüfen beim Plan.

### Abhängigkeiten

- **F-002 Eine Seite-Template:** Felder und Bildregeln.
- **F-011 Übersichtseite aller Ideen:** zweiter Einstiegspunkt.
- **F-012 Public Usage:** Bearbeiten ohne Login.
- **F-014:** erweiterte Felder erscheinen im Formular.

### Offene Punkte für den Plan

- Die Idee-Seite hat bereits einen Textlink «Bearbeiten» (`frontend/src/ideas/IdeaPage.tsx:51`). Zu klären, was an der Auffindbarkeit konkret fehlt (z. B. Button statt Textlink, Einstieg in der Übersicht).
- Q-020-03 ohne Antwort (D3).
- Das Glossar des Projekts ist leer.

### Akzeptanzkriterien

Siehe `acceptance.md`.
