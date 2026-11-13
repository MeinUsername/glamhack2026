# Code – Umsetzung F-008

- [neu] `masterprompt.go`: Variablen-Prüfung (`findVariables`, `unknownVariables`, `checkMasterPromptText`), Entscheidung ohne Datenbank (`planAppend`), Firestore-Zugriff in einer Transaktion (`appendVersion`), Handler.
  Warum: Die reinen Funktionen sind ohne Firestore testbar; die Transaktion verhindert doppelte Nummern.
- [neu] `admin.go`: `requireSignedIn` und `guardSignedIn` für das Lesen durch alle Rollen.
  Warum: Der bestehende `guardAdmin` prüft die Rolle und darf für das Lesen nicht verwendet werden.
- [geändert] `server.go`: vier API-Routen und die Seite `/admin/master-prompt`.
  Warum: Routen des Features, eingetragen an derselben Stelle wie die übrigen Admin-Routen.
- [neu] `frontend/src/prompt/render.ts`: `renderPrompt`, `localeFor`, `formatIdea`, `unknownVariables`.
  Warum: F-003 T1 und F-008 nutzen dieselbe Funktion (Plan, Festlegung „Rendern im Browser“).
- [neu] `frontend/src/pages/AdminMasterPrompt.tsx`: Editor mit Quelltext/Vorschau-Umschalter, Speichern-Schutz, Versionsliste mit Wiederherstellen.
  Warum: Umsetzung der Plan-Aufgaben T4 bis T6.
- [neu] Route `/admin/master-prompt` in `App.tsx`, Link «Master-Prompt» in `Layout.tsx` (nur Admins).
  Warum: Erreichbarkeit der Seite wie bei den Benutzern.
- [neu] Übersetzungsschlüssel `masterPrompt.*` und `nav.masterPrompt` in de, en, fr, it. Die fr- und it-Texte sind Entwürfe.
  Warum: Die Typen verlangen alle Schlüssel in allen Sprachen.
