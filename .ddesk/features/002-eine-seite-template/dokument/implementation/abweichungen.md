# Abweichungen F-002

## Emulator-Tests für Speichern und Abruf (T8)

- **Geplant:** Transaktions- und Bucket-Pfade (T3, T4) mit Emulator, falls verfügbar; sonst manuell gegen das Projekt dokumentieren, inklusive Aufräumen bei Fehler.
- **Gebaut:** Keine automatisierten Tests für Speichern, Abruf, Bildauslieferung und Autocomplete gegen Firestore oder den Bucket. Die Regeln sind über reine Funktionen und den 401-Pfad getestet.
- **Warum:** In dieser Umsetzung ist kein Firestore- oder Bucket-Emulator eingerichtet. Das Aufräumen bei Fehler ist im Code, aber nicht gegen echte Dienste geprüft.

## Projekt-Checks ohne `make check`

- **Geplant:** Vorab `go vet`, `go test`, `tsc`, `vitest`, `npm run build`, dazu die Git-Hooks über `make check`.
- **Gebaut:** Alle genannten Befehle einzeln ausgeführt, grün. Das Makefile fehlt im Repository, die Hooks laufen daher nicht automatisch.
- **Warum:** Das Projekt hat kein Makefile und keine installierten Hooks.
