# Doku – Umsetzung F-003

> Der Generator setzt den Master-Prompt mit den Ideen aus dem Korb und der Sprache der Oberfläche zusammen. Er erzeugt nichts am Server.

Der Generator ist nur für eingeloggte Rollen sichtbar. Besucher sehen die Korbseite und einen Hinweis zur Anmeldung.

*Annahme: Die Vorschau zeigt Felder in Korbreihenfolge, Bilder fehlen im Text. Das Format ist eigene Entscheidung des Plans und noch nicht vom Nutzer bestätigt.*

**Künftiges Problem:** Der Generator lädt jede Idee des Korbs erneut, obwohl die Korbseite dieselben Ideen schon lädt. Bei großen Körben werden doppelt Anfragen gestellt.

**Künftiges Problem:** Sind Ideen während der Anzeige gelöscht worden, fehlen sie stillschweigend in der Vorschau.
