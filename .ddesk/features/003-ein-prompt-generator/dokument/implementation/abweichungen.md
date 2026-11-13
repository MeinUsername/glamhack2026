# Abweichungen F-003

## Besucher: keine Weiterleitung
- Geplant: Besucher werden zur Anmeldung geleitet (AC-003-5, Plan «Schutz»).
- Gebaut: Die Korbseite ist öffentlich (Q-006-06). Besucher sehen die Korbliste und einen Link zur Anmeldung; der Generator ist nicht gerendert.
- Warum: Eine Weiterleitung von der öffentlichen Korbseite wäre ein Widerspruch zu Q-006-06.

## Lese-Route und Guard
- Geplant: T2 baut `GET /api/master-prompt` und einen Guard `guardUser` in F-003.
- Gebaut: Route und Guard (`requireSignedIn`) stammen aus F-008; F-003 ergänzt nur den Test.
- Warum: F-008 war bereits umgesetzt; doppelter Code war unnötig.

## Fläche in der Vorschau
- Geplant: `Fläche: …`.
- Gebaut: `Fläche: 2,5 m², Volumen 12 m³`, wenn beide Werte vorhanden sind (wie in F-008).
- Warum: Das Volumen soll nicht verloren gehen.
