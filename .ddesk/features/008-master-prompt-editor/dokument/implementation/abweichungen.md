# Abweichungen F-008

## Lesen des Master-Prompts durch alle Rollen
- Geplant: alle Endpunkte von F-008 nur für Admins (D9, Q-008-08).
- Gebaut: `GET /api/master-prompt` für jede eingeloggte Rolle; Schreiben und Versionsliste bleiben Admin-only.
- Warum: Q-008-13 = 1 («Alle eingeloggten Rollen, D9 wird angepasst»). D9 der Spec muss entsprechend geändert werden; das ist noch nicht geschehen.

## Keine Version: Antwort der Admin-Liste
- Geplant: 404, wenn keine Version existiert.
- Gebaut: 200 mit leerer Liste.
- Warum: Die Editor-Seite braucht bei der ersten Anlage keine Sonderbehandlung.

## Autor in der Version
- Geplant: Feld `author_id`.
- Gebaut: zusätzlich `author_email`, weil die Versionsliste die E-Mail zeigen soll (Plan T6).
- Warum: Eine ID ist für Admins nicht lesbar.

## Vorschau der Fläche
- Geplant: `Fläche: …` mit der Fläche.
- Gebaut: `Fläche: 2,5 m², Volumen 12 m³`, wenn beide Werte vorhanden sind.
- Warum: Die Spec nennt Fläche und Volumen; das Volumen ginge sonst verloren.

## Speichern-Schutz
- Geplant: Schaltfläche deaktiviert, wenn der Text dem geladenen Stand entspricht.
- Gebaut: wie geplant, zusätzlich deaktiviert bei leerem Text.
- Warum: Ein leerer Master-Prompt wird vom Server ohnehin abgelehnt.
