# Dokumentation – Umsetzung F-009

> Gewählte Kategorien erscheinen als Chips unter dem Seitentitel; ohne Auswahl entfällt der Block.

Auf Touch-Geräten (`hover: none`) gibt es keinen Auslöser für den Tooltip. Die Erklärungen sind dort nicht erreichbar.

**Künftiges Problem: Die Erklärungen sind auf Touch-Geräten nicht lesbar. Das ist die Folge von Q-009-06, nicht ein Fehler. Wer die Einordnung auf dem Tablet braucht, braucht eine andere Darstellung (z. B. Erklärung unter dem Feld).**

*Annahme: Der Tooltip öffnet sich auch bei Mauszeiger-Hover. Die Antwort auf Q-009-06 nennt nur den Tastaturfokus; falls Hover nicht gewollt ist, entfällt der Hover-Zweig in `CategoriesInfo.tsx`.*
