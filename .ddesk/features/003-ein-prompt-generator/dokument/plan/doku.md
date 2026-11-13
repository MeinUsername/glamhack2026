# Doku – Plan F-003

> Der Generator setzt in den Browser nur den Master-Text, die Ideen und die Sprache. Der fertige Prompt wird nirgends gespeichert.

*Annahme: Die Annahmen aus der Spec (leerer Korb, Datei `.md`, Schaltfläche Kopieren) gelten, bis Q-003-12 bestätigt ist.*

*Annahme: Die Format-Festlegungen für `{{ideas}}` und den Dateinamen sind Vorschläge des Plans und keine Vorgaben des Nutzers.*

**Künftiges Problem: Der Generator hängt an drei noch nicht umgesetzten Features (F-006, F-007, F-008). Ohne deren Schnittstellen bleibt F-003 blockiert.**

**Künftiges Problem: Der Lesezugriff auf den Master-Prompt für alle Rollen ändert F-008, D9. Bis dahin liefert `GET /api/master-prompt` für Nicht-Admins nichts Sinnvolles.**
