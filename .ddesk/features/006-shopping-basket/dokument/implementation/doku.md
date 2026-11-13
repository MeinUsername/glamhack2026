# Dokumentation – Umsetzung F-006

> Der Korb liegt nur im Browser (localStorage) und speichert nur Idee-IDs. Er bleibt beim Neuladen und beim Abmelden erhalten.

*Annahme: Die Schaltfläche «In den Korb» erscheint nur auf der Idee-Seite. Die Übersicht kommt mit F-011.*

**Künftiges Problem: Besucher ohne Anmeldung sehen den Korb, aber die Einträge können nicht geladen werden, solange `GET /api/ideas/{id}` Anmeldung verlangt. Das löst F-012.**
