> Ohne Login ist die ganze Nutzung öffentlich. Nur der Admin-Bereich bleibt geschützt (D1).

> Admins kommen ausschließlich über Einladungslinks in die App. Ein Link ist einmalig und hat kein Ablaufdatum.

*Annahme: «Seiten» in der Spec sind die Ideen-Seiten aus F-002 (Collection `ideas`). Es gibt keine zweite Entität.*

*Annahme: Anonyme Seiten haben kein `created_by`. Eine Zuordnung zu einem Besucher gibt es nicht.*

*Annahme: Die Einladungsregel «Rolle admin» folgt aus «Admins kommen nur über Einladungslinks» (Q-012-10). Das ändert AC-001-4.*

*Annahme: Der Initialadmin meldet sich mit dem Passwort aus `INITIAL_ADMIN_PASSWORD` an. Ein Passwort-Reset gibt es nicht.*

**Künftiges Problem: Jeder Besucher kann Ideen und Seiten ändern (D1).** Das ist Entscheidung des Nutzers, Schutz ist nicht Teil dieses Plans.

**Künftiges Problem: Der Initialadmin entsteht nur, wenn `INITIAL_ADMIN_PASSWORD` beim Anlegen gesetzt ist.** Fehlt das Secret, startet die App, aber es gibt keinen Admin, bis das Passwort gesetzt und der Account angelegt ist.

**Künftiges Problem: Bestehende Einladungen aus F-001 haben ein `expires_at`.** Alte Dokumente bleiben gültig, weil das Feld ignoriert wird. Das ist gewollt (AC-012-8), sollte aber beim Deploy geprüft werden.

**Künftiges Problem: Das Feature hat 13 Kriterien, die Vorgabe sind drei bis acht.** Das spricht dafür, es zu schneiden.
