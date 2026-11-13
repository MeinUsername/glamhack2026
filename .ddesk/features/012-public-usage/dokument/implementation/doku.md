# Doku – Umsetzung F-012

> Ohne Anmeldung kann jeder Besucher Ideen anlegen und ändern. Nur der Admin-Bereich ist geschützt.

Die Seite `/login` ist nicht verlinkt. Sie erreicht man nur über die direkte URL.

*Annahme: Der Initialadmin bekommt sein Passwort aus dem Secret Manager. Ohne gesetztes Secret entsteht kein Account, die App startet aber.*

**Künftiges Problem:** Jeder Besucher kann jede Idee ändern oder löschen, weil D1 es so vorgibt. Es gibt keinen Schutz gegen Mutwillen.

**Künftiges Problem:** Der Cloud-Build-Deploy enthält `INITIAL_ADMIN_PASSWORD` noch nicht. Ohne Secret entsteht kein Initialadmin. Das Secret muss vor dem Deploy angelegt und eingebunden werden.

**Künftiges Problem:** Einladungslinks laufen nicht ab. Ein nicht eingelöster Link bleibt also gültig, bis er jemand verwendet.
