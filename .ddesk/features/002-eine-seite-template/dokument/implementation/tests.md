# Tests – Umsetzung F-002

- [neu] `ideas_test.go`: AC-002-2 (leere Eingabe gültig), AC-002-3 (Format über Bytes, Anzahl, Größe), AC-002-4 (Budget nur S/M/L/XL), AC-002-5 (Zahlen mit Komma oder Punkt), AC-002-6 (Duplikate ignorieren Groß-/Kleinschreibung), AC-002-7 (401 vor jedem Firestore-Zugriff); Grenzen für Text und Geräte.
  Warum: Diese Regeln brauchen weder Firestore noch Bucket.
- [neu] `frontend/src/ideas/IdeaForm.test.tsx`: AC-002-2, AC-002-3 (Anzahl, Größe, Format; kein Request bei Fehler), AC-002-4 (Optionen), AC-002-5 (Payload), Serverfehler behält die Eingaben.
  Warum: Vorabprüfung und Payload sind im Browser prüfbar.
- [neu] `frontend/src/ideas/EquipmentInput.test.tsx`: AC-002-6 (Vorschlag, neues Gerät per Enter, kein Duplikat), Entfernen eines Chips.
  Warum: Chip-Logik ist reine Oberflächenlogik mit gemocktem Autocomplete.
- [geändert] AC-002-1 (Speichern und Abruf über den Endpoint) ist nicht automatisiert getestet: kein Firestore- oder Bucket-Emulator im Test. Das ist eine Abweichung, siehe `abweichungen.md`.
  Warum: Der Plan sah Emulator-Tests vor, falls verfügbar; dazu fehlt die Einrichtung.
