# Tests – Umsetzung F-003

- [neu] Vitest `frontend/src/prompt/render.test.ts`: Ersetzung, Sprachformat, leerer Korb, unbekannter Platzhalter bleibt, Felder ohne Inhalt, unbekannte Variablen.
  Warum: T1 des Plans; die Testnamen tragen die Kriterien, wo sie zutreffen.
- [neu] Vitest `frontend/src/prompt/PromptGenerator.test.tsx`: AC-003-1 bis AC-003-6, plus Hinweis ohne Version.
  Warum: Der Generator läuft in der echten Korbseite (Routing und Layout), nur die HTTP-Antworten sind gestubbt.
- [neu] Go `TestAC003_5_MasterPromptReadNeedsSignIn` in `masterprompt_test.go`.
  Warum: 401 ohne Login für `GET /api/master-prompt`.
- [neu] Die Kriterien AC-003-2 und AC-003-3 prüfen den Inhalt des Blobs und den Aufruf der Zwischenablage, nicht die echte Datei oder die echte Zwischenablage des Browsers.
  Warum: jsdom hat keine echten Downloads und keine Zwischenablage.
