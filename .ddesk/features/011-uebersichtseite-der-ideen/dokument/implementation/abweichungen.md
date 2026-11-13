# Abweichungen F-011

## Listen-Endpoint in F-011 statt in F-002/F-004

- **Geplant (Spec):** Die Übersicht zeigt alle erfassten Ideen (F-002).
- **Gebaut:** `GET /api/ideas` kommt in F-011 dazu. F-002 hat keinen Listen-Endpoint; F-004 existiert nicht im Projekt.
- **Warum:** Ohne Liste gibt es keine Übersicht. Der Endpoint ist klein und kann von F-004 wiederverwendet werden.

## Angaben je Idee (Q-011-04) nach D5

- **Geplant (Entwurf des Nutzers, nicht eingereicht):** Titel, Beschreibung, Bild-Vorschau als Galerie, Kaufstatus.
- **Gebaut:** Titel, Bild-Vorschau (erstes Bild), Kaufstatus, wie D5 der Spec.
- **Warum:** Der Entwurf ist nicht eingereicht. Der Nutzer entscheidet, ob Beschreibung und Galerie nachgerüstet werden.

## Fragen Q-011-03, Q-011-04 und Q-011-05 nicht eingereicht

- **Stand:** Q-011-03 (eigene Seite) und Q-011-05 (alle eingeloggten Rollen) sind als Entwurf gespeichert und stimmen mit D4 und D3 überein. Q-011-04 weicht ab (siehe oben).
- **Warum offen:** Nur Q-011-01 und Q-011-02 sind eingereicht. Die übrigen sind nicht blockierend; die Umsetzung folgt der Spec.
