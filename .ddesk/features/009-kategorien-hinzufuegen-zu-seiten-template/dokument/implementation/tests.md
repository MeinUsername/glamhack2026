# Tests – Umsetzung F-009

- [neu] `ideas_test.go`: AC-009-1 (keine, eine, alle vier gültig; nie `nil` gespeichert), AC-009-2 (fremder Wert und abweichende Schreibweise abgelehnt), AC-009-3 (Duplikat einmal, Reihenfolge erhalten), AC-009-6 (Seite ohne Feld liefert `[]`).
  Warum: Die Regeln liegen in reinen Funktionen.
- [neu] `frontend/src/ideas/IdeaForm.test.tsx`: AC-009-1 (Auswahl wird als Schlüssel gesendet; Speichern ohne Auswahl sendet `[]`).
- [neu] `frontend/src/ideas/CategoriesInfo.test.tsx`: AC-009-4 (Hover zeigt Kopf, vier Erklärungen, Quelle), Verknüpfung über `aria-describedby`, Schließen mit Escape, kein Auslöser bei `(hover: none)`.
  Warum: Q-009-06 ist per Test abgesichert.
- [neu] `frontend/src/ideas/IdeaPage.test.tsx`: AC-009-5 (Chips), AC-009-6 (kein Chip-Block).
- Nicht getestet: Öffnen des Tooltips per Tastaturfokus. In jsdom ist `:focus-visible` nicht verlässlich; der Pfad ist nur im Browser geprüft, falls überhaupt.
