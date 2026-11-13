# Tests – Plan F-003

- [entworfen] Vitest für `renderPrompt`: Ersetzung von `{{ideas}}` und `{{language}}`, Format der Ideen, leerer Korb ergibt leeren Text, unbekannte Variable bleibt stehen. Testnamen mit AC-Nummer (AC-003-1, AC-003-4, AC-003-6).
  Warum: Die Ersetzung ist die Kernlogik, sie muss ohne Browser prüfbar sein.
- [entworfen] Vitest für die Komponente mit gemockten Hooks: Deaktivierung bei leerem Korb, Download-Inhalt, Clipboard-Aufruf (AC-003-2, AC-003-3, AC-003-6).
  Warum: Die Abnahmekriterien betreffen die Oberfläche, nicht nur die Funktion.
- [entworfen] Go-Test ohne Firestore für `guardUser`: Besucher ohne Login erhält 401 (AC-003-5).
  Warum: Stil wie `users_test.go`, kein Emulator nötig.
- [entworfen] Vorab: `go vet ./...`, `go test ./...`, `npm run typecheck`, `npm test`.
  Warum: Die bestehenden Prüfungen des Repos, ein eigenes `make check` gibt es nicht.
