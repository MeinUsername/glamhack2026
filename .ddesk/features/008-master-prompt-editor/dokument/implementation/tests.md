# Tests – Umsetzung F-008

- [neu] Go `masterprompt_test.go`: `TestAC008_1_PlaceholdersAreAccepted`, `TestAC008_2_RoleGuards`, `TestAC008_3_RestoreAppendsNewVersion`, `TestAC008_4_UnchangedTextCreatesNoVersion`, `TestAC008_5_UnknownVariableIsRejected`, `TestFindVariablesIgnoresDuplicates`, `TestMasterPromptTextLimits`.
  Warum: Eine Prüfung je Kriterium; die Entscheidungen sind rein, Firestore wird nicht gebraucht.
- [neu] Vitest `frontend/src/prompt/render.test.ts`: Ersetzung, Sprachformat, leerer Korb, unbekannte Platzhalter, Felder ohne Inhalt.
  Warum: Die Funktion ist die Grundlage von AC-008-6 und AC-008-7.
- [neu] Vitest `frontend/src/pages/AdminMasterPrompt.test.tsx`: AC-008-3 (Wiederherstellen), AC-008-4 (Speichern gesperrt, keine Änderung), AC-008-5 (Namen vor dem Absenden), AC-008-6 (Vorschau mit Korb, `de (Deutsch)`), AC-008-7 (leerer Korb).
  Warum: Der Anschluss an Korb und Sprache wird mit Stubs geprüft.
- [neu] Nicht getestet: die Firestore-Transaktionen (`appendVersion`, `latestPromptVersion`) gegen einen echten oder simulierten Emulator. Es gibt keinen Emulator im Projekt.
  Warum: Kein Emulator eingerichtet; die Entscheidungslogik ist getrennt getestet.
